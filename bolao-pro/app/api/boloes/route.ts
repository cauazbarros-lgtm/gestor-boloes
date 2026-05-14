import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { gerarSlug } from '@/lib/gerarSlug';
import type { CriarBolaoInput } from '@/types';

/**
 * GET /api/boloes
 * Lista todos os bolões. Público pode ver apenas abertos/finalizados;
 * admin (autenticado) vê todos.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const supabase = createClient();

  let query = supabase
    .from('boloes')
    .select('*')
    .order('criado_em', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true, data });
}

/**
 * POST /api/boloes
 * Cria um novo bolão (com jogos). Requer admin autenticado.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });
  }

  const body = (await req.json()) as CriarBolaoInput;

  // Validações básicas
  if (!body.titulo || body.rodada == null || body.valor_cota == null) {
    return NextResponse.json(
      { sucesso: false, erro: 'Campos obrigatórios: titulo, rodada, valor_cota' },
      { status: 400 }
    );
  }
  if (!body.jogos || body.jogos.length === 0) {
    return NextResponse.json(
      { sucesso: false, erro: 'É necessário pelo menos 1 jogo' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const slug = gerarSlug(body.titulo, body.rodada);

  const { data: bolao, error: errBolao } = await admin
    .from('boloes')
    .insert({
      slug,
      titulo: body.titulo,
      rodada: body.rodada,
      premio_acumulado: body.premio_acumulado ?? 0,
      valor_cota: body.valor_cota,
      data_limite: body.data_limite ?? null,
      descricao: body.descricao ?? null,
      regras: body.regras ?? null,
      link_checkout: body.link_checkout ?? null,
      status: 'aberto',
    })
    .select()
    .single();

  if (errBolao || !bolao) {
    return NextResponse.json(
      { sucesso: false, erro: errBolao?.message ?? 'Erro ao criar bolão' },
      { status: 500 }
    );
  }

  // Insere os jogos (normaliza strings vazias para null)
  const empty = (v: string | null | undefined) =>
    v == null || v.trim() === '' ? null : v;
  const jogosParaInserir = body.jogos.map((j, idx) => ({
    bolao_id: bolao.id,
    ordem: j.ordem ?? idx + 1,
    time_casa: j.time_casa.trim(),
    time_fora: j.time_fora.trim(),
    escudo_casa: empty(j.escudo_casa),
    escudo_fora: empty(j.escudo_fora),
    data_jogo: empty(j.data_jogo) ? null : new Date(j.data_jogo as string).toISOString(),
  }));

  const { error: errJogos } = await admin.from('jogos').insert(jogosParaInserir);
  if (errJogos) {
    // Rollback simples: deleta o bolão
    await admin.from('boloes').delete().eq('id', bolao.id);
    return NextResponse.json({ sucesso: false, erro: errJogos.message }, { status: 500 });
  }

  return NextResponse.json({ sucesso: true, data: bolao }, { status: 201 });
}
