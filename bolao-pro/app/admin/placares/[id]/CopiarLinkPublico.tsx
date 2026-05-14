'use client';

import { useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';

interface Props {
  link: string;
  placarTitulo: string;
}

export function CopiarLinkPublico({ link, placarTitulo }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  }

  function compartilharWhats() {
    const texto = `🎯 Acerte o placar exato! "${placarTitulo}"\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="flex-1 min-w-0 px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm text-gray-200 font-mono truncate">
        {link}
      </code>
      <button
        onClick={copiar}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-admin-surface border border-admin-border hover:bg-admin-border text-white text-sm font-semibold rounded-lg transition"
      >
        {copiado ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
      <button
        onClick={compartilharWhats}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </button>
    </div>
  );
}
