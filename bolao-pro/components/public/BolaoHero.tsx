import { Trophy, Ticket } from 'lucide-react';
import type { Bolao } from '@/types';
import { formatBRL } from '@/lib/utils';
import { ContadorRegressivo } from './ContadorRegressivo';

interface Props {
  bolao: Bolao;
}

export function BolaoHero({ bolao }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-brasil-verde via-brasil-verde-escuro to-emerald-900 text-white">
      {/* Padrão decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brasil-amarelo rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="inline-flex items-center gap-2 bg-brasil-amarelo text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
          <Trophy className="h-3.5 w-3.5" />
          Rodada {bolao.rodada}
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 leading-tight">
          {bolao.titulo}
        </h1>

        {bolao.descricao && (
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl">
            {bolao.descricao}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-brasil-amarelo text-xs font-bold uppercase mb-1">
              <Trophy className="h-3.5 w-3.5" />
              Prêmio acumulado
            </div>
            <div className="text-2xl md:text-3xl font-bold tabular-nums">
              {formatBRL(bolao.premio_acumulado)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-brasil-amarelo text-xs font-bold uppercase mb-1">
              <Ticket className="h-3.5 w-3.5" />
              Valor da cota
            </div>
            <div className="text-2xl md:text-3xl font-bold tabular-nums">
              {formatBRL(bolao.valor_cota)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <div className="text-brasil-amarelo text-xs font-bold uppercase mb-2">
              Apostas até
            </div>
            <ContadorRegressivo dataLimite={bolao.data_limite} />
          </div>
        </div>
      </div>
    </header>
  );
}
