'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  escudo?: string | null;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  disabled?: boolean;
}

export function SeletorGols({ label, escudo, value, onChange, max = 10, disabled }: Props) {
  function inc() {
    if (value < max) onChange(value + 1);
  }
  function dec() {
    if (value > 0) onChange(value - 1);
  }

  return (
    <div className="flex flex-col items-center text-center">
      {escudo ? (
        <img src={escudo} alt={label} className="h-14 w-14 object-contain mb-2" />
      ) : (
        <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-gray-400 text-xs font-bold">
          {label.slice(0, 3).toUpperCase()}
        </div>
      )}
      <div className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">{label}</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= 0}
          className={cn(
            'h-12 w-12 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold',
            'hover:border-brasil-verde hover:text-brasil-verde transition',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Minus className="h-5 w-5 mx-auto" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brasil-verde to-brasil-verde-escuro flex items-center justify-center text-white">
          <span className="text-4xl font-bold tabular-nums">{value}</span>
        </div>

        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          className={cn(
            'h-12 w-12 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold',
            'hover:border-brasil-verde hover:text-brasil-verde transition',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Plus className="h-5 w-5 mx-auto" />
        </button>
      </div>
    </div>
  );
}
