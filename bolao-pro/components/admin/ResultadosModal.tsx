'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { BolaoComJogos, ResultadoJogo } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  bolao: BolaoComJogos;
  onSaved: () => void;
}

export function ResultadosModal({ open, onClose, bolao, onSaved }: Props) {
  const toast = useToast();
  const [resultados, setResultados] = useState<Record<string, ResultadoJogo | null>>(() => {
    const obj: Record<string, ResultadoJogo | null> = {};
    for (const j of bolao.jogos) obj[j.id] = j.resultado ?? null;
    return obj;
  });
  const [loading, setLoading] = useState(false);

  function set(id: string, valor: ResultadoJogo) {
    setResultados((prev) => ({ ...prev, [id]: prev[id] === valor ? null : valor }));
  }

  async function salvar() {
    setLoading(true);
    try {
      // Atualiza cada jogo via UPDATE direto na tabela (rota dedicada poderia ser criada)
      // Aqui usamos uma chamada PUT no bolão que aceita jogos completos.
      const jogosAtualizados = bolao.jogos.map((j) => ({
        time_casa: j.time_casa,
        time_fora: j.time_fora,
        escudo_casa: j.escudo_casa,
        escudo_fora: j.escudo_fora,
        data_jogo: j.data_jogo,
        ordem: j.ordem,
      }));
      // Solução prática: criamos endpoint específico para resultados:
      const res = await fetch(`/api/jogos/resultados`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bolao_id: bolao.id,
          resultados: Object.entries(resultados)
            .filter(([, v]) => v !== null)
            .map(([jogo_id, resultado]) => ({ jogo_id, resultado })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro ?? 'Erro ao salvar resultados');
      }
      toast.show('Resultados salvos!', 'success');
      onSaved();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const opcoes: { v: ResultadoJogo; l: string }[] = [
    { v: 'casa', l: 'Casa' },
    { v: 'empate', l: 'Empate' },
    { v: 'fora', l: 'Fora' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Inserir resultados" size="lg">
      <p className="text-sm text-gray-600 mb-4">
        Selecione o resultado de cada jogo. Após salvar, os acertos dos apostadores são calculados automaticamente.
      </p>

      <div className="space-y-2 mb-5">
        {bolao.jogos.map((jogo, idx) => (
          <div key={jogo.id} className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2 font-semibold">
              Jogo {idx + 1} · {jogo.time_casa} × {jogo.time_fora}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {opcoes.map((op) => {
                const ativo = resultados[jogo.id] === op.v;
                return (
                  <button
                    key={op.v}
                    type="button"
                    onClick={() => set(jogo.id, op.v)}
                    className={cn(
                      'py-2 rounded-lg text-sm font-bold border-2 transition',
                      ativo
                        ? 'bg-brasil-verde text-white border-brasil-verde'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-brasil-verde'
                    )}
                  >
                    {op.l}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={salvar} loading={loading}>Salvar resultados</Button>
      </div>
    </Modal>
  );
}
