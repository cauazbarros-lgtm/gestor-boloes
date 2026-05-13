'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-admin-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brasil-verde rounded-2xl mb-3">
            <Trophy className="h-9 w-9 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">BolãoPro</h1>
          <p className="text-gray-400 text-sm">Painel administrativo</p>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-5">Entrar</h2>

          <form onSubmit={submeter} className="space-y-4">
            <Input
              type="email"
              label="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="email"
              className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
            />
            <Input
              type="password"
              label="Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
            />

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                {erro}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Acesso restrito ao administrador
          </p>
        </div>
      </div>
    </main>
  );
}
