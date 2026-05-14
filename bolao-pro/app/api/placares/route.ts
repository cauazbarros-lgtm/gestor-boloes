import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { gerarSlug } from '@/lib/gerarSlug';
import type { CriarPlacarInput } from '@/types';

/**
 * GET /api/placares
 * Lista todos os placares.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const supabase = createClient();

  let query = supabase
    .from('placares')
    .select('*')
    .order('criado_em', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true, data });
}

/**
 * POST /api/placares
 * Cria um novo placar exato (admin).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const body = (await req.json()) as CriarPlacarInput;

  if (!body.titulo || !body.time_casa || !body.time_fora || body.valor_cota == null) {
    return NextResponse.json(
      { sucesso: false, erro: 'Campos obrigatórios: titulo, time_casa, time_fora, valor_cota' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const slug = gerarSlug(body.titulo);

  const empty = (v: string | null | undefined) =>
    v == null || v.trim() === '' ? null : v;

  const { data: placar, error } = await admin
    .from('placares')
    .insert({
      slug,
      titulo: body.titulo.trim(),
      time_casa: body.time_casa.trim(),
      time_fora: body.time_fora.trim(),
      escudo_casa: empty(body.escudo_casa),
      escudo_fora: empty(body.escudo_fora),
      data_jogo: empty(body.data_jogo) ? null : new Date(body.data_jogo as string).toISOString(),
      premio_acumulado: body.premio_acumulado ?? 0,
      valor_cota: body.valor_cota,
      link_checkout: empty(body.link_checkout),
      descricao: empty(body.descricao),
      regras: empty(body.regras),
      status: 'aberto',
    })
    .select()
    .single();

  if (error || !placar) {
    return NextResponse.json(
      { sucesso: false, erro: error?.message ?? 'Erro ao criar placar' },
      { status: 500 }
    );
  }

  return NextResponse.json({ sucesso: true, data: placar }, { status: 201 });
}
