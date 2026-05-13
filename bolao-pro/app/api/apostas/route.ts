import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { gerarNumeroCotaRPC } from '@/lib/gerarCota';
import type { CriarApostaInput } from '@/types';

/**
 * POST /api/apostas
 * Registra uma nova aposta (pública).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as CriarApostaInput;

  // Validação
  if (!body.bolao_id || !body.nome_apostador || !body.email_apostador) {
    return NextResponse.json(
      { sucesso: false, erro: 'Campos obrigatórios: bolao_id, nome_apostador, email_apostador' },
      { status: 400 }
    );
  }
  if (!body.palpites || body.palpites.length === 0) {
    return NextResponse.json(
      { sucesso: false, erro: 'É necessário enviar palpites' },
      { status: 400 }
    );
  }
  if (!/\S+@\S+\.\S+/.test(body.email_apostador)) {
    return NextResponse.json(
      { sucesso: false, erro: 'E-mail inválido' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Valida bolão (existe, está aberto, prazo)
  const { data: bolao, error: errBolao } = await admin
    .from('boloes')
    .select('id, rodada, status, data_limite')
    .eq('id', body.bolao_id)
    .maybeSingle();

  if (errBolao || !bolao) {
    return NextResponse.json({ sucesso: false, erro: 'Bolão não encontrado' }, { status: 404 });
  }
  if (bolao.status !== 'aberto') {
    return NextResponse.json(
      { sucesso: false, erro: 'Este bolão não está mais aberto para apostas' },
      { status: 400 }
    );
  }
  if (bolao.data_limite && new Date(bolao.data_limite).getTime() < Date.now()) {
    return NextResponse.json(
      { sucesso: false, erro: 'O prazo para apostas já expirou' },
      { status: 400 }
    );
  }

  // Valida que todos os jogos têm palpite
  const { data: jogos } = await admin
    .from('jogos')
    .select('id')
    .eq('bolao_id', bolao.id);

  if (!jogos || jogos.length === 0) {
    return NextResponse.json(
      { sucesso: false, erro: 'Bolão sem jogos cadastrados' },
      { status: 400 }
    );
  }

  const idsJogos = new Set(jogos.map((j) => j.id));
  const idsPalpites = new Set(body.palpites.map((p) => p.jogo_id));
  if (idsJogos.size !== idsPalpites.size || ![...idsJogos].every((id) => idsPalpites.has(id))) {
    return NextResponse.json(
      { sucesso: false, erro: 'Você precisa palpitar em todos os jogos da rodada' },
      { status: 400 }
    );
  }

  const palpitesValidos = body.palpites.every((p) =>
    ['casa', 'empate', 'fora'].includes(p.palpite)
  );
  if (!palpitesValidos) {
    return NextResponse.json(
      { sucesso: false, erro: 'Palpite inválido. Use casa, empate ou fora.' },
      { status: 400 }
    );
  }

  // Gera número da cota
  let numeroCota: string;
  try {
    numeroCota = await gerarNumeroCotaRPC(admin, bolao.id);
  } catch (e: unknown) {
    return NextResponse.json(
      { sucesso: false, erro: 'Falha ao gerar número da cota' },
      { status: 500 }
    );
  }

  const { data: aposta, error: errInsert } = await admin
    .from('apostas')
    .insert({
      bolao_id: bolao.id,
      numero_cota: numeroCota,
      nome_apostador: body.nome_apostador.trim(),
      email_apostador: body.email_apostador.trim().toLowerCase(),
      telefone_apostador: body.telefone_apostador?.trim() ?? null,
      palpites: body.palpites,
      status_pagamento: 'pendente',
    })
    .select()
    .single();

  if (errInsert || !aposta) {
    return NextResponse.json(
      { sucesso: false, erro: errInsert?.message ?? 'Erro ao registrar aposta' },
      { status: 500 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  return NextResponse.json(
    {
      sucesso: true,
      numero_cota: aposta.numero_cota,
      aposta_id: aposta.id,
      link_cota: `${base}/cota/${aposta.id}`,
    },
    { status: 201 }
  );
}

/**
 * GET /api/apostas?bolao_id=...
 * Lista apostas de um bolão (admin).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bolaoId = url.searchParams.get('bolao_id');
  const status = url.searchParams.get('status_pagamento');

  const admin = createAdminClient();
  let query = admin.from('apostas').select('*').order('criado_em', { ascending: false });
  if (bolaoId) query = query.eq('bolao_id', bolaoId);
  if (status) query = query.eq('status_pagamento', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true, data });
}
