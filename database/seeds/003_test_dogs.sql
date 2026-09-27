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
