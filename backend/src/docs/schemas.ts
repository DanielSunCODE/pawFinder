import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Habilita `.openapi()` en los esquemas Zod. Se ejecuta una sola vez aquí y
// afecta a la instancia global de `z`, así que el resto del backend puede usar
// los mismos esquemas para validar y para documentar.
extendZodWithOpenApi(z);

/** Detalle de un error de validación por campo (contrato de `validateBody`). */
export const fieldErrorSchema = z
  .object({
    field: z.string().openapi({ example: 'nombre' }),
    message: z.string().openapi({ example: 'Falta el nombre' }),
  })
  .openapi('FieldError');

/** Envelope de error uniforme del API: `{ error: { message, details? } }`. */
export const errorResponseSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: 'Revisa los datos enviados.' }),
      details: z.array(fieldErrorSchema).optional(),
    }),
  })
  .openapi('ErrorResponse');

/** Datos del endpoint de salud. */
export const healthDataSchema = z
  .object({
    status: z.literal('ok'),
    uptime: z.number().openapi({ example: 12.34 }),
    timestamp: z.string().openapi({ example: '2026-09-26T00:00:00.000Z' }),
  })
  .openapi('HealthData');

/** Envelope de éxito uniforme del API: `{ data: ... }`. */
export const healthResponseSchema = z
  .object({
    data: healthDataSchema,
  })
  .openapi('HealthResponse');

/** Parámetro de ruta con el identificador de un perrito. */
export const perritoIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive().openapi({ example: 1 }),
  })
  .openapi('PerritoIdParam');

// ── Dominio ──────────────────────────────────────────────────────────────────

export const razaSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 3 }),
    nombre: z.string().openapi({ example: 'Labrador Retriever' }),
  })
  .openapi('Raza');

export const colorSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    nombre: z.string().openapi({ example: 'Negro' }),
    hex: z.string().nullable().openapi({ example: null }),
  })
  .openapi('Color');

export const patronPelajeSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 2 }),
    nombre: z.string().openapi({ example: 'Bicolor' }),
  })
  .openapi('PatronPelaje');

export const perritoSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 42 }),
    nombre: z.string().openapi({ example: 'Luna' }),
    fotoUrl: z.string().openapi({ example: 'http://localhost:3000/api/perritos/42/foto' }),
    miniaturaUrl: z.string().openapi({ example: 'http://localhost:3000/api/perritos/42/foto' }),
    raza: razaSchema.nullable(),
    colorPrincipal: colorSchema,
    coloresAdicionales: z.array(colorSchema).max(2),
    sexo: z.string().nullable().openapi({ example: 'hembra' }),
    etapaVida: z.string().nullable().openapi({ example: 'adulto' }),
    tamano: z.string().nullable().openapi({ example: 'mediano' }),
    longitudPelaje: z.string().nullable().openapi({ example: 'corto' }),
    patronPelaje: patronPelajeSchema.nullable(),
    colorOjos: colorSchema.nullable(),
    marcasDistintivas: z.string().nullable().openapi({ example: 'Mancha blanca en el pecho' }),
    latitud: z.number().openapi({ example: 25.686614 }),
    longitud: z.number().openapi({ example: -100.313812 }),
    fechaRegistro: z.string().openapi({ example: '2026-09-26T18:40:00.000Z' }),
  })
  .openapi('Perrito');

export const perritoResponseSchema = z.object({ data: perritoSchema }).openapi('PerritoResponse');

export const perritosResponseSchema = z
  .object({ data: z.array(perritoSchema) })
  .openapi('PerritosResponse');

export const razasResponseSchema = z
  .object({ data: z.array(razaSchema) })
  .openapi('RazasResponse');

export const coloresResponseSchema = z
  .object({ data: z.array(colorSchema) })
  .openapi('ColoresResponse');

export const coloresOjosResponseSchema = z
  .object({ data: z.array(colorSchema) })
  .openapi('ColoresOjosResponse');

export const patronesPelajeResponseSchema = z
  .object({ data: z.array(patronPelajeSchema) })
  .openapi('PatronesPelajeResponse');

export const conteoColorSchema = z
  .object({
    id: z.number().int().positive(),
    nombre: z.string(),
    total: z.number().int().nonnegative(),
  })
  .openapi('ConteoColor');

export const estadisticasResponseSchema = z
  .object({
    data: z.object({
      total: z.number().int().nonnegative(),
      porColor: z.array(conteoColorSchema),
    }),
  })
  .openapi('EstadisticasResponse');

/** Cuerpo multipart del registro: datos individuales + `foto` (binario). */
export const subidaPerritoSchema = z
  .object({
    nombre: z.string().openapi({ example: 'Luna', description: 'Texto no vacío.' }),
    razaId: z.coerce.number().int().positive().optional().openapi({
      example: 2,
      description: 'Omitir si no se conoce la raza ("Sin raza definida / Criollo" es una raza más del catálogo).',
    }),
    colorPrincipalId: z.coerce.number().int().positive().openapi({ example: 1 }),
    coloresAdicionalesIds: z
      .array(z.coerce.number().int().positive())
      .max(2)
      .optional()
      .openapi({
        example: [10],
        description: 'De 0 a 2 colores, sin repetir el principal. Envío repetido del mismo campo.',
      }),
    sexo: z.enum(['macho', 'hembra']).optional().openapi({ example: 'hembra' }),
    etapaVida: z.enum(['cachorro', 'adulto', 'senior']).optional().openapi({ example: 'adulto' }),
    tamano: z
      .enum(['pequeño', 'mediano', 'grande', 'gigante'])
      .optional()
      .openapi({ example: 'mediano' }),
    longitudPelaje: z
      .enum(['corto', 'mediano', 'largo'])
      .optional()
      .openapi({ example: 'corto' }),
    patronPelajeId: z.coerce.number().int().positive().optional().openapi({ example: 2 }),
    colorOjosId: z.coerce.number().int().positive().optional().openapi({ example: 3 }),
    marcasDistintivas: z.string().max(500).optional().openapi({ example: 'Mancha blanca en el pecho' }),
    latitud: z.coerce.number().openapi({ example: 25.686614 }),
    longitud: z.coerce.number().openapi({ example: -100.313812 }),
    foto: z.string().openapi({ type: 'string', format: 'binary' }),
  })
  .openapi('SubidaPerrito');

/** Encabezado de idempotencia del registro. */
export const idempotencyHeaderSchema = z
  .object({
    'Idempotency-Key': z.string().min(8).max(64).openapi({
      description:
        'Clave generada al abrir el formulario. Reintentar con la misma clave devuelve el mismo perrito.',
      example: '3b1a2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    }),
  })
  .openapi('IdempotencyHeader');
