import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <Trophy className="h-16 w-16 text-brasil-verde mx-auto mb-4 opacity-30" />
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-6">Página não encontrada.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brasil-verde text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brasil-verde-escuro transition"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
