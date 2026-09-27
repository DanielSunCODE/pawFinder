-- 002_colors.sql
INSERT INTO colores (color) VALUES
    ('Negro'), ('Marrón'), ('Gris'), ('Lilac'), ('Rojo'), ('Leonado'),
    ('Canela'), ('Crema'), ('Amarillo'), ('Blanco'), ('Gris lobo'), ('Sable')
ON DUPLICATE KEY UPDATE color = color;
