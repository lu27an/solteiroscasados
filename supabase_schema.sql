-- =============================================
-- SQL Script para rodar no Supabase -> SQL Editor
-- Copie TUDO e cole no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de Configurações
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id SERIAL PRIMARY KEY,
    pix_chave TEXT NOT NULL,
    pix_nome TEXT NOT NULL,
    pix_cidade TEXT NOT NULL,
    admin_pin TEXT NOT NULL
);
INSERT INTO public.configuracoes (id, pix_chave, pix_nome, pix_cidade, admin_pin)
VALUES (1, '46413688807', 'LUAN AUGUSTO BARBOZA SIMAO', 'GUARARAPES', '302712')
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

-- =============================================
-- CRÍTICO: Desabilitar Row Level Security (RLS)
-- Isso é necessário para o app funcionar sem autenticação
-- =============================================
ALTER TABLE public.configuracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalacao DISABLE ROW LEVEL SECURITY;

-- Remover qualquer política de RLS existente que possa bloquear
DROP POLICY IF EXISTS "Enable all for anon" ON public.participantes;
DROP POLICY IF EXISTS "Enable all for anon" ON public.parcelas;
DROP POLICY IF EXISTS "Enable all for anon" ON public.despesas;
DROP POLICY IF EXISTS "Enable all for anon" ON public.configuracoes;
DROP POLICY IF EXISTS "Enable all for anon" ON public.escalacao;

-- Garantir acesso público (anon) a todas as tabelas
GRANT ALL ON public.configuracoes TO anon;
GRANT ALL ON public.participantes TO anon;
GRANT ALL ON public.parcelas TO anon;
GRANT ALL ON public.despesas TO anon;
GRANT ALL ON public.escalacao TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
