import { Trophy, Target, Ticket } from 'lucide-react';
import type { Placar } from '@/types';
import { formatBRL } from '@/lib/utils';
import { ContadorRegressivo } from './ContadorRegressivo';

interface Props {
  placar: Placar;
}

export function PlacarHero({ placar }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-brasil-verde via-brasil-verde-escuro to-emerald-900 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brasil-amarelo rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="inline-flex items-center gap-2 bg-brasil-amarelo text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
          <Target className="h-3.5 w-3.5" /> Placar Exato
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 leading-tight">
          {placar.titulo}
        </h1>

        <div className="text-white/80 text-lg mb-2">
          <strong>{placar.time_casa}</strong> × <strong>{placar.time_fora}</strong>
        </div>

        {placar.descricao && (
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl">
            {placar.descricao}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-brasil-amarelo text-xs font-bold uppercase mb-1">
              <Trophy className="h-3.5 w-3.5" /> Prêmio
            </div>
            <div className="text-2xl md:text-3xl font-bold tabular-nums">
              {formatBRL(placar.premio_acumulado)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-brasil-amarelo text-xs font-bold uppercase mb-1">
              <Ticket className="h-3.5 w-3.5" /> Valor da cota
            </div>
            <div className="text-2xl md:text-3xl font-bold tabular-nums">
              {formatBRL(placar.valor_cota)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-brasil-amarelo text-xs font-bold uppercase mb-2">
              Palpites até
            </div>
            <ContadorRegressivo dataLimite={placar.data_jogo} />
          </div>
        </div>
      </div>
    </header>
  );
}
