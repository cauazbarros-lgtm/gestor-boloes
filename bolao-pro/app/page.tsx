import Link from 'next/link';
import { Trophy, Ticket, ArrowRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { formatBRL, formatDataHora } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Bolao } from '@/types';

async function buscarBoloesAbertos(): Promise<Bolao[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('boloes')
    .select('*')
    .in('status', ['aberto', 'encerrado', 'finalizado'])
    .order('criado_em', { ascending: false })
    .limit(20);
  return data ?? [];
}

export default async function HomePage() {
  const boloes = await buscarBoloesAbertos();
  const abertos = boloes.filter((b) => b.status === 'aberto');
  const outros = boloes.filter((b) => b.status !== 'aberto');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brasil-verde via-brasil-verde-escuro to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-brasil-amarelo" />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">BolãoPro</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto">
            Os melhores bolões do Brasileirão. Faça seu palpite, concorra ao prêmio acumulado.
          </p>
        </div>
      </section>

      {/* Bolões abertos */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-5">
          Bolões abertos
        </h2>

        {abertos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            Nenhum bolão aberto no momento. Volte em breve!
          </div>
        ) : (
          <div className="grid gap-3">
            {abertos.map((b) => (
              <Link
                key={b.id}
                href={`/bolao/${b.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brasil-verde transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">Aberto</Badge>
                      <span className="text-xs text-gray-500">Rodada {b.rodada}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-brasil-verde transition">
                      {b.titulo}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-brasil-amarelo" />
                        <strong>{formatBRL(b.premio_acumulado)}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5 text-gray-400" />
                        {formatBRL(b.valor_cota)} a cota
                      </span>
                      {b.data_limite && (
                        <span className="text-xs text-gray-500">até {formatDataHora(b.data_limite)}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brasil-verde group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {outros.length > 0 && (
          <>
            <h2 className="font-display text-xl font-bold text-gray-900 mt-10 mb-4">
              Bolões anteriores
            </h2>
            <div className="grid gap-3">
              {outros.map((b) => (
                <Link
                  key={b.id}
                  href={`/bolao/${b.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition opacity-80 hover:opacity-100"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={b.status === 'finalizado' ? 'info' : 'default'}>
                          {b.status === 'finalizado' ? 'Finalizado' : 'Encerrado'}
                        </Badge>
                        <span className="text-xs text-gray-500">R{b.rodada}</span>
                      </div>
                      <div className="font-semibold text-gray-700 text-sm">{b.titulo}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-500">
        BolãoPro · Sistema profissional de bolões do Brasileirão
      </footer>
    </main>
  );
}
