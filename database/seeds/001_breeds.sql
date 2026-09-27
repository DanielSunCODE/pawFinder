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
