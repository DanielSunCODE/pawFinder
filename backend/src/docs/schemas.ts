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
