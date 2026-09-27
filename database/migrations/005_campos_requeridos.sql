-- 005_campos_requeridos.sql
-- Regla de negocio: sexo, patrón de pelaje, largo del pelo, tamaño y etapa de
-- vida son obligatorios y NO admiten NULL. La raza y el color de ojos pasan a
-- ser obligatorios en 006; el único campo nullable de `perros` es
-- marcas_distintivas.
--
-- Los registros creados antes de que el backend guardara estos campos quedaron
-- en NULL; se rellenan con valores neutros para poder aplicar NOT NULL.

UPDATE perros
SET sexo            = COALESCE(sexo, 'macho'),
    etapa_vida      = COALESCE(etapa_vida, 'adulto'),
    tamano          = COALESCE(tamano, 'mediano'),
    longitud_pelaje = COALESCE(longitud_pelaje, 'corto'),
    id_patron       = COALESCE(id_patron, (SELECT id_patron FROM patrones_pelaje WHERE patron = 'Sólido' LIMIT 1))
WHERE sexo IS NULL
   OR etapa_vida IS NULL
   OR tamano IS NULL
   OR longitud_pelaje IS NULL
   OR id_patron IS NULL;

ALTER TABLE perros
    MODIFY sexo            VARCHAR(6)  NOT NULL,
    MODIFY id_patron       INT         NOT NULL,
    MODIFY longitud_pelaje VARCHAR(10) NOT NULL,
    MODIFY tamano          VARCHAR(10) NOT NULL,
    MODIFY etapa_vida      VARCHAR(10) NOT NULL;
