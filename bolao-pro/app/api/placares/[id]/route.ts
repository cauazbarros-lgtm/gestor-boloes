import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { AtualizarPlacarInput } from '@/types';

interface Ctx { params: { id: string } }

/**
 * GET /api/placares/[id]
 * Aceita ID (UUID) ou slug.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { id } = params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const filtro = isUuid ? 'id' : 'slug';

  const { data, error } = await supabase
    .from('placares')
    .select('*')
    .eq(filtro, id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ sucesso: false, erro: 'Placar não encontrado' }, { status: 404 });
  }
  return NextResponse.json({ sucesso: true, data });
}

/**
 * PUT /api/placares/[id]
 * Atualiza placar (admin).
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as AtualizarPlacarInput;
  const admin = createAdminClient();

  const empty = (v: string | null | undefined) =>
    v == null || v.trim() === '' ? null : v;

  const update: Record<string, unknown> = {};
  if (body.titulo !== undefined) update.titulo = body.titulo;
  if (body.time_casa !== undefined) update.time_casa = body.time_casa;
  if (body.time_fora !== undefined) update.time_fora = body.time_fora;
  if (body.escudo_casa !== undefined) update.escudo_casa = empty(body.escudo_casa);
  if (body.escudo_fora !== undefined) update.escudo_fora = empty(body.escudo_fora);
  if (body.data_jogo !== undefined)
    update.data_jogo = empty(body.data_jogo) ? null : new Date(body.data_jogo as string).toISOString();
  if (body.premio_acumulado !== undefined) update.premio_acumulado = body.premio_acumulado;
  if (body.valor_cota !== undefined) update.valor_cota = body.valor_cota;
  if (body.status !== undefined) update.status = body.status;
  if (body.link_checkout !== undefined) update.link_checkout = empty(body.link_checkout);
  if (body.descricao !== undefined) update.descricao = empty(body.descricao);
  if (body.regras !== undefined) update.regras = empty(body.regras);
  if (body.gols_casa !== undefined) update.gols_casa = body.gols_casa;
  if (body.gols_fora !== undefined) update.gols_fora = body.gols_fora;

  const { error } = await admin
    .from('placares')
    .update(update)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }

  // Se preencheu resultado e o placar está finalizado, marca ganhadores automaticamente
  if (body.gols_casa != null && body.gols_fora != null) {
    // Reset ganhadores anteriores
    await admin.from('palpites_placar').update({ ganhador: false }).eq('placar_id', params.id);
    // Marca ganhadores: quem acertou exatamente os gols
    await admin
      .from('palpites_placar')
      .update({ ganhador: true })
      .eq('placar_id', params.id)
      .eq('gols_casa_palpite', body.gols_casa)
      .eq('gols_fora_palpite', body.gols_fora);
  }

  return NextResponse.json({ sucesso: true });
}

/**
 * DELETE /api/placares/[id]
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from('placares').delete().eq('id', params.id);

  if (error) return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  return NextResponse.json({ sucesso: true });
}
