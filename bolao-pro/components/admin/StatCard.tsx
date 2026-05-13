import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  variacao?: string;
  cor?: 'verde' | 'amarelo' | 'azul' | 'roxo';
}

const cores = {
  verde: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
  amarelo: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
  azul: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
  roxo: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
};

export function StatCard({ label, valor, icon: Icon, variacao, cor = 'verde' }: Props) {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-5 hover:border-admin-accent/30 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider">{label}</div>
        <div className={cn('p-2 rounded-lg bg-gradient-to-br border', cores[cor])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">{valor}</div>
      {variacao && (
        <div className="text-xs text-gray-500 mt-1">{variacao}</div>
      )}
    </div>
  );
}
