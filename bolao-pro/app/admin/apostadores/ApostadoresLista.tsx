'use client';

import { useMemo, useState } from 'react';
import { Search, Trophy, MessageCircle, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDataHora } from '@/lib/utils';

interface Apostador {
  nome: string;
  email: string;
  telefone: string | null;
  total_apostas: number;
  total_confirmadas: number;
  ganhou: number;
  ultima_aposta: string;
}

export function ApostadoresLista({ apostadores }: { apostadores: Apostador[] }) {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    if (!busca) return apostadores;
    const q = busca.toLowerCase();
    return apostadores.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.telefone && a.telefone.toLowerCase().includes(q))
    );
  }, [apostadores, busca]);

  return (
    <div>
      <div className="bg-admin-surface border border-admin-border rounded-xl p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full h-10 pl-9 pr-3 bg-admin-bg border border-admin-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-brasil-verde"
          />
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-admin-border">
                <th className="px-4 py-3">Apostador</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3 text-right">Apostas</th>
                <th className="px-4 py-3 text-right">Confirmadas</th>
                <th className="px-4 py-3 text-right">Ganhou</th>
                <th className="px-4 py-3">Última aposta</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Nenhum apostador encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((a) => (
                  <tr key={a.email} className="border-b border-admin-border/50 last:border-0 hover:bg-admin-bg/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{a.nome}</div>
                      {a.ganhou > 0 && (
                        <Badge variant="success" className="mt-0.5">
                          <Trophy className="h-3 w-3 inline mr-0.5" /> Ganhou {a.ganhou}x
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Mail className="h-3 w-3 text-gray-500" />
                        {a.email}
                      </div>
                      {a.telefone && (
                        <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                          <MessageCircle className="h-3 w-3 text-gray-500" />
                          <a
                            href={`https://wa.me/${a.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener"
                            className="hover:text-emerald-400"
                          >
                            {a.telefone}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold tabular-nums">
                      {a.total_apostas}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold tabular-nums">
                      {a.total_confirmadas}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-bold tabular-nums">
                      {a.ganhou || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDataHora(a.ultima_aposta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
