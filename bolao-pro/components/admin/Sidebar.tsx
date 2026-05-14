'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, Users, LogOut, Plus, Menu, X, Target } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/boloes', label: 'Bolões', icon: Trophy },
  { href: '/admin/placares', label: 'Placar Exato', icon: Target },
  { href: '/admin/apostadores', label: 'Apostadores', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-admin-surface text-white rounded-lg border border-admin-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {aberto && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-admin-surface border-r border-admin-border flex flex-col transition-transform',
          aberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-admin-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brasil-verde flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-tight">BolãoPro</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Admin</div>
            </div>
          </div>
          <button onClick={() => setAberto(false)} className="lg:hidden text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CTA */}
        <Link
          href="/admin/boloes/novo"
          onClick={() => setAberto(false)}
          className="mx-4 mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brasil-verde hover:bg-brasil-verde-escuro text-white font-semibold rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Novo bolão
        </Link>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const ativo = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAberto(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  ativo
                    ? 'bg-brasil-verde/20 text-brasil-verde-claro'
                    : 'text-gray-400 hover:text-white hover:bg-admin-border/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sair */}
        <div className="p-4 border-t border-admin-border">
          <button
            onClick={sair}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-admin-border/50 transition"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
