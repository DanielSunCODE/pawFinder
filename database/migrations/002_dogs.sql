-- 002_dogs.sql
-- Entidad principal (perros) y su relación N:M con colores.
--
-- Regla de negocio de perro_colores (no expresable como CHECK declarativo
-- en MySQL 8, se valida en el backend): exactamente un es_dominante=1,
-- de 0 a 2 colores adicionales, máximo 3 colores en total, sin repetir
-- el color principal entre los adicionales.

CREATE TABLE IF NOT EXISTS perros (
    id_perro            INT AUTO_INCREMENT PRIMARY KEY,

    nombre              VARCHAR(60) NOT NULL,

    id_raza             INT NOT NULL,
    sexo                VARCHAR(6) NULL,
    id_patron           INT NULL,
    id_color_ojo        INT NULL,
    longitud_pelaje     VARCHAR(10) NULL,
    tamano              VARCHAR(10) NULL,
    etapa_vida          VARCHAR(10) NULL,
    marcas_distintivas  VARCHAR(500) NULL,

    -- Ubicación donde se encontró al perrito (obligatoria).
    latitud             DECIMAL(9,6) NOT NULL,
    longitud            DECIMAL(9,6) NOT NULL,

    ruta_imagen         VARCHAR(255) NOT NULL UNIQUE,
    fecha_registro      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_perro_raza      FOREIGN KEY (id_raza)      REFERENCES razas(id_raza),
    CONSTRAINT fk_perro_patron    FOREIGN KEY (id_patron)    REFERENCES patrones_pelaje(id_patron),
    CONSTRAINT fk_perro_colorojo  FOREIGN KEY (id_color_ojo) REFERENCES colores_ojos(id_color_ojo),

    CONSTRAINT chk_nombre CHECK (TRIM(nombre) <> ''),
    CONSTRAINT chk_sexo   CHECK (sexo IN ('macho', 'hembra')),
    CONSTRAINT chk_pelaje CHECK (longitud_pelaje IN ('corto', 'mediano', 'largo')),
    CONSTRAINT chk_tamano CHECK (tamano IN ('pequeño', 'mediano', 'grande', 'gigante')),
    CONSTRAINT chk_etapa  CHECK (etapa_vida IN ('cachorro', 'adulto', 'senior')),
    CONSTRAINT chk_latitud  CHECK (latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_longitud CHECK (longitud BETWEEN -180 AND 180),

    -- Los índices van dentro del CREATE TABLE para que la migración sea
    -- idempotente (un CREATE INDEX suelto falla si el índice ya existe).
    INDEX idx_perro_raza   (id_raza),
    INDEX idx_perro_patron (id_patron),
    INDEX idx_perro_tamano (tamano),
    INDEX idx_perro_sexo   (sexo),
    INDEX idx_perro_etapa  (etapa_vida),
    INDEX idx_perro_nombre (nombre)
);

CREATE TABLE IF NOT EXISTS perro_colores (
    id_perro     INT NOT NULL,
    id_color     INT NOT NULL,
    es_dominante TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_perro, id_color),
    CONSTRAINT fk_perrocolor_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro) ON DELETE CASCADE,
    CONSTRAINT fk_perrocolor_color FOREIGN KEY (id_color) REFERENCES colores(id_color),
    INDEX idx_perrocolor_color (id_color)
);
