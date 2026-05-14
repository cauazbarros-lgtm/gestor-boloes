import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { PalpitesPlacarTable } from '@/components/admin/PalpitesPlacarTable';
import { Badge } from '@/components/ui/Badge';
import type { Placar, PalpitePlacar } from '@/types';
import { formatBRL } from '@/lib/utils';

interface Props { params: { id: string } }

export const dynamic = 'force-dynamic';

const statusBadge = {
  aberto: { label: 'Aberto', variant: 'success' as const },
  encerrado: { label: 'Encerrado', variant: 'warning' as const },
  finalizado: { label: 'Finalizado', variant: 'info' as const },
};

async function carregar(id: string): Promise<{ placar: Placar; palpites: PalpitePlacar[] } | null> {
  const admin = createAdminClient();
  const { data: placar } = await admin.from('placares').select('*').eq('id', id).maybeSingle();
  if (!placar) return null;
  const { data: palpites } = await admin
    .from('palpites_placar')
    .select('*')
    .eq('placar_id', id)
    .order('criado_em', { ascending: false });
  return { placar, palpites: palpites ?? [] };
}

export default async function PalpitesPlacarPage({ params }: Props) {
  const dados = await carregar(params.id);
  if (!dados) notFound();
  const { placar, palpites } = dados;

  const confirmadas = palpites.filter((p) => p.status_pagamento === 'confirmado').length;
  const arrecadado = confirmadas * Number(placar.valor_cota);
  const ganhadores = palpites.filter((p) => p.ganhador).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link
        href="/admin/placares"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={statusBadge[placar.status as keyof typeof statusBadge].variant}>
              {statusBadge[placar.status as keyof typeof statusBadge].label}
            </Badge>
            {placar.gols_casa != null && placar.gols_fora != null && (
              <Badge variant="info">
                Resultado: {placar.gols_casa} × {placar.gols_fora}
              </Badge>
            )}
            {ganhadores > 0 && (
              <Badge variant="success">
                <Trophy className="h-3 w-3 inline mr-0.5" /> {ganhadores} {ganhadores === 1 ? 'ganhador' : 'ganhadores'}
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-white">{placar.titulo}</h1>
          <div className="text-sm text-gray-400 mt-1">
            {placar.time_casa} × {placar.time_fora} ·
            {' '}{palpites.length} palpite{palpites.length === 1 ? '' : 's'} ·
            {' '}{confirmadas} confirmada{confirmadas === 1 ? '' : 's'} ·
            {' '}<strong className="text-emerald-400">{formatBRL(arrecadado)}</strong> arrecadado
          </div>
        </div>
      </div>

      <PalpitesPlacarTable placar={placar} palpites={palpites} />
    </div>
  );
}
