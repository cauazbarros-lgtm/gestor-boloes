import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/pagamento
 *
 * Endpoint pronto para receber confirmação de pagamento de um gateway externo
 * (ex: Mercado Pago, Pagar.me, Asaas, PicPay).
 *
 * Configure o provedor para enviar payload com:
 *   { "numero_cota": "B15-00042", "aposta_id": "uuid", "status": "confirmado" }
 *
 * Para segurança, valide um secret (header X-Webhook-Secret) — descomente abaixo.
 */
export async function POST(req: NextRequest) {
  // // SEGURANÇA — descomente quando configurar
  // const secret = req.headers.get('x-webhook-secret');
  // if (secret !== process.env.WEBHOOK_SECRET) {
  //   return NextResponse.json({ sucesso: false, erro: 'Webhook inválido' }, { status: 401 });
  // }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ sucesso: false, erro: 'Payload inválido' }, { status: 400 });
  }

  const { numero_cota, aposta_id, status } = body as {
    numero_cota?: string;
    aposta_id?: string;
    status?: string;
  };

  if (!status || !['confirmado', 'cancelado', 'pendente'].includes(status)) {
    return NextResponse.json(
      { sucesso: false, erro: 'Status inválido' },
      { status: 400 }
    );
  }

  if (!numero_cota && !aposta_id) {
    return NextResponse.json(
      { sucesso: false, erro: 'Envie numero_cota ou aposta_id' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let query = admin.from('apostas').update({ status_pagamento: status });
  if (aposta_id) query = query.eq('id', aposta_id);
  else if (numero_cota) query = query.eq('numero_cota', numero_cota);

  const { error } = await query;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true });
}
