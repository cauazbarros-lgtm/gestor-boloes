import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { gerarPDFComprovanteBuffer } from '@/lib/gerarPDF';
import type { Aposta, BolaoComJogos } from '@/types';

interface Ctx { params: { id: string } }

/**
 * GET /api/cotas/[id]
 * Retorna o PDF do comprovante da cota.
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

  if (!bolao) {
    return NextResponse.json({ sucesso: false, erro: 'Bolão não encontrado' }, { status: 404 });
  }

  const bolaoCompleto: BolaoComJogos = { ...bolao, jogos: jogos ?? [] };
  const pdf = gerarPDFComprovanteBuffer(aposta as Aposta, bolaoCompleto);

  return new NextResponse(pdf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cota-${aposta.numero_cota}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
