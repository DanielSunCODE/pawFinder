-- 003_test_dogs.sql
-- 15 perritos de prueba. Se usan subconsultas por nombre (no IDs fijos)
-- porque el orden de autoincremento puede variar entre entornos.
-- `ruta_imagen` es la clave que usa el driver de storage (backend/src/storage) para
-- encontrar el archivo; aquí solo se guarda el nombre lógico del archivo,
-- las imágenes reales de prueba las debe poner quien corra el seed en la
-- carpeta que apunte RUTA_IMAGENES (o subirlas al bucket si STORAGE_DRIVER=s3).
-- El script `database/scripts/seed.ts` genera automaticamente una imagen
-- valida para cada ruta_imagen cuando RUTA_IMAGENES esta definida (modo local),
-- asi los perritos de prueba tienen foto sin versionar archivos pesados.
-- No corras este seed dos veces sobre la misma base: ruta_imagen es UNIQUE.

INSERT INTO perros
    (nombre, id_raza, sexo, id_patron, id_color_ojo, longitud_pelaje, tamano, etapa_vida, marcas_distintivas, latitud, longitud, ruta_imagen)
VALUES
    ('Firulais',   (SELECT id_raza FROM razas WHERE raza='Labrador Retriever'),        'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'grande',  'adulto',   'Mancha blanca en el pecho',              25.686614, -100.313812, 'firulais.png'),
    ('Luna',       (SELECT id_raza FROM razas WHERE raza='Husky Siberiano'),           'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Piebald'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Azul'), 'mediano', 'mediano', 'adulto',   'Heterocromía, un ojo azul y uno café',   25.421700, -101.000700, 'luna.png'),
    ('Toby',       (SELECT id_raza FROM razas WHERE raza='Chihuahua'),                 'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'), 'corto',  'pequeño', 'senior',   'Cicatriz en la oreja izquierda',         25.750000, -101.010000, 'toby.png'),
    ('Canela',     (SELECT id_raza FROM razas WHERE raza='Sin raza definida / Criollo'),'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Bicolor'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'mediano', 'cachorro', 'Collar rojo de tela',                    25.437000, -100.980000, 'canela.png'),
    ('Rocky',      (SELECT id_raza FROM razas WHERE raza='Rottweiler'),                'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Tan Points'),(SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'corto',   'grande',  'adulto',   NULL,                                       25.400000, -100.960000, 'rocky.png'),
    ('Nala',       (SELECT id_raza FROM razas WHERE raza='Pastor Alemán'),             'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Saddle'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Ámbar'),'mediano', 'grande',  'adulto',   'Cojea ligeramente de la pata trasera',    25.690000, -100.320000, 'nala.png'),
    ('Max',        (SELECT id_raza FROM razas WHERE raza='Boxer'),                     'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Brindle'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'grande',  'adulto',   NULL,                                       25.395000, -101.005000, 'max.png'),
    ('Coco',       (SELECT id_raza FROM razas WHERE raza='Poodle'),                    'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'),'largo',  'pequeño', 'senior',   'Pelaje muy rizado, recién rapado',        25.740000, -100.990000, 'coco.png'),
    ('Simba',      (SELECT id_raza FROM razas WHERE raza='Golden Retriever'),          'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'largo',  'grande',  'cachorro', 'Muy juguetón, sin collar',                25.680000, -100.290000, 'simba.png'),
    ('Maya',       (SELECT id_raza FROM razas WHERE raza='Border Collie'),             'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Bicolor'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'mediano','mediano', 'adulto',   NULL,                                       25.430000, -100.970000, 'maya.png'),
    ('Duke',       (SELECT id_raza FROM razas WHERE raza='Gran Danés'),                'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Harlequin'), (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'gigante', 'adulto',   'Muy alto, orejas caídas',                 25.760000, -101.020000, 'duke.png'),
    ('Bella',      (SELECT id_raza FROM razas WHERE raza='Beagle'),                    'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Tricolor'),  (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'), 'corto',  'mediano', 'cachorro', 'Orejas largas y caídas',                  25.410000, -100.950000, 'bella.png'),
    ('Zeus',       (SELECT id_raza FROM razas WHERE raza='Pitbull'),                   'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Brindle'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Ámbar'),'corto',  'mediano', 'adulto',   'Cicatriz cerca del hocico',               25.700000, -100.300000, 'zeus.png'),
    ('Chispa',     (SELECT id_raza FROM razas WHERE raza='Dálmata'),                   'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Spotted'),   (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Azul'), 'corto',  'grande',  'adulto',   NULL,                                       25.720000, -100.980000, 'chispa.png'),
    ('Rex',        (SELECT id_raza FROM razas WHERE raza='Schnauzer'),                 'macho',  (SELECT id_patron FROM patrones_pelaje WHERE patron='Sólido'),    (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Negro'),'mediano','mediano', 'senior',   'Barba blanca característica',              25.445000, -100.990000, 'rex.png'),
    ('Pelusa',     (SELECT id_raza FROM razas WHERE raza='Sin raza definida / Criollo'),'hembra', (SELECT id_patron FROM patrones_pelaje WHERE patron='Agutí'),     (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo='Café'),  'largo',   'pequeño', 'cachorro', 'Muy peluda, recién encontrada bajo la lluvia', 25.690000, -101.000000, 'pelusa.png');

-- Colores por perrito (principal + hasta 2 adicionales).
-- Se busca id_perro por ruta_imagen porque es UNIQUE y ya se conoce arriba.
INSERT INTO perro_colores (id_perro, id_color, es_dominante) VALUES
    ((SELECT id_perro FROM perros WHERE ruta_imagen='firulais.png'), (SELECT id_color FROM colores WHERE color='Amarillo'), 1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='luna.png'),     (SELECT id_color FROM colores WHERE color='Gris lobo'), 1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='luna.png'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='toby.png'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='canela.png'),   (SELECT id_color FROM colores WHERE color='Canela'),    1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='canela.png'),   (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='rocky.png'),    (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='rocky.png'),    (SELECT id_color FROM colores WHERE color='Marrón'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='nala.png'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='nala.png'),     (SELECT id_color FROM colores WHERE color='Leonado'),   0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='max.png'),      (SELECT id_color FROM colores WHERE color='Leonado'),   1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='coco.png'),     (SELECT id_color FROM colores WHERE color='Crema'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='simba.png'),    (SELECT id_color FROM colores WHERE color='Amarillo'),  1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='maya.png'),     (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='maya.png'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='duke.png'),     (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='duke.png'),     (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='bella.png'),    (SELECT id_color FROM colores WHERE color='Negro'),     1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='bella.png'),    (SELECT id_color FROM colores WHERE color='Marrón'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='bella.png'),    (SELECT id_color FROM colores WHERE color='Blanco'),    0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='zeus.png'),     (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='chispa.png'),   (SELECT id_color FROM colores WHERE color='Blanco'),    1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='chispa.png'),   (SELECT id_color FROM colores WHERE color='Negro'),     0),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='rex.png'),      (SELECT id_color FROM colores WHERE color='Gris'),      1),
    ((SELECT id_perro FROM perros WHERE ruta_imagen='pelusa.png'),   (SELECT id_color FROM colores WHERE color='Crema'),     1);
