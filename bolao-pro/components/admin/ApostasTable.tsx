'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Check,
  X,
  Eye,
  Download,
  Trophy,
  ListChecks,
  MoreVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDataHora, cn } from '@/lib/utils';
import type { Aposta, BolaoComJogos, StatusPagamento } from '@/types';
import { GanhadorModal } from './GanhadorModal';
import { ResultadosModal } from './ResultadosModal';

interface Props {
  bolao: BolaoComJogos;
  apostas: Aposta[];
}

const palpiteLabel: Record<string, string> = {
  casa: 'Casa',
  empate: 'Empate',
  fora: 'Fora',
};

export function ApostasTable({ bolao, apostas: apostasIniciais }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [apostas, setApostas] = useState(apostasIniciais);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusPagamento>('todos');
  const [detalhesAposta, setDetalhesAposta] = useState<Aposta | null>(null);
  const [resultadosOpen, setResultadosOpen] = useState(false);
  const [ganhadorOpen, setGanhadorOpen] = useState(false);

  const filtradas = useMemo(() => {
    return apostas.filter((a) => {
      if (filtroStatus !== 'todos' && a.status_pagamento !== filtroStatus) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          a.nome_apostador.toLowerCase().includes(q) ||
          a.numero_cota.toLowerCase().includes(q) ||
          a.email_apostador.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apostas, busca, filtroStatus]);

  // Calcula acertos para cada aposta (com base nos resultados)
  function calcAcertos(a: Aposta) {
    let acertos = 0;
    let resultados = 0;
    for (const j of bolao.jogos) {
      if (j.resultado) {
        resultados++;
        if (a.palpites.find((p) => p.jogo_id === j.id)?.palpite === j.resultado) acertos++;
      }
    }
    return { acertos, total: resultados };
  }

  async function atualizarStatus(id: string, status: StatusPagamento) {
    const res = await fetch(`/api/apostas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_pagamento: status }),
    });
    const data = await res.json();
    if (!res.ok || !data.sucesso) {
      toast.show(data.erro ?? 'Erro ao atualizar', 'error');
      return;
    }
    setApostas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status_pagamento: status } : a))
    );
    toast.show('Atualizado!', 'success');
  }

  const totalConfirmadas = apostas.filter((a) => a.status_pagamento === 'confirmado').length;
  const totalPendentes = apostas.filter((a) => a.status_pagamento === 'pendente').length;
  const todosJogosTemResultado = bolao.jogos.every((j) => j.resultado);

  return (
    <>
      {/* Filtros e ações */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cota ou e-mail..."
              className="w-full h-10 pl-9 pr-3 bg-admin-bg border border-admin-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-brasil-verde"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as 'todos' | StatusPagamento)}
            className="h-10 px-3 bg-admin-bg border border-admin-border rounded-lg text-white text-sm focus:outline-none focus:border-brasil-verde"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="confirmado">Confirmadas</option>
            <option value="cancelado">Canceladas</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResultadosOpen(true)}
            >
              <ListChecks className="h-4 w-4" /> Inserir resultados
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setGanhadorOpen(true)}
              disabled={!todosJogosTemResultado || bolao.status !== 'finalizado'}
              title={
                !todosJogosTemResultado
                  ? 'Insira os resultados de todos os jogos primeiro'
                  : bolao.status !== 'finalizado'
                  ? 'Mude o status do bolão para "finalizado" antes'
                  : ''
              }
            >
              <Trophy className="h-4 w-4" /> Apurar ganhador
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-admin-border text-xs text-gray-400">
          <span>Total: <strong className="text-white">{apostas.length}</strong></span>
          <span>Confirmadas: <strong className="text-emerald-400">{totalConfirmadas}</strong></span>
          <span>Pendentes: <strong className="text-amber-400">{totalPendentes}</strong></span>
          <span>Filtradas: <strong className="text-white">{filtradas.length}</strong></span>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-admin-border">
                <th className="px-4 py-3">Cota</th>
                <th className="px-4 py-3">Apostador</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Acertos</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Nenhuma aposta encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((a) => {
                  const { acertos, total } = calcAcertos(a);
                  return (
                    <tr key={a.id} className="border-b border-admin-border/50 last:border-0 hover:bg-admin-bg/50">
                      <td className="px-4 py-3 font-mono text-xs text-white whitespace-nowrap">
                        {a.numero_cota}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{a.nome_apostador}</div>
                        {a.ganhador && (
                          <Badge variant="success" className="mt-0.5">🏆 Ganhador</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        <div>{a.email_apostador}</div>
                        {a.telefone_apostador && <div className="text-gray-500">{a.telefone_apostador}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            a.status_pagamento === 'confirmado'
                              ? 'success'
                              : a.status_pagamento === 'cancelado'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {a.status_pagamento === 'confirmado'
                            ? '✓ Confirmado'
                            : a.status_pagamento === 'cancelado'
                            ? '✗ Cancelado'
                            : '⏳ Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white tabular-nums">
                        {total > 0 ? `${acertos}/${total}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDataHora(a.criado_em)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetalhesAposta(a)}
                            className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                            title="Ver palpites"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {a.status_pagamento !== 'confirmado' && (
                            <button
                              onClick={() => atualizarStatus(a.id, 'confirmado')}
                              className="p-2 rounded hover:bg-emerald-500/20 text-emerald-400"
                              title="Confirmar pagamento"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {a.status_pagamento !== 'cancelado' && (
                            <button
                              onClick={() => atualizarStatus(a.id, 'cancelado')}
                              className="p-2 rounded hover:bg-red-500/20 text-red-400"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <a
                            href={`/api/cotas/${a.id}`}
                            target="_blank"
                            rel="noopener"
                            className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                            title="Baixar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — detalhes da aposta */}
      <Modal
        open={!!detalhesAposta}
        onClose={() => setDetalhesAposta(null)}
        title={`Cota ${detalhesAposta?.numero_cota ?? ''}`}
        size="lg"
      >
        {detalhesAposta && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4 pb-4 border-b border-gray-200">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-500">Apostador</div>
                <div className="font-semibold">{detalhesAposta.nome_apostador}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-500">E-mail</div>
                <div>{detalhesAposta.email_apostador}</div>
              </div>
              {detalhesAposta.telefone_apostador && (
                <div className="col-span-2">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Telefone</div>
                  <div>{detalhesAposta.telefone_apostador}</div>
                </div>
              )}
            </div>

            <h3 className="font-bold mb-2">Palpites</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {bolao.jogos.map((jogo, idx) => {
                const p = detalhesAposta.palpites.find((pp) => pp.jogo_id === jogo.id);
                const acertou = jogo.resultado && p?.palpite === jogo.resultado;
                return (
                  <div
                    key={jogo.id}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm',
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    )}
                  >
                    <span>
                      <span className="text-gray-400 mr-1">{idx + 1}.</span>
                      {jogo.time_casa} × {jogo.time_fora}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">{p ? palpiteLabel[p.palpite] : '—'}</span>
                      {jogo.resultado && (
                        <span
                          className={cn(
                            'inline-flex w-5 h-5 items-center justify-center rounded-full text-xs font-bold',
                            acertou ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          )}
                        >
                          {acertou ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal — inserir resultados */}
      <ResultadosModal
        open={resultadosOpen}
        onClose={() => setResultadosOpen(false)}
        bolao={bolao}
        onSaved={() => router.refresh()}
      />

      {/* Modal — apurar ganhador */}
      <GanhadorModal
        open={ganhadorOpen}
        onClose={() => setGanhadorOpen(false)}
        apostas={apostas}
        bolao={bolao}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
