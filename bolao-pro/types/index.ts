// ============================================================
// BolãoPro — Tipos TypeScript dos modelos
// ============================================================

export type StatusBolao = 'aberto' | 'encerrado' | 'finalizado';

export type StatusPagamento = 'pendente' | 'confirmado' | 'cancelado';

export type ResultadoJogo = 'casa' | 'empate' | 'fora';

// ------------------------------------------------------------
// Bolão
// ------------------------------------------------------------
export interface Bolao {
  id: string;
  slug: string;
  titulo: string;
  rodada: number;
  premio_acumulado: number;
  valor_cota: number;
  status: StatusBolao;
  data_limite: string | null; // ISO timestamp
  descricao: string | null;
  regras: string | null;
  link_checkout: string | null; // URL externa de checkout (opcional)
  criado_em: string;
  atualizado_em: string;
}

export interface BolaoComJogos extends Bolao {
  jogos: Jogo[];
}

export interface BolaoComStats extends Bolao {
  total_apostas: number;
  total_arrecadado: number;
  total_confirmadas: number;
}

// ------------------------------------------------------------
// Jogo
// ------------------------------------------------------------
export interface Jogo {
  id: string;
  bolao_id: string;
  ordem: number;
  time_casa: string;
  time_fora: string;
  escudo_casa: string | null;
  escudo_fora: string | null;
  data_jogo: string | null;
  resultado: ResultadoJogo | null;
  criado_em: string;
}

export interface JogoInput {
  time_casa: string;
  time_fora: string;
  escudo_casa?: string | null;
  escudo_fora?: string | null;
  data_jogo?: string | null;
  ordem?: number;
}

// ------------------------------------------------------------
// Palpite (item dentro de uma aposta)
// ------------------------------------------------------------
export interface Palpite {
  jogo_id: string;
  palpite: ResultadoJogo;
}

// ------------------------------------------------------------
// Aposta
// ------------------------------------------------------------
export interface Aposta {
  id: string;
  bolao_id: string;
  numero_cota: string;
  nome_apostador: string;
  email_apostador: string;
  telefone_apostador: string | null;
  palpites: Palpite[];
  status_pagamento: StatusPagamento;
  acertos: number | null;
  ganhador: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ApostaComBolao extends Aposta {
  bolao: Bolao;
}

export interface ApostaComBolaoEJogos extends Aposta {
  bolao: BolaoComJogos;
}

// ------------------------------------------------------------
// Inputs (DTOs)
// ------------------------------------------------------------
export interface CriarBolaoInput {
  titulo: string;
  rodada: number;
  premio_acumulado: number;
  valor_cota: number;
  data_limite?: string | null;
  descricao?: string | null;
  regras?: string | null;
  link_checkout?: string | null;
  jogos: JogoInput[];
}

export interface AtualizarBolaoInput {
  titulo?: string;
  rodada?: number;
  premio_acumulado?: number;
  valor_cota?: number;
  data_limite?: string | null;
  descricao?: string | null;
  regras?: string | null;
  link_checkout?: string | null;
  status?: StatusBolao;
  jogos?: JogoInput[];
}

export interface CriarApostaInput {
  bolao_id: string;
  nome_apostador: string;
  email_apostador: string;
  telefone_apostador?: string | null;
  palpites: Palpite[];
}

export interface AtualizarApostaInput {
  status_pagamento?: StatusPagamento;
  ganhador?: boolean;
}

// ------------------------------------------------------------
// Respostas da API
// ------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  sucesso: boolean;
  data?: T;
  erro?: string;
}

export interface CriarApostaResponse {
  sucesso: true;
  numero_cota: string;
  aposta_id: string;
  link_cota: string;
}

// ------------------------------------------------------------
// Dashboard stats
// ------------------------------------------------------------
export interface DashboardStats {
  total_boloes_ativos: number;
  total_apostas_hoje: number;
  total_arrecadado: number;
  total_apostadores: number;
  apostas_por_bolao: Array<{
    bolao_id: string;
    titulo: string;
    total: number;
  }>;
  ultimas_apostas: Aposta[];
}
