import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gera o próximo número de cota sequencial para um bolão.
 * Formato: B{rodada}-{seq 5 dígitos}  ex: B15-00042
 *
 * Esta função usa a RPC `gerar_proximo_numero_cota` definida no schema.sql
 * para garantir atomicidade. Se preferir, use a versão JS abaixo.
 */
export async function gerarNumeroCotaRPC(
  supabase: SupabaseClient,
  bolaoId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('gerar_proximo_numero_cota', {
    p_bolao_id: bolaoId,
  });
  if (error) throw error;
  return data as string;
}

/**
 * Versão fallback em JS — conta apostas atuais e soma 1.
 * Use a RPC quando possível pra evitar race conditions.
 */
export async function gerarNumeroCotaJS(
  supabase: SupabaseClient,
  bolaoId: string,
  rodada: number
): Promise<string> {
  const { count, error } = await supabase
    .from('apostas')
    .select('*', { count: 'exact', head: true })
    .eq('bolao_id', bolaoId);

  if (error) throw error;

  const sequencial = String((count ?? 0) + 1).padStart(5, '0');
  return `B${rodada}-${sequencial}`;
}
