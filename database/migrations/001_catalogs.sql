-- 001_catalogs.sql
-- Tablas de catálogo. Los enums fijos (colores_ojos, patrones_pelaje) se
-- insertan aquí porque son parte del "contrato" del esquema, no datos de
-- ambiente. Las listas abiertas (razas, colores) solo reciben aquí el
-- valor obligatorio que el negocio necesita; el resto de razas/colores
-- de catálogo vienen en los seeds (database/seeds/001_breeds.sql y
-- 002_colors.sql), para poder variar entre entornos sin tocar el esquema.

CREATE TABLE IF NOT EXISTS razas (
    id_raza     INT AUTO_INCREMENT PRIMARY KEY,
    raza        VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS colores (
    id_color    INT AUTO_INCREMENT PRIMARY KEY,
    color       VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS colores_ojos (
    id_color_ojo INT AUTO_INCREMENT PRIMARY KEY,
    color_ojo    VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS patrones_pelaje (
    id_patron   INT AUTO_INCREMENT PRIMARY KEY,
    patron      VARCHAR(30) NOT NULL UNIQUE
);

-- Valor obligatorio: todo perrito sin raza identificable debe poder
-- registrarse igual. Va en la migración (no en el seed) porque el backend
-- puede depender de que este valor exista siempre, incluso en producción.
INSERT INTO razas (raza) VALUES ('Sin raza definida / Criollo')
    ON DUPLICATE KEY UPDATE raza = raza;

-- Catálogos fijos completos (no cambian por ambiente).
INSERT INTO colores_ojos (color_ojo) VALUES
    ('Café'), ('Azul'), ('Verde'), ('Gris'), ('Negro'), ('Ámbar')
    ON DUPLICATE KEY UPDATE color_ojo = color_ojo;

INSERT INTO patrones_pelaje (patron) VALUES
    ('Sólido'), ('Bicolor'), ('Tricolor'), ('Tan Points'), ('Sable'),
    ('Agutí'), ('Saddle'), ('Brindle'), ('Merle'), ('Harlequin'),
    ('Piebald'), ('Parti-Color'), ('Ticking'), ('Roan'), ('Spotted'),
    ('Máscara Melanística'), ('Domino/Grizzle'), ('Wolf Pattern')
    ON DUPLICATE KEY UPDATE patron = patron;
