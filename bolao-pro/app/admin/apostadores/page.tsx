import { createAdminClient } from '@/lib/supabase/server';
import { ApostadoresLista } from './ApostadoresLista';

export const dynamic = 'force-dynamic';

interface Apostador {
  nome: string;
  email: string;
  telefone: string | null;
  total_apostas: number;
  total_confirmadas: number;
  ganhou: number;
  ultima_aposta: string;
}

async function carregar(): Promise<Apostador[]> {
  const admin = createAdminClient();
  const { data: apostas } = await admin
    .from('apostas')
    .select('nome_apostador, email_apostador, telefone_apostador, status_pagamento, ganhador, criado_em')
    .order('criado_em', { ascending: false });

  const mapa = new Map<string, Apostador>();
  for (const a of apostas ?? []) {
    const key = a.email_apostador.toLowerCase();
    const existente = mapa.get(key);
    if (existente) {
      existente.total_apostas++;
      if (a.status_pagamento === 'confirmado') existente.total_confirmadas++;
      if (a.ganhador) existente.ganhou++;
      if (new Date(a.criado_em).getTime() > new Date(existente.ultima_aposta).getTime()) {
        existente.ultima_aposta = a.criado_em;
      }
    } else {
      mapa.set(key, {
        nome: a.nome_apostador,
        email: a.email_apostador,
        telefone: a.telefone_apostador,
        total_apostas: 1,
        total_confirmadas: a.status_pagamento === 'confirmado' ? 1 : 0,
        ganhou: a.ganhador ? 1 : 0,
        ultima_aposta: a.criado_em,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.total_apostas - a.total_apostas);
}

export default async function ApostadoresPage() {
  const apostadores = await carregar();
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Apostadores</h1>
        <p className="text-gray-400 text-sm mt-1">
          {apostadores.length} apostadores únicos
        </p>
      </div>
      <ApostadoresLista apostadores={apostadores} />
    </div>
  );
}
