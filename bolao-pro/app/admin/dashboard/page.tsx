import Link from 'next/link';
import { Trophy, Ticket, DollarSign, Users, ArrowUpRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatBRL, formatDataHora } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function carregarStats() {
  const admin = createAdminClient();

  const hojeISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [boloesAtivos, apostasHoje, apostasConfirmadas, todasApostas, ultimasApostas, todosBoloes] = await Promise.all([
    admin.from('boloes').select('id', { count: 'exact', head: true }).eq('status', 'aberto'),
    admin.from('apostas').select('id', { count: 'exact', head: true }).gte('criado_em', hojeISO),
    admin.from('apostas').select('bolao_id').eq('status_pagamento', 'confirmado'),
    admin.from('apostas').select('email_apostador'),
    admin.from('apostas').select('*').order('criado_em', { ascending: false }).limit(10),
    admin.from('boloes').select('id, titulo, valor_cota'),
  ]);

  // Total arrecadado = (apostas confirmadas) × (valor_cota do respectivo bolão)
  const valorPorBolao = new Map<string, number>();
  for (const b of todosBoloes.data ?? []) valorPorBolao.set(b.id, Number(b.valor_cota));
  const totalArrecadado = (apostasConfirmadas.data ?? []).reduce(
    (acc, a) => acc + (valorPorBolao.get(a.bolao_id) ?? 0),
    0
  );

  const apostadoresUnicos = new Set((todasApostas.data ?? []).map((a) => a.email_apostador)).size;

  // Contagem por bolão — query dedicada
  const { data: contagensBolao } = await admin
    .from('apostas')
    .select('bolao_id');
  const apostasPorBolaoMap = new Map<string, number>();
  for (const a of contagensBolao ?? []) {
    apostasPorBolaoMap.set(a.bolao_id, (apostasPorBolaoMap.get(a.bolao_id) ?? 0) + 1);
  }

  const apostasPorBolao = (todosBoloes.data ?? []).map((b) => ({
    bolao_id: b.id,
    titulo: b.titulo,
    total: apostasPorBolaoMap.get(b.id) ?? 0,
  })).sort((a, b) => b.total - a.total).slice(0, 6);

  return {
    boloesAtivos: boloesAtivos.count ?? 0,
    apostasHoje: apostasHoje.count ?? 0,
    totalArrecadado,
    apostadoresUnicos,
    ultimasApostas: ultimasApostas.data ?? [],
    apostasPorBolao,
    nomesBoloes: new Map((todosBoloes.data ?? []).map((b) => [b.id, b.titulo])),
  };
}

export default async function DashboardPage() {
  const stats = await carregarStats();
  const maxApostas = Math.max(...stats.apostasPorBolao.map((b) => b.total), 1);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral dos seus bolões</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Bolões ativos" valor={stats.boloesAtivos} icon={Trophy} cor="verde" />
        <StatCard label="Apostas (24h)" valor={stats.apostasHoje} icon={Ticket} cor="amarelo" />
        <StatCard label="Arrecadado" valor={formatBRL(stats.totalArrecadado)} icon={DollarSign} cor="verde" variacao="apenas confirmadas" />
        <StatCard label="Apostadores" valor={stats.apostadoresUnicos} icon={Users} cor="azul" variacao="únicos por e-mail" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de apostas por bolão */}
        <div className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Apostas por bolão</h2>
          {stats.apostasPorBolao.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum bolão criado ainda.</p>
          ) : (
            <div className="space-y-3">
              {stats.apostasPorBolao.map((b) => (
                <div key={b.bolao_id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <Link href={`/admin/boloes/${b.bolao_id}/apostas`} className="text-gray-300 hover:text-white truncate flex-1 pr-2">
                      {b.titulo}
                    </Link>
                    <span className="text-white font-bold tabular-nums">{b.total}</span>
                  </div>
                  <div className="h-2 bg-admin-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brasil-verde to-brasil-verde-claro"
                      style={{ width: `${(b.total / maxApostas) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas apostas */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Últimas apostas</h2>
            <Link href="/admin/boloes" className="text-xs text-brasil-verde-claro hover:underline inline-flex items-center gap-0.5">
              ver tudo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {stats.ultimasApostas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma aposta registrada.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.ultimasApostas.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">{a.nome_apostador}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {a.numero_cota} · {formatDataHora(a.criado_em)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      a.status_pagamento === 'confirmado'
                        ? 'success'
                        : a.status_pagamento === 'cancelado'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {a.status_pagamento === 'confirmado' ? '✓' : a.status_pagamento === 'cancelado' ? '✗' : '⏳'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
