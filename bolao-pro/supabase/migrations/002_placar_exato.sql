-- ============================================================
-- Migração 002 — Placar Exato (jogos do dia)
-- ============================================================
-- Execute essa migração no SQL Editor do Supabase.
-- É idempotente — pode rodar várias vezes sem problema.
-- ============================================================

-- Tabela de jogos do dia (placar exato)
CREATE TABLE IF NOT EXISTS placares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  time_casa TEXT NOT NULL,
  time_fora TEXT NOT NULL,
  escudo_casa TEXT,
  escudo_fora TEXT,
  data_jogo TIMESTAMP WITH TIME ZONE,
  premio_acumulado DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_cota DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'encerrado', 'finalizado')),
  link_checkout TEXT,
  descricao TEXT,
  regras TEXT,
  -- Resultado real (preenchido pelo admin após o jogo)
  gols_casa INTEGER,
  gols_fora INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de palpites de placar exato (cada registro = 1 cota comprada)
CREATE TABLE IF NOT EXISTS palpites_placar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  placar_id UUID REFERENCES placares(id) ON DELETE CASCADE NOT NULL,
  numero_cota TEXT UNIQUE NOT NULL,
  nome_apostador TEXT NOT NULL,
  email_apostador TEXT NOT NULL,
  telefone_apostador TEXT,
  gols_casa_palpite INTEGER NOT NULL CHECK (gols_casa_palpite >= 0 AND gols_casa_palpite <= 20),
  gols_fora_palpite INTEGER NOT NULL CHECK (gols_fora_palpite >= 0 AND gols_fora_palpite <= 20),
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'confirmado', 'cancelado')),
  ganhador BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_placares_slug ON placares(slug);
CREATE INDEX IF NOT EXISTS idx_placares_status ON placares(status);
CREATE INDEX IF NOT EXISTS idx_palpites_placar_id ON palpites_placar(placar_id);
CREATE INDEX IF NOT EXISTS idx_palpites_placar_email ON palpites_placar(email_apostador);
CREATE INDEX IF NOT EXISTS idx_palpites_placar_status_pgto ON palpites_placar(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_palpites_placar_cota ON palpites_placar(numero_cota);

-- Trigger pra atualizar atualizado_em
DROP TRIGGER IF EXISTS trg_placares_atualizado_em ON placares;
CREATE TRIGGER trg_placares_atualizado_em
  BEFORE UPDATE ON placares
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_palpites_placar_atualizado_em ON palpites_placar;
CREATE TRIGGER trg_palpites_placar_atualizado_em
  BEFORE UPDATE ON palpites_placar
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Função pra gerar próximo número de cota de placar exato
-- Formato: P-{seq 5 dígitos}  ex: P-00042
CREATE OR REPLACE FUNCTION gerar_proximo_numero_cota_placar(p_placar_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_seq TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM palpites_placar WHERE placar_id = p_placar_id;
  v_seq := LPAD((v_count + 1)::TEXT, 5, '0');
  RETURN 'P-' || v_seq;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE placares ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites_placar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Placares publicos visiveis" ON placares;
CREATE POLICY "Placares publicos visiveis" ON placares
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Palpites placar visiveis" ON palpites_placar;
CREATE POLICY "Palpites placar visiveis" ON palpites_placar
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apostador insere palpite placar" ON palpites_placar;
CREATE POLICY "Apostador insere palpite placar" ON palpites_placar
  FOR INSERT WITH CHECK (true);
