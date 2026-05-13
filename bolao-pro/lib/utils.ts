import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes do Tailwind resolvendo conflitos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número como Real brasileiro.
 */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata data ISO como dd/mm/aaaa hh:mm
 */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data ISO como dd/mm/aaaa
 */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Retorna se o prazo de uma data já passou.
 */
export function prazoExpirado(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/**
 * Diferença em ms entre agora e o prazo (negativa se expirado).
 */
export function tempoRestante(iso: string | null | undefined): number {
  if (!iso) return 0;
  return new Date(iso).getTime() - Date.now();
}
