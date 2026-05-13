'use client';

import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Jogo, ResultadoJogo } from '@/types';

interface Props {
  jogo: Jogo;
  ordem: number;
  palpiteSelecionado: ResultadoJogo | null;
  onSelect: (palpite: ResultadoJogo) => void;
  disabled?: boolean;
}

const opcoes: { valor: ResultadoJogo; label: string; descricao: string }[] = [
  { valor: 'casa', label: 'CASA', descricao: 'vitória mandante' },
  { valor: 'empate', label: 'EMPATE', descricao: 'sem vencedor' },
  { valor: 'fora', label: 'FORA', descricao: 'vitória visitante' },
];

export function JogoCard({ jogo, ordem, palpiteSelecionado, onSelect, disabled }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      {/* Cabeçalho do jogo */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Jogo {ordem}
        </span>
        {jogo.data_jogo && (
          <span className="text-xs text-gray-500">
            {new Date(jogo.data_jogo).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Times */}
      <div className="px-4 py-4 grid grid-cols-3 items-center gap-2">
        <div className="flex flex-col items-center text-center">
          {jogo.escudo_casa ? (
            <img src={jogo.escudo_casa} alt={jogo.time_casa} className="h-12 w-12 object-contain mb-1" />
          ) : (
            <Shield className="h-12 w-12 text-gray-300 mb-1" />
          )}
          <span className="text-sm font-semibold text-gray-900 line-clamp-2">
            {jogo.time_casa}
          </span>
        </div>

        <div className="text-center">
          <span className="text-gray-400 font-bold text-lg">×</span>
        </div>

        <div className="flex flex-col items-center text-center">
          {jogo.escudo_fora ? (
            <img src={jogo.escudo_fora} alt={jogo.time_fora} className="h-12 w-12 object-contain mb-1" />
          ) : (
            <Shield className="h-12 w-12 text-gray-300 mb-1" />
          )}
          <span className="text-sm font-semibold text-gray-900 line-clamp-2">
            {jogo.time_fora}
          </span>
        </div>
      </div>

      {/* Opções de palpite */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {opcoes.map((op) => {
          const ativo = palpiteSelecionado === op.valor;
          return (
            <button
              key={op.valor}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(op.valor)}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 font-bold transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                ativo
                  ? 'bg-brasil-verde text-white border-brasil-verde shadow-md scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brasil-verde hover:bg-brasil-verde/5'
              )}
            >
              <span className="text-sm">{op.label}</span>
              <span className={cn('text-[10px] font-normal mt-0.5', ativo ? 'text-white/80' : 'text-gray-500')}>
                {op.descricao}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
