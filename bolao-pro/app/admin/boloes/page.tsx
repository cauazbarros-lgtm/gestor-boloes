import Link from 'next/link';
import { Plus, Trophy, ExternalLink, Settings, BarChart3 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { formatBRL, formatDataHora } from '@/lib/utils';
import type { Bolao } from '@/types';

export const dynamic = 'force-dynamic';

async function carregar() {
  const admin = createAdminClient();
  const { data: boloes } = await admin
    .from('boloes')
    .select('*')
    .order('criado_em', { ascending: false });

  // Stats por bolão
  const { data: stats } = await admin
    .from('apostas')
    .select('bolao_id, status_pagamento');

  const contagem = new Map<string, { total: number; confirmadas: number }>();
  for (const a of stats ?? []) {
    const c = contagem.get(a.bolao_id) ?? { total: 0, confirmadas: 0 };
    c.total++;
    if (a.status_pagamento === 'confirmado') c.confirmadas++;
    contagem.set(a.bolao_id, c);
  }

  return (boloes ?? []).map((b) => ({
    ...b,
    total_apostas: contagem.get(b.id)?.total ?? 0,
    total_arrecadado: (contagem.get(b.id)?.confirmadas ?? 0) * Number(b.valor_cota),
  }));
}

const statusBadge = {
  aberto: { label: 'Aberto', variant: 'success' as const },
  encerrado: { label: 'Encerrado', variant: 'warning' as const },
  finalizado: { label: 'Finalizado', variant: 'info' as const },
};

export default async function BoloesAdminPage() {
  const boloes = await carregar();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Bolões</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie todos os bolões cadastrados</p>
        </div>
        <Link
          href="/admin/boloes/novo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brasil-verde hover:bg-brasil-verde-escuro text-white font-semibold rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Novo bolão
        </Link>
      </div>

      {boloes.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h2 className="font-bold text-white text-lg mb-1">Nenhum bolão criado ainda</h2>
          <p className="text-gray-400 text-sm mb-5">Crie seu primeiro bolão para começar a receber apostas.</p>
          <Link
            href="/admin/boloes/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brasil-verde hover:bg-brasil-verde-escuro text-white font-semibold rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro bolão
          </Link>
        </div>
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-admin-border">
                  <th className="px-4 py-3">Bolão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Apostas</th>
                  <th className="px-4 py-3 text-right">Arrecadado</th>
                  <th className="px-4 py-3">Limite</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {boloes.map((b) => (
                  <tr key={b.id} className="border-b border-admin-border/50 last:border-0 hover:bg-admin-bg/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{b.titulo}</div>
                      <div className="text-xs text-gray-500">Rodada {b.rodada} · {formatBRL(b.valor_cota)}/cota</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[b.status].variant}>{statusBadge[b.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">{b.total_apostas}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatBRL(b.total_arrecadado)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {b.data_limite ? formatDataHora(b.data_limite) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/boloes/${b.id}/apostas`}
                          className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                          title="Ver apostas"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/boloes/${b.id}`}
                          className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                          title="Editar"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/bolao/${b.slug}`}
                          target="_blank"
                          className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                          title="Ver página pública"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
