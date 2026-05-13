import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { ApostasTable } from '@/components/admin/ApostasTable';
import { Badge } from '@/components/ui/Badge';
import type { BolaoComJogos, Aposta } from '@/types';
import { formatBRL } from '@/lib/utils';

interface Props { params: { id: string } }

export const dynamic = 'force-dynamic';

async function carregar(id: string): Promise<{ bolao: BolaoComJogos; apostas: Aposta[] } | null> {
  const admin = createAdminClient();
  const { data: bolao } = await admin.from('boloes').select('*').eq('id', id).maybeSingle();
  if (!bolao) return null;
  const { data: jogos } = await admin
    .from('jogos')
    .select('*')
    .eq('bolao_id', id)
    .order('ordem', { ascending: true });
  const { data: apostas } = await admin
    .from('apostas')
    .select('*')
    .eq('bolao_id', id)
    .order('criado_em', { ascending: false });
  return { bolao: { ...bolao, jogos: jogos ?? [] }, apostas: apostas ?? [] };
}

const statusBadge = {
  aberto: { label: 'Aberto', variant: 'success' as const },
  encerrado: { label: 'Encerrado', variant: 'warning' as const },
  finalizado: { label: 'Finalizado', variant: 'info' as const },
};

export default async function ApostasBolaoPage({ params }: Props) {
  const dados = await carregar(params.id);
  if (!dados) notFound();
  const { bolao, apostas } = dados;

  const confirmadas = apostas.filter((a) => a.status_pagamento === 'confirmado').length;
  const arrecadado = confirmadas * Number(bolao.valor_cota);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link
        href="/admin/boloes"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={statusBadge[bolao.status].variant}>{statusBadge[bolao.status].label}</Badge>
            <span className="text-xs text-gray-500">Rodada {bolao.rodada}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">{bolao.titulo}</h1>
          <div className="text-sm text-gray-400 mt-1">
            {apostas.length} aposta{apostas.length === 1 ? '' : 's'} ·
            {' '}{confirmadas} confirmada{confirmadas === 1 ? '' : 's'} ·
            {' '}<strong className="text-emerald-400">{formatBRL(arrecadado)}</strong> arrecadado
          </div>
        </div>
      </div>

      <ApostasTable bolao={bolao} apostas={apostas} />
    </div>
  );
}
