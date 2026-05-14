import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, BarChart3 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { PlacarForm } from '@/components/admin/PlacarForm';
import { CopiarLinkPublico } from './CopiarLinkPublico';

interface Props {
  params: { id: string };
  searchParams: { criado?: string };
}

async function carregar(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('placares').select('*').eq('id', id).maybeSingle();
  return data;
}

export default async function EditarPlacarPage({ params, searchParams }: Props) {
  const placar = await carregar(params.id);
  if (!placar) notFound();

  const criado = searchParams.criado === '1';
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const linkPublico = `${base}/placar/${placar.slug}`;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {criado ? '✅ Placar criado!' : 'Editar placar'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{placar.titulo}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/placares/${placar.id}/palpites`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-surface border border-admin-border hover:bg-admin-border text-white text-sm font-semibold rounded-lg transition"
          >
            <BarChart3 className="h-4 w-4" /> Ver palpites
          </Link>
          <Link
            href={`/placar/${placar.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-surface border border-admin-border hover:bg-admin-border text-white text-sm font-semibold rounded-lg transition"
          >
            <ExternalLink className="h-4 w-4" /> Ver página pública
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brasil-verde/10 to-emerald-500/5 border border-brasil-verde/30 rounded-xl p-4 mb-6">
        <div className="text-xs text-brasil-verde-claro uppercase font-bold tracking-wider mb-1">
          🔗 Link público para divulgar
        </div>
        <CopiarLinkPublico link={linkPublico} placarTitulo={placar.titulo} />
      </div>

      <PlacarForm placar={placar} />
    </div>
  );
}
