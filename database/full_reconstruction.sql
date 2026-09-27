-- full_reconstruction.sql
--
-- Reconstruye TODA la base desde cero (esquema + catálogos + perritos de
-- prueba) en un solo comando, sin depender de Node/ts-node. 
--
--   mysql -h localhost -u root -p perritos_db < database/full_reconstruction.sql
--
-- (crea la base antes si no existe: `CREATE DATABASE paw_finder;`)
--
-- Este archivo es la SUMA de database/migrations/001-003 + database/seeds/001-003.
-- Es solo una copia de conveniencia para bootstrap rápido: la fuente de
-- verdad para el control de versiones del esquema sigue siendo la carpeta
-- migrations/ (aplicada vía `npm run db:migrate`). Si cambias algo en
-- migrations/ o seeds/, actualiza también este archivo.
--
-- NO usar contra Aiven/producción: no tiene los DROP TABLE guardados por
-- seguridad; bórralo manualmente si necesitas repetir sobre una base con
-- datos reales.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS idempotencia;
DROP TABLE IF EXISTS perro_colores;
DROP TABLE IF EXISTS perros;
DROP TABLE IF EXISTS patrones_pelaje;
DROP TABLE IF EXISTS colores_ojos;
DROP TABLE IF EXISTS colores;
DROP TABLE IF EXISTS razas;
DROP TABLE IF EXISTS schema_migrations;
SET FOREIGN_KEY_CHECKS = 1;

-- ==================== Migración 001: catálogos ====================
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

-- ==================== Migración 002: perros ====================
-- 002_dogs.sql
-- Entidad principal (perros) y su relación N:M con colores.
--
-- Regla de negocio de perro_colores (no expresable como CHECK declarativo
-- en MySQL 8, se valida en el backend): exactamente un es_dominante=1,
-- de 0 a 2 colores adicionales, máximo 3 colores en total, sin repetir
-- el color principal entre los adicionales.

CREATE TABLE IF NOT EXISTS perros (
    id_perro            INT AUTO_INCREMENT PRIMARY KEY,

    -- Un nombre de puros espacios no cuenta (chk_nombre más abajo).
    nombre              VARCHAR(60) NOT NULL,

    id_raza             INT NOT NULL,
    sexo                VARCHAR(6) NOT NULL,
    id_patron           INT NOT NULL,
    id_color_ojo        INT NOT NULL,
    longitud_pelaje     VARCHAR(10) NOT NULL,
    tamano              VARCHAR(10) NOT NULL,
    etapa_vida          VARCHAR(10) NOT NULL,
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
    CONSTRAINT chk_longitud CHECK (longitud BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS perro_colores (
    id_perro     INT NOT NULL,
    id_color     INT NOT NULL,
    es_dominante TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_perro, id_color),
    CONSTRAINT fk_perrocolor_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro) ON DELETE CASCADE,
    CONSTRAINT fk_perrocolor_color FOREIGN KEY (id_color) REFERENCES colores(id_color)
);

CREATE INDEX idx_perro_raza    ON perros(id_raza);
CREATE INDEX idx_perro_patron  ON perros(id_patron);
CREATE INDEX idx_perro_tamano  ON perros(tamano);
CREATE INDEX idx_perro_sexo    ON perros(sexo);
CREATE INDEX idx_perro_etapa   ON perros(etapa_vida);
CREATE INDEX idx_perro_nombre  ON perros(nombre);
CREATE INDEX idx_perrocolor_color ON perro_colores(id_color);

-- ==================== Migración 003: idempotencia ====================
-- 003_idempotency.sql
--

CREATE TABLE IF NOT EXISTS idempotencia (
    idempotency_key CHAR(36) PRIMARY KEY,
    id_perro        INT NOT NULL,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_idem_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro)
);

-- ==================== Seed: razas ====================
-- 001_breeds.sql
-- 'Sin raza definida / Criollo' ya existe (insertada en la migración 001).
-- Aquí van las razas de catálogo/demo. Se usa ON DUPLICATE KEY para poder
-- correr el seed más de una vez sin explotar por el UNIQUE en `raza`.

