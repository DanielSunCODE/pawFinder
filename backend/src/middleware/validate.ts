import type { RequestHandler } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

/** Convierte los errores de Zod en detalles por campo para el contrato de error. */
export function detallesDeZod(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(cuerpo)',
    message: issue.message,
  }));
}

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: {
          message: 'Revisa los datos enviados.',
          details: detallesDeZod(result.error),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
