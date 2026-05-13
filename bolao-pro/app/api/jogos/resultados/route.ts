import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { ResultadoJogo } from '@/types';

interface Body {
  bolao_id: string;
  resultados: Array<{ jogo_id: string; resultado: ResultadoJogo }>;
}

/**
 * PATCH /api/jogos/resultados
 * Salva os resultados dos jogos e recalcula os acertos de cada aposta do bolão.
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.bolao_id || !Array.isArray(body.resultados)) {
    return NextResponse.json({ sucesso: false, erro: 'Payload inválido' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Atualiza resultado de cada jogo
  for (const r of body.resultados) {
    if (!['casa', 'empate', 'fora'].includes(r.resultado)) continue;
    await admin
      .from('jogos')
      .update({ resultado: r.resultado })
      .eq('id', r.jogo_id)
      .eq('bolao_id', body.bolao_id);
  }

  // Busca todos os jogos atualizados do bolão
  const { data: jogos } = await admin
    .from('jogos')
    .select('id, resultado')
    .eq('bolao_id', body.bolao_id);

  const mapaResultados = new Map<string, ResultadoJogo>();
  for (const j of jogos ?? []) {
    if (j.resultado) mapaResultados.set(j.id, j.resultado as ResultadoJogo);
  }

  // Recalcula acertos de todas as apostas do bolão
  const { data: apostas } = await admin
    .from('apostas')
    .select('id, palpites')
    .eq('bolao_id', body.bolao_id);

  for (const aposta of apostas ?? []) {
    const palpites = (aposta.palpites as Array<{ jogo_id: string; palpite: ResultadoJogo }>) ?? [];
    let acertos = 0;
    for (const p of palpites) {
      if (mapaResultados.get(p.jogo_id) === p.palpite) acertos++;
    }
    await admin.from('apostas').update({ acertos }).eq('id', aposta.id);
  }

  return NextResponse.json({ sucesso: true });
}
