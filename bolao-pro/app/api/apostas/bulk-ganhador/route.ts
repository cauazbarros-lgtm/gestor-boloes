import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface Body {
  bolao_id: string;
  aposta_id_ganhador: string;
}

/**
 * POST /api/apostas/bulk-ganhador
 * Marca uma aposta como ganhadora do bolão (e desmarca quaisquer anteriores).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.bolao_id || !body.aposta_id_ganhador) {
    return NextResponse.json({ sucesso: false, erro: 'Payload inválido' }, { status: 400 });
  }

  const admin = createAdminClient();
  // Desmarca todos do bolão
  await admin.from('apostas').update({ ganhador: false }).eq('bolao_id', body.bolao_id);
  // Marca o escolhido
  const { error } = await admin
    .from('apostas')
    .update({ ganhador: true })
    .eq('id', body.aposta_id_ganhador);

  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true });
}
