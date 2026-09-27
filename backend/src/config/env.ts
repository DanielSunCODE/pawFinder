import { z } from 'zod';

const booleanoDesdeTexto = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

/**
 * Configuración de base de datos. La comparten el backend y los scripts de
 * `database/scripts`, que necesitan conectarse sin cargar las variables de la
 * API. Un solo esquema evita dos fuentes de verdad.
 */
export const dbEnvSchema = z.object({
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),
  DB_SSL: booleanoDesdeTexto,
  DB_SSL_CA: z.string().optional(),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
});

const envSchema = dbEnvSchema
  .extend({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    RUTA_IMAGENES: z.string().optional(),
    IMAGE_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),

    // Compresión de las fotos subidas.
    IMAGE_MAX_DIMENSION: z.coerce.number().int().positive().default(1600),
    IMAGE_QUALITY: z.coerce.number().int().min(1).max(100).default(80),
    IMAGE_OUTPUT_FORMAT: z.enum(['webp', 'jpeg']).default('webp'),

    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    PUBLIC_BASE_URL: z.string().optional(),
    OPENAPI_SERVER_URL: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.STORAGE_DRIVER === 'local' && !value.RUTA_IMAGENES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RUTA_IMAGENES'],
        message: 'RUTA_IMAGENES es obligatoria cuando STORAGE_DRIVER=local',
      });
    }

    if (value.STORAGE_DRIVER === 's3') {
      const requeridas = [
        'AWS_REGION',
        'AWS_S3_BUCKET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ] as const;
      for (const key of requeridas) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} es obligatoria cuando STORAGE_DRIVER=s3`,
          });
        }
      }
    }
  });

export type DbConfig = z.infer<typeof dbEnvSchema>;
export type AppConfig = z.infer<typeof envSchema>;

function mensajeDeErrores(error: z.ZodError): string {
  const variables = [
    ...new Set(error.issues.map((issue) => issue.path.join('.') || '(desconocida)')),
  ];
  return `Configuracion de entorno invalida o incompleta. Revisa: ${variables.join(', ')}`;
}

/** Valida solo la configuración de base de datos (la usan los scripts SQL). */
export function loadDbEnv(source: NodeJS.ProcessEnv = process.env): DbConfig {
  const parsed = dbEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(mensajeDeErrores(parsed.error));
  }
  return parsed.data;
}

/** Valida la configuración completa del backend. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(mensajeDeErrores(parsed.error));
  }
  return parsed.data;
}
