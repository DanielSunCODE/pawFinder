-- 004_raza_opcional.sql
-- La consigna define la raza como opcional. Si no se elige ninguna, id_raza
-- queda NULL; "Sin raza definida / Criollo" sigue siendo una opcion del catalogo
-- por si la persona prefiere marcarla explicitamente.
ALTER TABLE perros MODIFY id_raza INT NULL;