INSERT INTO razas (raza) VALUES
    ('Chihuahua'), ('Labrador Retriever'), ('Pastor Alemán'),
    ('Bulldog Francés'), ('Poodle'), ('Schnauzer'),
    ('Salchicha (Dachshund)'), ('Golden Retriever'), ('Pitbull'),
    ('Husky Siberiano'), ('Pastor Australiano'), ('Border Collie'),
    ('Beagle'), ('Bernese Mountain Dog'), ('Rottweiler'), ('Collie'),
    ('Boxer'), ('Gran Danés'), ('Jack Russell Terrier'), ('Dálmata'),
    ('Pastor Belga Malinois'), ('Afghan Hound'),
    ('Perro Lobo Checoslovaco'), ('Setter Inglés'),
    ('Australian Cattle Dog')
ON DUPLICATE KEY UPDATE raza = raza;

-- ==================== Seed: colores ====================
-- 002_colors.sql
INSERT INTO colores (color) VALUES
    ('Negro'), ('Marrón'), ('Gris'), ('Lilac'), ('Rojo'), ('Leonado'),
    ('Canela'), ('Crema'), ('Amarillo'), ('Blanco'), ('Gris lobo'), ('Sable')
ON DUPLICATE KEY UPDATE color = color;

-- ==================== Seed: perritos de prueba ====================
-- 003_test_dogs.sql
-- 15 perritos de prueba. Se usan subconsultas por nombre (no IDs fijos)
-- porque el orden de autoincremento puede variar entre entornos.
-- `ruta_imagen` es la clave que usa el driver de storage (src/storage) para
-- encontrar el archivo; aquí solo se guarda el nombre lógico del archivo,
-- las imágenes reales de prueba las debe poner quien corra el seed en la
-- carpeta que apunte RUTA_IMAGENES (o subirlas al bucket si STORAGE_DRIVER=s3).
-- No corras este seed dos veces sobre la misma base: ruta_imagen es UNIQUE.

INSERT INTO perros
    (nombre, id_raza, sexo, id_patron, id_color_ojo, longitud_pelaje, tamano, etapa_vida, marcas_distintivas, latitud, longitud, ruta_imagen)
