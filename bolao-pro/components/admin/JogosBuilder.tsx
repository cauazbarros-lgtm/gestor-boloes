'use client';

import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { JogoInput } from '@/types';

interface Props {
  jogos: JogoInput[];
  onChange: (jogos: JogoInput[]) => void;
}

export function JogosBuilder({ jogos, onChange }: Props) {
  function adicionar() {
    onChange([...jogos, { time_casa: '', time_fora: '' }]);
  }

  function atualizar(idx: number, campo: keyof JogoInput, valor: string) {
    const novos = [...jogos];
    novos[idx] = { ...novos[idx], [campo]: valor };
    onChange(novos);
  }

  function remover(idx: number) {
    onChange(jogos.filter((_, i) => i !== idx));
  }

  function mover(idx: number, direcao: -1 | 1) {
    const novoIdx = idx + direcao;
    if (novoIdx < 0 || novoIdx >= jogos.length) return;
    const novos = [...jogos];
    [novos[idx], novos[novoIdx]] = [novos[novoIdx], novos[idx]];
    onChange(novos);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Jogos da rodada</h3>
        <span className="text-xs text-gray-500">{jogos.length} {jogos.length === 1 ? 'jogo' : 'jogos'}</span>
      </div>

      {jogos.length === 0 && (
        <p className="text-sm text-gray-500 italic">Nenhum jogo adicionado.</p>
      )}

      {jogos.map((jogo, idx) => (
        <div
          key={idx}
          className="bg-admin-bg border border-admin-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Jogo {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => mover(idx, -1)}
                disabled={idx === 0}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => mover(idx, 1)}
                disabled={idx === jogos.length - 1}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remover(idx)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Time da casa"
              value={jogo.time_casa}
              onChange={(e) => atualizar(idx, 'time_casa', e.target.value)}
              placeholder="Ex: Flamengo"
              className="bg-admin-surface border-admin-border text-white placeholder:text-gray-500"
            />
            <Input
              label="Time visitante"
              value={jogo.time_fora}
              onChange={(e) => atualizar(idx, 'time_fora', e.target.value)}
              placeholder="Ex: Palmeiras"
              className="bg-admin-surface border-admin-border text-white placeholder:text-gray-500"
            />
            <Input
              label="Escudo casa (URL opcional)"
              value={jogo.escudo_casa ?? ''}
              onChange={(e) => atualizar(idx, 'escudo_casa', e.target.value)}
              placeholder="https://..."
              className="bg-admin-surface border-admin-border text-white placeholder:text-gray-500"
            />
            <Input
              label="Escudo fora (URL opcional)"
              value={jogo.escudo_fora ?? ''}
              onChange={(e) => atualizar(idx, 'escudo_fora', e.target.value)}
              placeholder="https://..."
              className="bg-admin-surface border-admin-border text-white placeholder:text-gray-500"
            />
            <Input
              label="Data/hora do jogo (opcional)"
              type="datetime-local"
              value={jogo.data_jogo ?? ''}
              onChange={(e) => atualizar(idx, 'data_jogo', e.target.value)}
              className="bg-admin-surface border-admin-border text-white placeholder:text-gray-500 md:col-span-2"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={adicionar} fullWidth>
        <Plus className="h-4 w-4" />
        Adicionar jogo
      </Button>
    </div>
  );
}
