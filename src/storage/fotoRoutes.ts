// Ejemplo de referencia para Daniel (Express). Ajusta el import de `pool`
// y el router raíz a como esté organizado el backend real.
import { Router } from 'express';
import { pool } from '../db/pool';
import { storage } from './index';

export const fotoRouter = Router();

const MIME_POR_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// GET /perros/:id/foto
// El cliente nunca ve la ruta local ni el bucket de S3: siempre pide la
// foto a través de este endpoint del backend.
fotoRouter.get('/perros/:id/foto', async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT ruta_imagen FROM perros WHERE id_perro = ?', [id]);
  const perro = (rows as any[])[0];

  if (!perro) {
    return res.status(404).json({ error: 'Perrito no encontrado' });
  }

  try {
    const buffer = await storage.leer(perro.ruta_imagen);
    const extension = perro.ruta_imagen.split('.').pop() as string;
    res.setHeader('Content-Type', MIME_POR_EXT[extension] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch {
    res.status(404).json({ error: 'No se pudo leer la imagen' });
  }
});
