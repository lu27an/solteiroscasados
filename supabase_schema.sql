-- =============================================
-- SQL DEFINITIVO PARA O SUPABASE (SQL EDITOR)
-- Copie TUDO e clique em "RUN" no Supabase
-- =============================================

-- 1. Tabela de Configurações
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id SERIAL PRIMARY KEY,
    pix_chave TEXT NOT NULL DEFAULT '46413688807',
    pix_nome TEXT NOT NULL DEFAULT 'LUAN AUGUSTO BARBOZA SIMAO',
    pix_cidade TEXT NOT NULL DEFAULT 'GUARARAPES',
    admin_pin TEXT NOT NULL DEFAULT '125599'
);
INSERT INTO public.configuracoes (id, pix_chave, pix_nome, pix_cidade, admin_pin)
VALUES (1, '46413688807', 'LUAN AUGUSTO BARBOZA SIMAO', 'GUARARAPES', '125599')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Participantes
CREATE TABLE IF NOT EXISTS public.participantes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    categoria TEXT NOT NULL,
    posicao_campo TEXT,
    tipo_consumo TEXT,
    modelo_camisa TEXT,
    tam_camisa TEXT,
    num_camisa INTEGER,
    nome_camisa TEXT,
    responsavel_id INTEGER REFERENCES public.participantes(id) ON DELETE SET NULL,
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Parcelas
CREATE TABLE IF NOT EXISTS public.parcelas (
    id SERIAL PRIMARY KEY,
    participante_id INTEGER NOT NULL REFERENCES public.participantes(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    pago BOOLEAN DEFAULT false,
    data_vencimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Despesas
CREATE TABLE IF NOT EXISTS public.despesas (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    pago BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Escalação
CREATE TABLE IF NOT EXISTS public.escalacao (
    id SERIAL PRIMARY KEY,
    time_nome TEXT UNIQUE NOT NULL,
    tatica JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Inscrições / Bolão
CREATE TABLE IF NOT EXISTS public.inscricoes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    categoria TEXT NOT NULL,
    posicao_campo TEXT,
    tipo_consumo TEXT,
    quer_camisa BOOLEAN DEFAULT true,
    modelo_camisa TEXT,
    tam_camisa TEXT,
    num_camisa INTEGER,
    nome_camisa TEXT,
    bolao_solteiros INTEGER DEFAULT 0,
    bolao_casados INTEGER DEFAULT 0,
    bolao_mensagem TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- POLÍTICAS DE ACESSO TOTAL (RLS PERMISSIVO)
-- Permite leitura e escrita pública sem bloqueios
-- =============================================
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access configuracoes" ON public.configuracoes;
CREATE POLICY "Public access configuracoes" ON public.configuracoes FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access participantes" ON public.participantes;
CREATE POLICY "Public access participantes" ON public.participantes FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access parcelas" ON public.parcelas;
CREATE POLICY "Public access parcelas" ON public.parcelas FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access despesas" ON public.despesas;
CREATE POLICY "Public access despesas" ON public.despesas FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access escalacao" ON public.escalacao;
CREATE POLICY "Public access escalacao" ON public.escalacao FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access inscricoes" ON public.inscricoes;
CREATE POLICY "Public access inscricoes" ON public.inscricoes FOR ALL TO public USING (true) WITH CHECK (true);

-- Permissões completas para o usuário anônimo
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- =============================================
-- MIGRAÇÃO: Novo modelo financeiro (valor_pago)
-- =============================================
ALTER TABLE public.participantes 
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.participantes 
  ADD COLUMN IF NOT EXISTS valor_camisa NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.participantes 
  ADD COLUMN IF NOT EXISTS camisa_pago NUMERIC(10,2) DEFAULT 0;

-- Migrar dados das parcelas existentes para valor_pago
UPDATE public.participantes p
SET valor_pago = COALESCE((
  SELECT SUM(parc.valor) 
  FROM public.parcelas parc 
  WHERE parc.participante_id = p.id AND parc.pago = true
), 0)
WHERE valor_pago = 0 OR valor_pago IS NULL;

-- Atualizar valor_total para R$ 0,00 de crianças (churrasco grátis)
UPDATE public.participantes
SET valor_total = 0
WHERE tipo_consumo IN ('Crianca Meia', 'Criança', 'Crianca') OR categoria = 'Criança';

-- Permitir repetição de números de camisa (remover índices únicos caso existam)
DROP INDEX IF EXISTS idx_num_camisa_solteiro;
DROP INDEX IF EXISTS idx_num_camisa_casado;
DROP INDEX IF EXISTS public.idx_num_camisa_solteiro;
DROP INDEX IF EXISTS public.idx_num_camisa_casado;

