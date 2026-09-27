-- Esquema de base de datos — Registro y búsqueda de perros
-- Motor: MySQL 8.0+ (Aiven) | Base de datos: prolog_perros
-- Charset/collation: utf8mb4 / utf8mb4_0900_ai_ci

-- =========================
-- Catálogos
-- =========================

CREATE TABLE razas (
    id_raza     INT AUTO_INCREMENT PRIMARY KEY,
    raza        VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE colores (
    id_color    INT AUTO_INCREMENT PRIMARY KEY,
    color       VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE colores_ojos (
    id_color_ojo INT AUTO_INCREMENT PRIMARY KEY,
    color_ojo    VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE patrones_pelaje (
    id_patron   INT AUTO_INCREMENT PRIMARY KEY,
    patron      VARCHAR(30) NOT NULL UNIQUE
);

-- =========================
-- Entidad principal
-- =========================

CREATE TABLE perros (
    id_perro            INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(60) NULL,
    id_raza             INT NOT NULL,
    sexo                VARCHAR(6) NOT NULL,
    id_patron           INT NOT NULL,
    id_color_ojo        INT NOT NULL,
    longitud_pelaje     VARCHAR(10) NOT NULL,
    tamano              VARCHAR(10) NOT NULL,
    etapa_vida          VARCHAR(10) NOT NULL,
    marcas_distintivas  VARCHAR(500) NULL,
    tiene_dueno         TINYINT NOT NULL,
    ruta_imagen         CHAR(36) NOT NULL UNIQUE,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_perro_raza      FOREIGN KEY (id_raza)      REFERENCES razas(id_raza),
    CONSTRAINT fk_perro_patron    FOREIGN KEY (id_patron)    REFERENCES patrones_pelaje(id_patron),
    CONSTRAINT fk_perro_colorojo  FOREIGN KEY (id_color_ojo) REFERENCES colores_ojos(id_color_ojo),

    CONSTRAINT chk_sexo   CHECK (sexo IN ('macho', 'hembra')),
    CONSTRAINT chk_pelaje CHECK (longitud_pelaje IN ('corto', 'mediano', 'largo')),
    CONSTRAINT chk_tamano CHECK (tamano IN ('pequeño', 'mediano', 'grande', 'gigante')),
    CONSTRAINT chk_etapa  CHECK (etapa_vida IN ('cachorro', 'adulto', 'senior'))
);

-- Colores de un perro (relación N:M): un perro puede tener varios
-- colores en distintas zonas del cuerpo.
CREATE TABLE perro_colores (
    id_perro     INT NOT NULL,
    id_color     INT NOT NULL,
    es_dominante TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_perro, id_color),
    CONSTRAINT fk_perrocolor_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro) ON DELETE CASCADE,
    CONSTRAINT fk_perrocolor_color FOREIGN KEY (id_color) REFERENCES colores(id_color)
);

-- Soporte de idempotencia para POST /perros.
CREATE TABLE idempotencia (
    idempotency_key CHAR(36) PRIMARY KEY,
    id_perro        INT NOT NULL,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_idem_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro)
);

-- =========================
-- Índices de búsqueda
-- =========================

CREATE INDEX idx_perro_raza    ON perros(id_raza);
CREATE INDEX idx_perro_patron  ON perros(id_patron);
CREATE INDEX idx_perro_tamano  ON perros(tamano);
CREATE INDEX idx_perro_sexo    ON perros(sexo);
CREATE INDEX idx_perro_etapa   ON perros(etapa_vida);
CREATE INDEX idx_perro_nombre  ON perros(nombre);
CREATE INDEX idx_perrocolor_color ON perro_colores(id_color);

-- =========================
-- Datos de catálogo
-- =========================

INSERT INTO razas (raza) VALUES
    ('Mestizo'), ('Chihuahua'), ('Labrador Retriever'), ('Pastor Alemán'),
    ('Bulldog Francés'), ('Poodle'), ('Schnauzer'), ('Salchicha (Dachshund)'),
    ('Golden Retriever'), ('Pitbull'), ('Husky Siberiano'), ('Pastor Australiano'),
    ('Border Collie'), ('Beagle'), ('Bernese Mountain Dog'), ('Rottweiler'),
    ('Collie'), ('Boxer'), ('Gran Danés'), ('Jack Russell Terrier'), ('Dálmata'),
    ('Pastor Belga Malinois'), ('Afghan Hound'), ('Perro Lobo Checoslovaco'),
    ('Setter Inglés'), ('Australian Cattle Dog');

INSERT INTO colores (color) VALUES
    ('Negro'), ('Marrón'), ('Gris'), ('Lilac'), ('Rojo'), ('Leonado'),
    ('Canela'), ('Crema'), ('Amarillo'), ('Blanco'), ('Gris lobo'), ('Sable');

INSERT INTO colores_ojos (color_ojo) VALUES
    ('Café'), ('Azul'), ('Verde'), ('Gris'), ('Negro'), ('Ámbar');

INSERT INTO patrones_pelaje (patron) VALUES
    ('Sólido'), ('Bicolor'), ('Tricolor'), ('Tan Points'), ('Sable'),
    ('Agutí'), ('Saddle'), ('Brindle'), ('Merle'), ('Harlequin'),
    ('Piebald'), ('Parti-Color'), ('Ticking'), ('Roan'), ('Spotted'),
    ('Máscara Melanística'), ('Domino/Grizzle'), ('Wolf Pattern');
