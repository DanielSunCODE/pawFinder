-- 006_raza_y_color_ojos_requeridos.sql
-- La raza y el color de ojos pasan a ser obligatorios. A partir de aquí el
-- único campo nullable de `perros` es marcas_distintivas.
-- La raza se elige del catálogo; para "no se sabe" existe la opción
-- "Sin raza definida / Criollo" (004_raza_opcional.sql la mantenía nullable).
--
-- Se rellenan los registros viejos con valores neutros para poder aplicar NOT NULL.

UPDATE perros
SET id_raza = (SELECT id_raza FROM razas WHERE raza = 'Sin raza definida / Criollo' LIMIT 1)
WHERE id_raza IS NULL;

UPDATE perros
SET id_color_ojo = (SELECT id_color_ojo FROM colores_ojos WHERE color_ojo = 'Café' LIMIT 1)
WHERE id_color_ojo IS NULL;

ALTER TABLE perros
    MODIFY id_raza      INT NOT NULL,
    MODIFY id_color_ojo INT NOT NULL;
