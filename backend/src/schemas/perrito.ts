import { z } from 'zod';

/**
 * Esquemas de dominio del registro de perritos. Son la fuente de verdad para
 * validar en el backend y para generar la documentacion OpenAPI.
 */

// Valores fijos que acepta la base (CHECK en 002_dogs.sql). El backend repite
// la validación: no confía en el cliente.
const SEXOS = ['macho', 'hembra'] as const;
const ETAPAS_VIDA = ['cachorro', 'adulto', 'senior'] as const;
const TAMANOS = ['pequeño', 'mediano', 'grande', 'gigante'] as const;
const LONGITUDES_PELAJE = ['corto', 'mediano', 'largo'] as const;

/** Texto opcional que llega del multipart: vacío o ausente se guarda como NULL. */
const textoOpcional = z.preprocess(
  (valor) => (valor === undefined || valor === null || valor === '' ? null : valor),
  z.string().trim().max(500).nullable(),
);

/** Cuerpo de `datos` (JSON) que viaja dentro del multipart del registro. */
export const datosPerritoNuevoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre no puede estar vacío.')
      .max(60, 'El nombre no puede pasar de 60 caracteres.'),
    razaId: z.number().int().positive(),
    // Campos descriptivos obligatorios.
    sexo: z.enum(SEXOS),
    etapaVida: z.enum(ETAPAS_VIDA),
    tamano: z.enum(TAMANOS),
    longitudPelaje: z.enum(LONGITUDES_PELAJE),
    patronPelajeId: z.number().int().positive(),
    colorOjosId: z.number().int().positive(),
    // Único campo opcional (null = no se conocen).
    marcasDistintivas: textoOpcional.default(null),
    // Colores de pelo.
    colorPrincipalId: z.number().int().positive(),
    coloresAdicionalesIds: z.array(z.number().int().positive()).max(2).default([]),
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
  })
  .superRefine((value, ctx) => {
    const adicionales = value.coloresAdicionalesIds;

    if (new Set(adicionales).size !== adicionales.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coloresAdicionalesIds'],
        message: 'No se puede repetir un color adicional.',
      });
    }

    if (adicionales.includes(value.colorPrincipalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coloresAdicionalesIds'],
        message: 'Los colores adicionales no pueden repetir el color principal.',
      });
    }
  });

export type DatosPerritoNuevo = z.infer<typeof datosPerritoNuevoSchema>;

/** Filtros de la lista (query params). */
export const filtrosPerritosSchema = z.object({
  busqueda: z.string().trim().min(1).max(60).optional(),
  colorId: z.coerce.number().int().positive().optional(),
  razaId: z.coerce.number().int().positive().optional(),
});

export type FiltrosPerritos = z.infer<typeof filtrosPerritosSchema>;

/** Parametro de ruta con el id del perrito. */
export const idPerritoSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Clave de idempotencia que manda el formulario al registrar. */
export const idempotencyKeySchema = z.string().min(8).max(64);
