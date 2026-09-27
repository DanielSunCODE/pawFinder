import { readFileSync } from 'node:fs';
import mysql, { type ConnectionOptions, type Pool } from 'mysql2/promise';
import type { AppConfig, DbConfig } from '../config/env.js';

/**
 * Acepta el certificado CA de dos formas:
 *   - la ruta a un archivo `.pem`, o
 *   - el PEM pegado en la variable (con saltos de línea reales o como `\n`).
 * En `.env` el PEM pegado debe ir entre comillas dobles; sin comillas solo se
 * toma la primera línea.
 */
function cargarCertificadoCa(valor: string): string {
  if (valor.includes('BEGIN CERTIFICATE')) {
    return valor.replace(/\\n/g, '\n');
  }
  return readFileSync(valor, 'utf8');
}

/**
 * Traduce la configuración validada a opciones de conexión de mysql2.
 * En producción (Aiven) activa TLS con el CA indicado en DB_SSL_CA.
 */
export function buildDbConfig(config: DbConfig): ConnectionOptions {
  const base: ConnectionOptions = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
  };

  if (!config.DB_SSL) {
    return base;
  }

  if (!config.DB_SSL_CA) {
    throw new Error(
      'DB_SSL=true requiere DB_SSL_CA con la ruta al certificado CA de Aiven o el PEM pegado (Overview > CA certificate).',
    );
  }

  return {
    ...base,
    ssl: {
      ca: cargarCertificadoCa(config.DB_SSL_CA),
      rejectUnauthorized: true,
    },
  };
}

/** Pool que usa el backend para las consultas de la API. No conecta hasta la primera consulta. */
export function createPool(config: AppConfig): Pool {
  return mysql.createPool({
    ...buildDbConfig(config),
    waitForConnections: true,
    connectionLimit: config.DB_CONNECTION_LIMIT,
    queueLimit: 0,
  });
}

/** Conexión suelta con `multipleStatements` para correr archivos .sql completos (scripts). */
export function createScriptConnection(config: DbConfig) {
  return mysql.createConnection({ ...buildDbConfig(config), multipleStatements: true });
}

/** ¿La base responde? Útil para el chequeo de salud. */
export async function pingDB(pool: Pool): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
    return true;
  } finally {
    connection.release();
  }
}
