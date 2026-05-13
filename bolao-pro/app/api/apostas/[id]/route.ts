import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { AtualizarApostaInput } from '@/types';

interface Ctx { params: { id: string } }

/**
 * GET /api/apostas/[id]
 * Retorna a aposta com bolão + jogos (público — comprovante).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = createAdminClient();

  const { data: aposta, error } = await admin
    .from('apostas')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !aposta) {
    return NextResponse.json(
      { sucesso: false, erro: 'Cota não encontrada' },
      { status: 404 }
    );
  }

  const { data: bolao } = await admin
    .from('boloes')
    .select('*')
    .eq('id', aposta.bolao_id)
    .single();

  const { data: jogos } = await admin
    .from('jogos')
    .select('*')
    .eq('bolao_id', aposta.bolao_id)
    .order('ordem', { ascending: true });

  return NextResponse.json({
    sucesso: true,
    data: { ...aposta, bolao: { ...bolao, jogos: jogos ?? [] } },
  });
}

/**
 * PATCH /api/apostas/[id]
 * Atualiza status de pagamento ou marca como ganhador (admin).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as AtualizarApostaInput;
  const admin = createAdminClient();

  const update: Record<string, unknown> = {};
  if (body.status_pagamento) update.status_pagamento = body.status_pagamento;
  if (typeof body.ganhador === 'boolean') update.ganhador = body.ganhador;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { sucesso: false, erro: 'Nenhum campo para atualizar' },
      { status: 400 }
    );
  }

  const { error } = await admin.from('apostas').update(update).eq('id', params.id);
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true });
}
