'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  dataLimite: string | null;
}

interface Tempo {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  expirado: boolean;
}

function calcular(iso: string | null): Tempo {
  if (!iso) return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: false };
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true };
  return {
    dias: Math.floor(diff / 86_400_000),
    horas: Math.floor((diff % 86_400_000) / 3_600_000),
    minutos: Math.floor((diff % 3_600_000) / 60_000),
    segundos: Math.floor((diff % 60_000) / 1000),
    expirado: false,
  };
}

export function ContadorRegressivo({ dataLimite }: Props) {
  const [tempo, setTempo] = useState<Tempo>(() => calcular(dataLimite));

  useEffect(() => {
    if (!dataLimite) return;
    const id = setInterval(() => setTempo(calcular(dataLimite)), 1000);
    return () => clearInterval(id);
  }, [dataLimite]);

  if (!dataLimite) return null;

  if (tempo.expirado) {
    return (
      <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
        <Clock className="h-4 w-4" />
        Apostas encerradas
      </div>
    );
  }

  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center bg-white/20 backdrop-blur rounded-lg px-3 py-2 min-w-[60px]">
      <span className="text-2xl font-bold tabular-nums">{String(n).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-2">
      <Clock className="h-5 w-5" />
      <div className="flex gap-1.5">
        {cell(tempo.dias, 'dias')}
        {cell(tempo.horas, 'horas')}
        {cell(tempo.minutos, 'min')}
        {cell(tempo.segundos, 'seg')}
      </div>
    </div>
  );
}