VALUES
    ('Firulais',   (SELECT id_raza FROM razas WHERE raza='Labrador Retriever'),        'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'grande',  'adulto',   'Mancha blanca en el pecho',              25.686614, -100.313812, 'seed/firulais.jpg'),
    ('Luna',       (SELECT id_raza FROM razas WHERE raza='Husky Siberiano'),           'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Piebald'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Azul'), 'mediano', 'mediano', 'adulto',   'Heterocromía, un ojo azul y uno café',   25.421700, -101.000700, 'seed/luna.jpg'),
    ('Toby',       (SELECT id_raza FROM razas WHERE raza='Chihuahua'),                 'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'), 'corto',  'pequeño', 'senior',   'Cicatriz en la oreja izquierda',         25.750000, -101.010000, 'seed/toby.jpg'),
    ('Canela',     (SELECT id_raza FROM razas WHERE raza='Sin raza definida / Criollo'),'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Bicolor'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'mediano', 'cachorro', 'Collar rojo de tela',                    25.437000, -100.980000, 'seed/canela.jpg'),
    ('Rocky',      (SELECT id_raza FROM razas WHERE raza='Rottweiler'),                'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Tan Points'),(SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'grande',  'adulto',   NULL,                                       25.400000, -100.960000, 'seed/rocky.jpg'),
    ('Nala',       (SELECT id_raza FROM razas WHERE raza='Pastor Alemán'),             'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Saddle'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Ámbar'),'mediano', 'grande',  'adulto',   'Cojea ligeramente de la pata trasera',    25.690000, -100.320000, 'seed/nala.jpg'),
    ('Max',        (SELECT id_raza FROM razas WHERE raza='Boxer'),                     'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Brindle'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'grande',  'adulto',   NULL,                                       25.395000, -101.005000, 'seed/max.jpg'),
    ('Coco',       (SELECT id_raza FROM razas WHERE raza='Poodle'),                    'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'),'largo',  'pequeño', 'senior',   'Pelaje muy rizado, recién rapado',        25.740000, -100.990000, 'seed/coco.jpg'),
    ('Simba',      (SELECT id_raza FROM razas WHERE raza='Golden Retriever'),          'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'largo',  'grande',  'cachorro', 'Muy juguetón, sin collar',                25.680000, -100.290000, 'seed/simba.jpg'),
    ('Maya',       (SELECT id_raza FROM razas WHERE raza='Border Collie'),             'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Bicolor'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'mediano','mediano', 'adulto',   NULL,                                       25.430000, -100.970000, 'seed/maya.jpg'),
    ('Duke',       (SELECT id_raza FROM razas WHERE raza='Gran Danés'),                'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Harlequin'), (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'gigante', 'adulto',   'Muy alto, orejas caídas',                 25.760000, -101.020000, 'seed/duke.jpg'),
    ('Bella',      (SELECT id_raza FROM razas WHERE raza='Beagle'),                    'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Tricolor'),  (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'mediano', 'cachorro', 'Orejas largas y caídas',                  25.410000, -100.950000, 'seed/bella.jpg'),
    ('Zeus',       (SELECT id_raza FROM razas WHERE raza='Pitbull'),                   'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Brindle'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Ámbar'),'corto',  'mediano', 'adulto',   'Cicatriz cerca del hocico',               25.700000, -100.300000, 'seed/zeus.jpg'),
    ('Chispa',     (SELECT id_raza FROM razas WHERE raza='Dálmata'),                   'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Spotted'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Azul'), 'corto',  'grande',  'adulto',   NULL,                                       25.720000, -100.980000, 'seed/chispa.jpg'),
    ('Rex',        (SELECT id_raza FROM razas WHERE raza='Schnauzer'),                 'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'),'mediano','mediano', 'senior',   'Barba blanca característica',              25.445000, -100.990000, 'seed/rex.jpg'),
    ('Pelusa',     (SELECT id_raza FROM razas WHERE raza='Sin raza definida / Criollo'),'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Agutí'),     (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'largo',   'pequeño', 'cachorro', 'Muy peluda, recién encontrada bajo la lluvia', 25.690000, -101.000000, 'seed/pelusa.jpg');

-- Colores por perrito (principal + hasta 2 adicionales).
-- Se busca id_perro por ruta_imagen porque es UNIQUE y ya se conoce arriba.
INSERT INTO perro_colores (id_perro, id_color, es_dominante) VALUES
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/firulais.jpg'), (SELECT id_color FROM colores WHERE color='Amarillo'), 1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/luna.jpg'),     (SELECT id_color FROM colores WHERE color='Gris lobo'), 1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/luna.jpg'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/toby.jpg'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/canela.jpg'),   (SELECT id_color FROM colores WHERE color='Canela'),    1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/canela.jpg'),   (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/rocky.jpg'),    (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/rocky.jpg'),    (SELECT id_color FROM colores WHERE color='Marrón'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/nala.jpg'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/nala.jpg'),     (SELECT id_color FROM colores WHERE color='Leonado'),   0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/max.jpg'),      (SELECT id_color FROM colores WHERE color='Leonado'),   1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/coco.jpg'),     (SELECT id_color FROM colores WHERE color='Crema'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/simba.jpg'),    (SELECT id_color FROM colores WHERE color='Amarillo'),  1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/maya.jpg'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/maya.jpg'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/duke.jpg'),     (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/duke.jpg'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/bella.jpg'),    (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/bella.jpg'),    (SELECT id_color FROM colores WHERE color='Marrón'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/bella.jpg'),    (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/zeus.jpg'),     (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/chispa.jpg'),   (SELECT id_color FROM colores WHERE color='Blanco'),    1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/chispa.jpg'),   (SELECT id_color FROM colores WHERE color='Negro'),     0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/rex.jpg'),      (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='seed/pelusa.jpg'),   (SELECT id_color FROM colores WHERE color='Crema'),     1);

-- Marca en schema_migrations que las 3 migraciones ya están aplicadas,
-- para que si luego corren `npm run db:migrate` no intente re-aplicarlas.
CREATE TABLE IF NOT EXISTS schema_migrations (
    nombre_archivo VARCHAR(255) PRIMARY KEY,
    aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO schema_migrations (nombre_archivo) VALUES
    ('001_catalogs.sql'), ('002_dogs.sql'), ('003_idempotency.sql')
ON DUPLICATE KEY UPDATE nombre_archivo = nombre_archivo;
