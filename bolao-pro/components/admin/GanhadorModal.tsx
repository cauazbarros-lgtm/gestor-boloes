'use client';

import { useMemo, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Aposta, BolaoComJogos } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  bolao: BolaoComJogos;
  apostas: Aposta[];
  onUpdated: () => void;
}

export function GanhadorModal({ open, onClose, bolao, apostas, onUpdated }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [ganhadorEscolhidoId, setGanhadorEscolhidoId] = useState<string | null>(null);

  // Calcula ranking
  const ranking = useMemo(() => {
    return apostas
      .filter((a) => a.status_pagamento === 'confirmado')
      .map((a) => {
        let acertos = 0;
        for (const j of bolao.jogos) {
          if (j.resultado) {
            const p = a.palpites.find((pp) => pp.jogo_id === j.id);
            if (p?.palpite === j.resultado) acertos++;
          }
        }
        return { aposta: a, acertos };
      })
      .sort((a, b) => b.acertos - a.acertos);
  }, [apostas, bolao]);

  const maxAcertos = ranking[0]?.acertos ?? 0;
  const empatados = ranking.filter((r) => r.acertos === maxAcertos);

  async function marcarGanhador(apostaId: string) {
    setLoading(true);
    try {
      // Primeiro, desmarca todos os anteriores
      await fetch(`/api/apostas/bulk-ganhador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bolao_id: bolao.id, aposta_id_ganhador: apostaId }),
      });
      toast.show('🏆 Ganhador definido!', 'success');
      setGanhadorEscolhidoId(apostaId);
      onUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  function sortearAleatorio() {
    if (empatados.length === 0) return;
    const sorteado = empatados[Math.floor(Math.random() * empatados.length)];
    marcarGanhador(sorteado.aposta.id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Apurar ganhador" size="lg">
      {ranking.length === 0 ? (
        <p className="text-gray-600">Nenhuma aposta confirmada para este bolão.</p>
      ) : (
        <div>
          <div className="bg-gradient-to-br from-brasil-verde/10 to-emerald-50 border border-brasil-verde/30 rounded-lg p-4 mb-4">
            <div className="text-xs text-brasil-verde-escuro uppercase font-bold mb-1">Líder(es)</div>
            <div className="text-lg font-bold text-gray-900 mb-1">
              {empatados.length} {empatados.length === 1 ? 'apostador' : 'apostadores empatados'} com {maxAcertos} acertos
            </div>
            {empatados.length > 1 && (
              <Button onClick={sortearAleatorio} loading={loading} size="sm" variant="primary">
                <Sparkles className="h-4 w-4" />
                Sortear ganhador entre os empatados
              </Button>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mb-2">Ranking</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {ranking.map((r, idx) => {
              const empatado = r.acertos === maxAcertos;
              return (
                <div
                  key={r.aposta.id}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm border-b last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } ${empatado ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-gray-500 w-6 text-right tabular-nums">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {r.aposta.nome_apostador}
                        {r.aposta.ganhador && (
                          <Trophy className="h-3.5 w-3.5 text-amber-500 inline ml-1.5" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{r.aposta.numero_cota}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-brasil-verde tabular-nums">
                      {r.acertos}/{bolao.jogos.length}
                    </span>
                    {empatado && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => marcarGanhador(r.aposta.id)}
                        loading={loading && ganhadorEscolhidoId === r.aposta.id}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Marcar ganhador
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
