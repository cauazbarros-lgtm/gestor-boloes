import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { BolaoHero } from '@/components/public/BolaoHero';
import { FormularioPalpite } from '@/components/public/FormularioPalpite';
import type { BolaoComJogos } from '@/types';
import { formatBRL } from '@/lib/utils';

interface Props {
  params: { slug: string };
}

async function buscarBolao(slug: string): Promise<BolaoComJogos | null> {
  const admin = createAdminClient();
  const { data: bolao } = await admin
    .from('boloes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!bolao) return null;
  const { data: jogos } = await admin
    .from('jogos')
    .select('*')
    .eq('bolao_id', bolao.id)
    .order('ordem', { ascending: true });
  return { ...bolao, jogos: jogos ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bolao = await buscarBolao(params.slug);
  if (!bolao) return { title: 'Bolão não encontrado' };
  return {
    title: `${bolao.titulo} — BolãoPro`,
    description: `Prêmio acumulado de ${formatBRL(bolao.premio_acumulado)}. Faça seu palpite por apenas ${formatBRL(bolao.valor_cota)}!`,
    openGraph: {
      title: bolao.titulo,
      description: `🏆 Prêmio: ${formatBRL(bolao.premio_acumulado)} | Cota: ${formatBRL(bolao.valor_cota)}`,
      type: 'website',
    },
  };
}

export default async function BolaoPublicoPage({ params }: Props) {
  const bolao = await buscarBolao(params.slug);
  if (!bolao) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <BolaoHero bolao={bolao} />
      <FormularioPalpite bolao={bolao} />
      {bolao.regras && (
        <section className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-2">📜 Regras do bolão</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">{bolao.regras}</p>
          </div>
        </section>
      )}
    </main>
  );
}
