-- 003_idempotency.sql

CREATE TABLE IF NOT EXISTS idempotencia (
    idempotency_key CHAR(36) PRIMARY KEY,
    id_perro        INT NOT NULL,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_idem_perro FOREIGN KEY (id_perro) REFERENCES perros(id_perro) ON DELETE CASCADE
);
