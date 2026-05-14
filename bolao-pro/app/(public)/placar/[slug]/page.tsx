import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { PlacarHero } from '@/components/public/PlacarHero';
import { PlacarFormulario } from '@/components/public/PlacarFormulario';
import { formatBRL } from '@/lib/utils';
import type { Placar } from '@/types';

interface Props {
  params: { slug: string };
}

async function buscar(slug: string): Promise<Placar | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('placares').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const placar = await buscar(params.slug);
  if (!placar) return { title: 'Placar não encontrado' };
  return {
    title: `${placar.titulo} — Placar Exato | BolãoPro`,
    description: `Prêmio de ${formatBRL(placar.premio_acumulado)} pra quem acertar o placar exato de ${placar.time_casa} × ${placar.time_fora}. Cota por apenas ${formatBRL(placar.valor_cota)}.`,
    openGraph: {
      title: `🎯 Placar Exato: ${placar.time_casa} × ${placar.time_fora}`,
      description: `Prêmio ${formatBRL(placar.premio_acumulado)} — Cota ${formatBRL(placar.valor_cota)}`,
    },
  };
}

export default async function PlacarPublicoPage({ params }: Props) {
  const placar = await buscar(params.slug);
  if (!placar) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <PlacarHero placar={placar} />
      <PlacarFormulario placar={placar} />
      {placar.regras && (
        <section className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-2">📜 Regras</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">{placar.regras}</p>
          </div>
        </section>
      )}
    </main>
  );
}
