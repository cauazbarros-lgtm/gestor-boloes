import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { AtualizarBolaoInput } from '@/types';

interface Ctx { params: { id: string } }

/**
 * GET /api/boloes/[id]
 * Retorna bolão com seus jogos. Aceita id (UUID) ou slug.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { id } = params;

  // Detecta se é UUID ou slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const filtro = isUuid ? 'id' : 'slug';

  const { data: bolao, error } = await supabase
    .from('boloes')
    .select('*')
    .eq(filtro, id)
    .maybeSingle();

  if (error || !bolao) {
    return NextResponse.json(
      { sucesso: false, erro: 'Bolão não encontrado' },
      { status: 404 }
    );
  }

  const { data: jogos } = await supabase
    .from('jogos')
    .select('*')
    .eq('bolao_id', bolao.id)
    .order('ordem', { ascending: true });

  return NextResponse.json({ sucesso: true, data: { ...bolao, jogos: jogos ?? [] } });
}

/**
 * PUT /api/boloes/[id]
 * Atualiza um bolão (admin). Pode substituir jogos.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as AtualizarBolaoInput;
  const admin = createAdminClient();

  const { jogos, ...campos } = body;

  const { error } = await admin
    .from('boloes')
    .update(campos)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }

  // Se vieram jogos, substitui os existentes
  if (jogos && jogos.length > 0) {
    await admin.from('jogos').delete().eq('bolao_id', params.id);
    const empty = (v: string | null | undefined) =>
      v == null || v.trim() === '' ? null : v;
    const jogosParaInserir = jogos.map((j, idx) => ({
      bolao_id: params.id,
      ordem: j.ordem ?? idx + 1,
      time_casa: j.time_casa.trim(),
      time_fora: j.time_fora.trim(),
      escudo_casa: empty(j.escudo_casa),
      escudo_fora: empty(j.escudo_fora),
      data_jogo: empty(j.data_jogo) ? null : new Date(j.data_jogo as string).toISOString(),
    }));
    const { error: errJogos } = await admin.from('jogos').insert(jogosParaInserir);
    if (errJogos) {
      return NextResponse.json({ sucesso: false, erro: errJogos.message }, { status: 500 });
    }
  }

  return NextResponse.json({ sucesso: true });
}

/**
 * DELETE /api/boloes/[id]
 * Remove um bolão (cascade remove jogos e apostas).
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from('boloes').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true });
}
