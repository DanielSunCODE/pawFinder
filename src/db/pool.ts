import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL,
  DB_SSL_CA,
  DB_CONNECTION_LIMIT = '10',
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error(
    'Faltan variables de entorno de conexión a la base de datos (DB_USER, DB_PASSWORD, DB_NAME). Revisa tu .env'
  );
}

const useSSL = DB_SSL === 'true';

let ssl: mysql.PoolOptions['ssl'];
if (useSSL) {
  if (!DB_SSL_CA) {
    throw new Error(
      'DB_SSL=true requiere DB_SSL_CA con la ruta al certificado CA (el ca.pem que da Aiven en "Overview > CA certificate")'
    );
  }
  ssl = {
    ca: fs.readFileSync(DB_SSL_CA, 'utf8'),
    // Aiven usa certificados válidos emitidos por su propia CA: nunca
    // desactivar la verificación (rejectUnauthorized: false) aunque falle
    // en un primer intento; el problema casi siempre es la ruta a DB_SSL_CA.
    rejectUnauthorized: true,
  };
}

// Config compartida también por database/scripts/migrate.ts y seed.ts,
// que necesitan su propia conexión (con multipleStatements) para poder
// ejecutar archivos .sql completos en un solo query.
export const dbConfig = {
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl,
};

// Pool que usa el backend para las consultas normales de la API.
// OJO: aquí NO se activa multipleStatements (sería una superficie de
// inyección SQL si algún query se arma con datos del usuario).
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: Number(DB_CONNECTION_LIMIT),
  queueLimit: 0,
});

export async function pingDB(): Promise<boolean> {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    conn.release();
  }
}
