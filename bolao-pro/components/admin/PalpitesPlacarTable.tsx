'use client';

import { useMemo, useState } from 'react';
import { Search, Check, X, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDataHora, cn } from '@/lib/utils';
import type { Placar, PalpitePlacar, StatusPagamento } from '@/types';

interface Props {
  placar: Placar;
  palpites: PalpitePlacar[];
}

export function PalpitesPlacarTable({ placar, palpites: palpitesIniciais }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [palpites, setPalpites] = useState(palpitesIniciais);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusPagamento>('todos');

  const temResultado = placar.gols_casa != null && placar.gols_fora != null;

  const filtradas = useMemo(() => {
    return palpites.filter((a) => {
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
  }, [palpites, busca, filtroStatus]);

  async function atualizarStatus(id: string, status: StatusPagamento) {
    const res = await fetch(`/api/palpites-placar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_pagamento: status }),
    });
    const data = await res.json();
    if (!res.ok || !data.sucesso) {
      toast.show(data.erro ?? 'Erro ao atualizar', 'error');
      return;
    }
    setPalpites((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status_pagamento: status } : a))
    );
    toast.show('Atualizado!', 'success');
    router.refresh();
  }

  const totalConfirmadas = palpites.filter((a) => a.status_pagamento === 'confirmado').length;
  const totalPendentes = palpites.filter((a) => a.status_pagamento === 'pendente').length;

  return (
    <>
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
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-admin-border text-xs text-gray-400">
          <span>Total: <strong className="text-white">{palpites.length}</strong></span>
          <span>Confirmadas: <strong className="text-emerald-400">{totalConfirmadas}</strong></span>
          <span>Pendentes: <strong className="text-amber-400">{totalPendentes}</strong></span>
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-admin-border">
                <th className="px-4 py-3">Cota</th>
                <th className="px-4 py-3">Apostador</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Palpite</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Nenhum palpite encontrado.
                  </td>
                </tr>
              ) : (
                filtradas.map((a) => {
                  const acertou = temResultado
                    && a.gols_casa_palpite === placar.gols_casa
                    && a.gols_fora_palpite === placar.gols_fora;
                  return (
                    <tr key={a.id} className={cn(
                      "border-b border-admin-border/50 last:border-0 hover:bg-admin-bg/50",
                      acertou && "bg-emerald-500/5"
                    )}>
                      <td className="px-4 py-3 font-mono text-xs text-white whitespace-nowrap">
                        {a.numero_cota}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{a.nome_apostador}</div>
                        {a.ganhador && (
                          <Badge variant="success" className="mt-0.5">
                            <Trophy className="h-3 w-3 inline mr-0.5" /> Ganhador
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        <div>{a.email_apostador}</div>
                        {a.telefone_apostador && <div className="text-gray-500">{a.telefone_apostador}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "font-bold text-lg tabular-nums",
                          acertou ? "text-emerald-400" : "text-white"
                        )}>
                          {a.gols_casa_palpite} × {a.gols_fora_palpite}
                          {acertou && <span className="ml-1.5">🎯</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            a.status_pagamento === 'confirmado' ? 'success'
                              : a.status_pagamento === 'cancelado' ? 'danger'
                                : 'warning'
                          }
                        >
                          {a.status_pagamento === 'confirmado' ? '✓ Confirmado'
                            : a.status_pagamento === 'cancelado' ? '✗ Cancelado'
                              : '⏳ Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDataHora(a.criado_em)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
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
    </>
  );
}
