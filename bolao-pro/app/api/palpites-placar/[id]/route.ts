import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface Ctx { params: { id: string } }

/**
 * GET /api/palpites-placar/[id]
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = createAdminClient();
  const { data: palpite, error } = await admin
    .from('palpites_placar')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !palpite) {
    return NextResponse.json({ sucesso: false, erro: 'Cota não encontrada' }, { status: 404 });
  }

  const { data: placar } = await admin
    .from('placares')
    .select('*')
    .eq('id', palpite.placar_id)
    .single();

  return NextResponse.json({ sucesso: true, data: { ...palpite, placar } });
}

/**
 * PATCH /api/palpites-placar/[id]
 * Atualiza status de pagamento ou ganhador.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  const update: Record<string, unknown> = {};
  if (body.status_pagamento) update.status_pagamento = body.status_pagamento;
  if (typeof body.ganhador === 'boolean') update.ganhador = body.ganhador;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ sucesso: false, erro: 'Nenhum campo para atualizar' }, { status: 400 });
  }

  const { error } = await admin.from('palpites_placar').update(update).eq('id', params.id);
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true });
}
