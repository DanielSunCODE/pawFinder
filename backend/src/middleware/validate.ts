import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: {
          message: 'Revisa los datos enviados.',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.') || '(cuerpo)',
            message: issue.message,
          })),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
