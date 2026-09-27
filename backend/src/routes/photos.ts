import { Router } from 'express';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { StorageDriver } from '../storage/index.js';

interface PerritoFotoRow extends RowDataPacket {
  ruta_imagen: string;
}

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Sirve la foto de un perrito a través del backend. El cliente nunca conoce
 * la carpeta local ni el bucket: solo pide este endpoint.
 */
export function createPhotoRouter(pool: Pool, storage: StorageDriver): Router {
  const router = Router();

  router.get('/perritos/:id/foto', async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        error: { message: 'El identificador del perrito debe ser un número válido.' },
      });
      return;
    }

    try {
      const [filas] = await pool.query<PerritoFotoRow[]>(
        'SELECT ruta_imagen FROM perros WHERE id_perro = ?',
        [id],
      );

      const perrito = filas[0];
      if (!perrito) {
        res.status(404).json({ error: { message: 'No encontramos ese perrito.' } });
        return;
      }

      let buffer: Buffer;
      try {
        buffer = await storage.leer(perrito.ruta_imagen);
      } catch {
        res.status(404).json({ error: { message: 'No pudimos leer la foto de ese perrito.' } });
        return;
      }

      const extension = perrito.ruta_imagen.split('.').pop()?.toLowerCase() ?? '';
      res.setHeader('Content-Type', MIME_POR_EXTENSION[extension] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
