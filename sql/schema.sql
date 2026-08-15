-- Participantes table
CREATE TABLE IF NOT EXISTS participantes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(30),
    categoria VARCHAR(30) NOT NULL,
    tipo_consumo VARCHAR(30) NOT NULL,
    posicao_campo VARCHAR(20) DEFAULT 'Linha',
    modelo_camisa VARCHAR(30) DEFAULT 'Tradicional',
    tam_camisa VARCHAR(10),
    num_camisa INT,
    nome_camisa VARCHAR(50),
    responsavel_id BIGINT REFERENCES participantes(id) ON DELETE SET NULL,
    valor_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique shirt number per team (partial indexes)
CREATE UNIQUE INDEX idx_num_camisa_solteiro ON participantes (num_camisa) WHERE categoria = 'Jogador Solteiro' AND num_camisa IS NOT NULL;
CREATE UNIQUE INDEX idx_num_camisa_casado ON participantes (num_camisa) WHERE categoria = 'Jogador Casado' AND num_camisa IS NOT NULL;

-- Parcelas table
CREATE TABLE IF NOT EXISTS parcelas (
    id BIGSERIAL PRIMARY KEY,
    participante_id BIGINT REFERENCES participantes(id) ON DELETE CASCADE,
    numero_parcela INT NOT NULL CHECK (numero_parcela BETWEEN 1 AND 4),
    data_vencimento DATE NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    valor_desconto NUMERIC(10,2) DEFAULT 0.00,
    pago BOOLEAN DEFAULT FALSE,
    data_pagamento TIMESTAMP WITH TIME ZONE
);

-- Despesas table (enhanced with categoria + data_pagamento)
CREATE TABLE IF NOT EXISTS despesas (
    id BIGSERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Outros',
    valor NUMERIC(10,2) NOT NULL,
    pago BOOLEAN DEFAULT FALSE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Config table for PIX key and admin PIN
CREATE TABLE IF NOT EXISTS configuracoes (
    chave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT INTO configuracoes (chave, valor) VALUES
    ('pix_chave', '46413688807'),
    ('pix_nome', 'LUAN AUGUSTO BARBOZA SIMAO'),
    ('pix_cidade', 'GUARARAPES'),
    ('admin_pin', '302712')
ON CONFLICT (chave) DO NOTHING;

-- RLS policies
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_participantes" ON participantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_parcelas" ON parcelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_despesas" ON despesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_configuracoes" ON configuracoes FOR ALL USING (true) WITH CHECK (true);
