import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import type { AppConfig } from '../config/env.js';
import { aPerritoApi, aPerritosApi } from '../mappers/perritoMapper.js';
import { HttpError } from '../middleware/errorHandler.js';
import { detallesDeZod } from '../middleware/validate.js';
import type { PerritosRepository } from '../repositories/perritosRepository.js';
import {
  datosPerritoNuevoSchema,
  filtrosPerritosSchema,
  idempotencyKeySchema,
  idPerritoSchema,
} from '../schemas/perrito.js';
import type { StorageDriver } from '../storage/index.js';
import { comprimirImagen } from '../storage/processImage.js';
import { validarImagenReal } from '../storage/validateImage.js';

export interface PerritosDeps {
  repository: PerritosRepository;
  storage: StorageDriver;
  config: AppConfig;
}

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function aNumeroOpcional(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === '') return undefined;
  return Number(valor);
}

function aTextoOpcional(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

function aArrayDeIds(valor: unknown): number[] {
  if (valor === undefined || valor === null || valor === '') return [];
  const bruto = Array.isArray(valor) ? valor : String(valor).split(',');
  return bruto
    .map((item) => Number(String(item).trim()))
    .filter((numero) => Number.isFinite(numero));
}

/**
 * Acepta dos formatos de multipart:
 *   1. Campos individuales (el que documenta Swagger UI):
 *      nombre, razaId, colorPrincipalId, coloresAdicionalesIds[], latitud, longitud.
 *   2. Un campo `datos` con el JSON completo (compatibilidad).
 */
function leerDatosDelCuerpo(body: Record<string, unknown>): unknown {
  if (typeof body.datos === 'string') {
    try {
      return JSON.parse(body.datos);
    } catch {
      throw new HttpError(400, 'Los datos del registro no son válidos.');
    }
  }

  return {
    nombre: body.nombre,
    razaId: aNumeroOpcional(body.razaId) ?? null,
    sexo: aTextoOpcional(body.sexo),
    etapaVida: aTextoOpcional(body.etapaVida),
    tamano: aTextoOpcional(body.tamano),
    longitudPelaje: aTextoOpcional(body.longitudPelaje),
    patronPelajeId: aNumeroOpcional(body.patronPelajeId) ?? null,
    colorOjosId: aNumeroOpcional(body.colorOjosId) ?? null,
    marcasDistintivas: aTextoOpcional(body.marcasDistintivas),
    colorPrincipalId: aNumeroOpcional(body.colorPrincipalId),
    coloresAdicionalesIds: aArrayDeIds(body.coloresAdicionalesIds),
    latitud: aNumeroOpcional(body.latitud),
    longitud: aNumeroOpcional(body.longitud),
  };
}

export function createPerritosRouter(deps: PerritosDeps): Router {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: deps.config.IMAGE_MAX_BYTES },
  });

  const subirFoto: RequestHandler = (req, res, next) => {
    upload.single('foto')(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }
      const codigo = (error as { code?: string }).code;
      if (codigo === 'LIMIT_FILE_SIZE') {
        next(new HttpError(400, 'La foto supera el tamaño máximo permitido.'));
        return;
      }
      next(new HttpError(400, 'No se pudo leer la foto enviada.'));
    });
  };

  router.get('/perritos', async (req, res, next) => {
    const filtros = filtrosPerritosSchema.safeParse(req.query);
    if (!filtros.success) {
      next(new HttpError(400, 'Revisa los filtros de búsqueda.', detallesDeZod(filtros.error)));
      return;
    }
    try {
      const perritos = await deps.repository.listar(filtros.data);
      res.status(200).json({ data: aPerritosApi(perritos, deps.config) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/perritos', subirFoto, async (req, res, next) => {
    try {
      const clave = idempotencyKeySchema.safeParse(req.header('Idempotency-Key'));
      if (!clave.success) {
        throw new HttpError(400, 'Falta la clave de idempotencia (Idempotency-Key).');
      }

      // Idempotencia primero: si la clave ya existe, devolvemos el mismo perrito
      // sin volver a validar ni guardar la foto.
      const existente = await deps.repository.buscarPorIdempotencia(clave.data);
      if (existente) {
        res.status(201).json({ data: aPerritoApi(existente, deps.config) });
        return;
      }

      const crudo = leerDatosDelCuerpo((req.body ?? {}) as Record<string, unknown>);

      const datos = datosPerritoNuevoSchema.safeParse(crudo);
      if (!datos.success) {
        throw new HttpError(400, 'Revisa los datos enviados.', detallesDeZod(datos.error));
      }

      if (!req.file) {
        throw new HttpError(400, 'Falta la foto.');
      }

      const validacion = await validarImagenReal(req.file.buffer, deps.config.IMAGE_MAX_BYTES);
      if (!validacion.valido || !validacion.extension) {
        throw new HttpError(400, validacion.motivo ?? 'La foto no es válida.');
      }

      const comprimida = await comprimirImagen(req.file.buffer, validacion.extension, deps.config);
      const guardado = await deps.storage.guardar(comprimida.buffer, comprimida.extension);
      const { perrito } = await deps.repository.crear(
        { ...datos.data, rutaImagen: guardado.ruta },
        clave.data,
      );
      res.status(201).json({ data: aPerritoApi(perrito, deps.config) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/perritos/:id/foto', async (req, res, next) => {
    try {
      const params = idPerritoSchema.safeParse(req.params);
      if (!params.success) {
        throw new HttpError(400, 'El identificador del perrito debe ser un número válido.');
      }

      const perrito = await deps.repository.obtener(params.data.id);
      if (!perrito) {
        throw new HttpError(404, 'No encontramos ese perrito.');
      }

      let buffer: Buffer;
      try {
        buffer = await deps.storage.leer(perrito.rutaImagen);
      } catch {
        throw new HttpError(404, 'No pudimos leer la foto de ese perrito.');
      }

      const extension = perrito.rutaImagen.split('.').pop()?.toLowerCase() ?? '';
      res.setHeader('Content-Type', MIME_POR_EXTENSION[extension] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  router.get('/perritos/:id', async (req, res, next) => {
    try {
      const params = idPerritoSchema.safeParse(req.params);
      if (!params.success) {
        throw new HttpError(400, 'El identificador del perrito debe ser un número válido.');
      }

      const perrito = await deps.repository.obtener(params.data.id);
      if (!perrito) {
        throw new HttpError(404, 'No encontramos ese perrito.');
      }

      res.status(200).json({ data: aPerritoApi(perrito, deps.config) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/razas', async (_req, res, next) => {
    try {
      res.status(200).json({ data: await deps.repository.listarRazas() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/colores', async (_req, res, next) => {
    try {
      const colores = await deps.repository.listarColores();
      res.status(200).json({ data: colores.map((color) => ({ ...color, hex: null })) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/colores-ojos', async (_req, res, next) => {
    try {
      const colores = await deps.repository.listarColoresOjos();
      res.status(200).json({ data: colores.map((color) => ({ ...color, hex: null })) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/patrones-pelaje', async (_req, res, next) => {
    try {
      res.status(200).json({ data: await deps.repository.listarPatronesPelaje() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/estadisticas', async (_req, res, next) => {
    try {
      const [total, porColor] = await Promise.all([
        deps.repository.contarPerritos(),
        deps.repository.estadisticasPorColor(),
      ]);
      res.status(200).json({ data: { total, porColor } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
