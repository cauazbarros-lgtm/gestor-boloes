/**
 * Gera um slug URL-friendly a partir do título e rodada.
 * Adiciona timestamp ao final para garantir unicidade.
 */
export function gerarSlug(titulo: string, rodada?: number): string {
  const base = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove acentos (combining marks)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const sufixoRodada = rodada ? `-r${rodada}` : '';
  const sufixoUnico = Date.now().toString(36);
  return `${base}${sufixoRodada}-${sufixoUnico}`;
}
