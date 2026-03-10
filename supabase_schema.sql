-- ========================================================================================
-- SUPABASE SCHEMA PARA O SISTEMA DE INSCRIÇÃO EM ITINERÁRIOS FORMATIVOS (IFA)
-- ========================================================================================
-- Este arquivo contém o código SQL para criar as tabelas, configurar as políticas de 
-- Row Level Security (RLS) e preparar o banco de dados no Supabase.
-- ========================================================================================

-- 1. Habilitar a extensão UUID (se já não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ========================================================================================

-- Tabela de Itinerários Formativos (IFAs)
CREATE TABLE ifas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma TEXT NOT NULL,
    tipo_ifa TEXT,
    projeto_1 TEXT NOT NULL,
    professor_1 TEXT,
    projeto_2 TEXT NOT NULL,
    professor_2 TEXT,
    vagas_maximas INTEGER DEFAULT 40,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Estudantes
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT NOT NULL UNIQUE,
    turma TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Inscrições
CREATE TABLE inscricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ifa_id UUID NOT NULL REFERENCES ifas(id) ON DELETE CASCADE,
    data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    -- Proteção contra dupla inscrição: Um estudante só pode ter uma inscrição
    CONSTRAINT unique_student_enrollment UNIQUE(student_id)
);

-- ========================================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE ifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

-- ========================================================================================
-- 4. POLÍTICAS DE SEGURANÇA (POLICIES)
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- Políticas para a tabela 'ifas'
-- ----------------------------------------------------------------------------------------
-- Qualquer pessoa (anon ou authenticated) pode visualizar os IFAs disponíveis
CREATE POLICY "IFAs são visíveis publicamente" 
ON ifas FOR SELECT 
USING (true);

-- Apenas usuários autenticados (administradores) podem inserir, atualizar ou deletar IFAs
CREATE POLICY "Apenas admins podem gerenciar IFAs" 
ON ifas FOR ALL 
USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------------------
-- Políticas para a tabela 'students'
-- ----------------------------------------------------------------------------------------
-- Qualquer pessoa pode inserir um estudante (durante o fluxo de inscrição)
CREATE POLICY "Qualquer pessoa pode cadastrar estudante" 
ON students FOR INSERT 
WITH CHECK (true);

-- Estudantes podem visualizar seus próprios dados (simplificado para leitura pública no fluxo)
CREATE POLICY "Leitura pública de estudantes" 
ON students FOR SELECT 
USING (true);

-- Apenas admins podem atualizar ou deletar estudantes
CREATE POLICY "Apenas admins podem gerenciar estudantes" 
ON students FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar estudantes" 
ON students FOR DELETE 
USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------------------
-- Políticas para a tabela 'inscricoes'
-- ----------------------------------------------------------------------------------------
-- Qualquer pessoa pode inserir uma inscrição (o estudante se inscrevendo)
CREATE POLICY "Qualquer pessoa pode criar inscrição" 
ON inscricoes FOR INSERT 
WITH CHECK (true);

-- Qualquer pessoa pode ler as inscrições (necessário para calcular vagas restantes)
CREATE POLICY "Leitura pública de inscrições" 
ON inscricoes FOR SELECT 
USING (true);

-- Apenas admins podem atualizar ou deletar inscrições
CREATE POLICY "Apenas admins podem gerenciar inscrições" 
ON inscricoes FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar inscrições" 
ON inscricoes FOR DELETE 
USING (auth.role() = 'authenticated');

-- ========================================================================================
-- 5. FUNÇÕES E TRIGGERS (Opcional - Validação de Vagas no Banco)
-- ========================================================================================
-- Esta função garante que o limite de 40 vagas não seja ultrapassado no momento do INSERT
CREATE OR REPLACE FUNCTION check_ifa_capacity()
RETURNS TRIGGER AS $$
DECLARE
    vagas_atuais INTEGER;
    limite_vagas INTEGER;
    ifa_aberto BOOLEAN;
BEGIN
    -- Obter informações do IFA
    SELECT vagas_maximas, is_open INTO limite_vagas, ifa_aberto
    FROM ifas
    WHERE id = NEW.ifa_id;

    -- Verificar se o IFA está aberto
    IF NOT ifa_aberto THEN
        RAISE EXCEPTION 'As inscrições para este IFA estão encerradas.';
    END IF;

    -- Contar inscrições atuais
    SELECT COUNT(*) INTO vagas_atuais
    FROM inscricoes
    WHERE ifa_id = NEW.ifa_id;

    -- Verificar limite
    IF vagas_atuais >= limite_vagas THEN
        RAISE EXCEPTION 'Vagas esgotadas para este IFA.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa a função antes de inserir uma nova inscrição
CREATE TRIGGER enforce_ifa_capacity
BEFORE INSERT ON inscricoes
FOR EACH ROW
EXECUTE FUNCTION check_ifa_capacity();
