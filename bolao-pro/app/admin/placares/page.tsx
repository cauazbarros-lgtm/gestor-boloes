import Link from 'next/link';
import { Plus, Target, ExternalLink, Settings, BarChart3 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { formatBRL, formatDataHora } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const statusBadge = {
  aberto: { label: 'Aberto', variant: 'success' as const },
  encerrado: { label: 'Encerrado', variant: 'warning' as const },
  finalizado: { label: 'Finalizado', variant: 'info' as const },
};

async function carregar() {
  const admin = createAdminClient();
  const { data: placares } = await admin
    .from('placares')
    .select('*')
    .order('criado_em', { ascending: false });

  const { data: stats } = await admin
    .from('palpites_placar')
    .select('placar_id, status_pagamento');

  const contagem = new Map<string, { total: number; confirmadas: number }>();
  for (const p of stats ?? []) {
    const c = contagem.get(p.placar_id) ?? { total: 0, confirmadas: 0 };
    c.total++;
    if (p.status_pagamento === 'confirmado') c.confirmadas++;
    contagem.set(p.placar_id, c);
  }

  return (placares ?? []).map((p) => ({
    ...p,
    total_palpites: contagem.get(p.id)?.total ?? 0,
    total_arrecadado: (contagem.get(p.id)?.confirmadas ?? 0) * Number(p.valor_cota),
  }));
}

export default async function PlacaresPage() {
  const placares = await carregar();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Placar Exato</h1>
          <p className="text-gray-400 text-sm mt-1">Jogos do dia onde o apostador adivinha o placar exato</p>
        </div>
        <Link
          href="/admin/placares/novo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brasil-verde hover:bg-brasil-verde-escuro text-white font-semibold rounded-lg transition"
        >
          <Plus className="h-4 w-4" /> Novo jogo do dia
        </Link>
      </div>

      {placares.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
          <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h2 className="font-bold text-white text-lg mb-1">Nenhum placar criado ainda</h2>
          <p className="text-gray-400 text-sm mb-5">Crie seu primeiro jogo de placar exato.</p>
          <Link
            href="/admin/placares/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brasil-verde hover:bg-brasil-verde-escuro text-white font-semibold rounded-lg transition"
          >
            <Plus className="h-4 w-4" /> Criar primeiro placar
          </Link>
        </div>
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-admin-border">
                  <th className="px-4 py-3">Jogo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3 text-right">Palpites</th>
                  <th className="px-4 py-3 text-right">Arrecadado</th>
                  <th className="px-4 py-3">Data jogo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {placares.map((p) => (
                  <tr key={p.id} className="border-b border-admin-border/50 last:border-0 hover:bg-admin-bg/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.titulo}</div>
                      <div className="text-xs text-gray-500">
                        {p.time_casa} × {p.time_fora} · {formatBRL(p.valor_cota)}/cota
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[p.status as keyof typeof statusBadge].variant}>
                        {statusBadge[p.status as keyof typeof statusBadge].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-white font-bold tabular-nums">
                      {p.gols_casa != null && p.gols_fora != null
                        ? `${p.gols_casa} × ${p.gols_fora}`
                        : <span className="text-gray-500 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">{p.total_palpites}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatBRL(p.total_arrecadado)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {p.data_jogo ? formatDataHora(p.data_jogo) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/placares/${p.id}/palpites`}
                          className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                          title="Ver palpites"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/placares/${p.id}`}
                          className="p-2 rounded hover:bg-admin-border text-gray-300 hover:text-white"
                          title="Editar"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/placar/${p.slug}`}
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
