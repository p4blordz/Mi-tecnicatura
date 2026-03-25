-- ============================================
-- SQL para ejecutar en Supabase Dashboard > SQL Editor
-- Esto crea todas las tablas necesarias para Mi Tecnicatura
-- ============================================

-- TABLA: materias
CREATE TABLE materias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    profesor VARCHAR(200),
    cuatrimestre SMALLINT NOT NULL DEFAULT 1,
    anio SMALLINT NOT NULL DEFAULT 1,
    dia_cursada VARCHAR(20),
    horario_inicio TIME,
    horario_fin TIME,
    color VARCHAR(7) DEFAULT '#3B82F6',
    link_classroom VARCHAR(500),
    notas TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA: clases
CREATE TABLE clases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    numero_clase SMALLINT,
    fecha DATE,
    link_video VARCHAR(500),
    descripcion TEXT,
    visto BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA: archivos
CREATE TABLE archivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE NOT NULL,
    clase_id UUID REFERENCES clases(id) ON DELETE SET NULL,
    nombre_original VARCHAR(500) NOT NULL,
    nombre_storage VARCHAR(500) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'material',
    tamano_bytes BIGINT,
    url_publica VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA: resumenes
CREATE TABLE resumenes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE NOT NULL,
    clase_id UUID REFERENCES clases(id) ON DELETE SET NULL,
    titulo VARCHAR(300) NOT NULL,
    contenido_original TEXT,
    resumen TEXT NOT NULL,
    conceptos_clave JSONB,
    modelo_ia VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (cada usuario ve solo sus datos)
-- ============================================

ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus materias" ON materias
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios ven solo sus clases" ON clases
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios ven solo sus archivos" ON archivos
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios ven solo sus resumenes" ON resumenes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
