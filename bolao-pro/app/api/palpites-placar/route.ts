import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { CriarPalpitePlacarInput } from '@/types';

/**
 * POST /api/palpites-placar
 * Registra um palpite de placar exato (público).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as CriarPalpitePlacarInput;

  if (!body.placar_id || !body.nome_apostador || !body.email_apostador) {
    return NextResponse.json(
      { sucesso: false, erro: 'Campos obrigatórios: placar_id, nome_apostador, email_apostador' },
      { status: 400 }
    );
  }
  if (body.gols_casa_palpite == null || body.gols_fora_palpite == null) {
    return NextResponse.json(
      { sucesso: false, erro: 'Informe os gols de ambos os times.' },
      { status: 400 }
    );
  }
  if (body.gols_casa_palpite < 0 || body.gols_fora_palpite < 0) {
    return NextResponse.json(
      { sucesso: false, erro: 'Gols não podem ser negativos.' },
      { status: 400 }
    );
  }
  if (body.gols_casa_palpite > 20 || body.gols_fora_palpite > 20) {
    return NextResponse.json(
      { sucesso: false, erro: 'Gols máximo de 20 por time.' },
      { status: 400 }
    );
  }
  if (!/\S+@\S+\.\S+/.test(body.email_apostador)) {
    return NextResponse.json({ sucesso: false, erro: 'E-mail inválido' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Valida placar
  const { data: placar } = await admin
    .from('placares')
    .select('id, status, data_jogo')
    .eq('id', body.placar_id)
    .maybeSingle();

  if (!placar) {
    return NextResponse.json({ sucesso: false, erro: 'Placar não encontrado' }, { status: 404 });
  }
  if (placar.status !== 'aberto') {
    return NextResponse.json(
      { sucesso: false, erro: 'Este jogo não está mais aberto para palpites' },
      { status: 400 }
    );
  }
  if (placar.data_jogo && new Date(placar.data_jogo).getTime() < Date.now()) {
    return NextResponse.json(
      { sucesso: false, erro: 'O jogo já começou — palpites encerrados' },
      { status: 400 }
    );
  }

  // Gera número da cota via RPC
  const { data: numeroCota, error: errCota } = await admin.rpc('gerar_proximo_numero_cota_placar', {
    p_placar_id: placar.id,
  });

  if (errCota || !numeroCota) {
    return NextResponse.json(
      { sucesso: false, erro: 'Falha ao gerar número da cota' },
      { status: 500 }
    );
  }

  const { data: palpite, error } = await admin
    .from('palpites_placar')
    .insert({
      placar_id: placar.id,
      numero_cota: numeroCota,
      nome_apostador: body.nome_apostador.trim(),
      email_apostador: body.email_apostador.trim().toLowerCase(),
      telefone_apostador: body.telefone_apostador?.trim() ?? null,
      gols_casa_palpite: body.gols_casa_palpite,
      gols_fora_palpite: body.gols_fora_palpite,
      status_pagamento: 'pendente',
    })
    .select()
    .single();

  if (error || !palpite) {
    return NextResponse.json(
      { sucesso: false, erro: error?.message ?? 'Erro ao registrar palpite' },
      { status: 500 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  return NextResponse.json(
    {
      sucesso: true,
      numero_cota: palpite.numero_cota,
      palpite_id: palpite.id,
      link_cota: `${base}/cota-placar/${palpite.id}`,
    },
    { status: 201 }
  );
}

/**
 * GET /api/palpites-placar?placar_id=...
 * Lista palpites de um placar (admin).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const placarId = url.searchParams.get('placar_id');
  const status = url.searchParams.get('status_pagamento');

  const admin = createAdminClient();
  let query = admin.from('palpites_placar').select('*').order('criado_em', { ascending: false });
  if (placarId) query = query.eq('placar_id', placarId);
  if (status) query = query.eq('status_pagamento', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true, data });
}
