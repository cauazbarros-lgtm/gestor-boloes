-- ============================================================
-- BolãoPro — Schema do banco de dados (Supabase / PostgreSQL)
-- ============================================================
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: boloes
-- Cada registro é uma rodada de bolão criada pelo admin.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boloes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  rodada INTEGER NOT NULL,
  premio_acumulado DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_cota DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'encerrado', 'finalizado')),
  data_limite TIMESTAMP WITH TIME ZONE,
  descricao TEXT,
  regras TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: jogos
-- Partidas que compõem cada bolão.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jogos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE NOT NULL,
  ordem INTEGER NOT NULL,
  time_casa TEXT NOT NULL,
  time_fora TEXT NOT NULL,
  escudo_casa TEXT,
  escudo_fora TEXT,
  data_jogo TIMESTAMP WITH TIME ZONE,
  resultado TEXT CHECK (resultado IN ('casa', 'empate', 'fora')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: apostas (cada registro = 1 cota comprada)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS apostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE NOT NULL,
  numero_cota TEXT UNIQUE NOT NULL,
  nome_apostador TEXT NOT NULL,
  email_apostador TEXT NOT NULL,
  telefone_apostador TEXT,
  palpites JSONB NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'confirmado', 'cancelado')),
  acertos INTEGER,
  ganhador BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_apostas_bolao_id ON apostas(bolao_id);
CREATE INDEX IF NOT EXISTS idx_apostas_numero_cota ON apostas(numero_cota);
CREATE INDEX IF NOT EXISTS idx_apostas_email ON apostas(email_apostador);
CREATE INDEX IF NOT EXISTS idx_apostas_status_pgto ON apostas(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_jogos_bolao_id ON jogos(bolao_id);
CREATE INDEX IF NOT EXISTS idx_boloes_slug ON boloes(slug);
CREATE INDEX IF NOT EXISTS idx_boloes_status ON boloes(status);

-- ------------------------------------------------------------
-- TRIGGER: atualiza coluna `atualizado_em` automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boloes_atualizado_em ON boloes;
CREATE TRIGGER trg_boloes_atualizado_em
  BEFORE UPDATE ON boloes
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_apostas_atualizado_em ON apostas;
CREATE TRIGGER trg_apostas_atualizado_em
  BEFORE UPDATE ON apostas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ------------------------------------------------------------
-- FUNÇÃO: gera próximo número de cota (sequencial por bolão)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION gerar_proximo_numero_cota(p_bolao_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_rodada INTEGER;
  v_count INTEGER;
  v_seq TEXT;
BEGIN
  SELECT rodada INTO v_rodada FROM boloes WHERE id = p_bolao_id;
  SELECT COUNT(*) INTO v_count FROM apostas WHERE bolao_id = p_bolao_id;
  v_seq := LPAD((v_count + 1)::TEXT, 5, '0');
  RETURN 'B' || v_rodada || '-' || v_seq;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas ENABLE ROW LEVEL SECURITY;

-- Leitura pública de bolões (qualquer status visível ao público)
DROP POLICY IF EXISTS "Boloes publicos visiveis" ON boloes;
CREATE POLICY "Boloes publicos visiveis" ON boloes
  FOR SELECT USING (true);

-- Leitura pública de jogos
DROP POLICY IF EXISTS "Jogos publicos visiveis" ON jogos;
CREATE POLICY "Jogos publicos visiveis" ON jogos
  FOR SELECT USING (true);

-- Apostador consulta a própria cota pelo ID
DROP POLICY IF EXISTS "Apostador ve propria cota" ON apostas;
CREATE POLICY "Apostador ve propria cota" ON apostas
  FOR SELECT USING (true);

-- Inserção pública via API (Service Role recomendado para validação no backend)
DROP POLICY IF EXISTS "Apostador insere propria cota" ON apostas;
CREATE POLICY "Apostador insere propria cota" ON apostas
  FOR INSERT WITH CHECK (true);

-- IMPORTANTE: Todas as operações de UPDATE/DELETE em boloes/jogos/apostas
-- devem ser feitas pelo backend usando a SUPABASE_SERVICE_ROLE_KEY (que
-- bypassa RLS). As policies abaixo bloqueiam UPDATE/DELETE de clientes
-- anônimos por padrão (sem policy = negado).

-- ------------------------------------------------------------
-- DADOS DE EXEMPLO (opcional — descomente para testar)
-- ------------------------------------------------------------
-- INSERT INTO boloes (slug, titulo, rodada, premio_acumulado, valor_cota, status, data_limite, descricao)
-- VALUES (
--   'rodada-15-brasileirao-2025',
--   'Bolão Rodada 15 - Brasileirão 2025',
--   15,
--   2450.00,
--   20.00,
--   'aberto',
--   NOW() + INTERVAL '7 days',
--   'Acerte os resultados dos 10 jogos da rodada e fature o prêmio!'
-- );
