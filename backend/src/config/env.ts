import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_SSL: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    DB_SSL_CA: z.string().optional(),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    RUTA_IMAGENES: z.string().optional(),
    IMAGE_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),

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
      const requiredS3 = [
        'AWS_REGION',
        'AWS_S3_BUCKET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ] as const;
      for (const key of requiredS3) {
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

export type AppConfig = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const variables = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join('.') || '(desconocida)')),
    ];
    throw new Error(
      `Configuracion de entorno invalida o incompleta. Revisa: ${variables.join(', ')}`,
    );
  }

  return parsed.data;
}
