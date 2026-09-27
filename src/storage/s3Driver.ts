import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import type { StorageDriver } from './index';

const { S3_BUCKET, S3_REGION } = process.env;

if (!S3_BUCKET || !S3_REGION) {
  throw new Error('S3_BUCKET y S3_REGION son obligatorios cuando STORAGE_DRIVER=s3');
}

// Las credenciales (access key / secret) se toman automáticamente de las
// variables de entorno estándar de AWS (AWS_ACCESS_KEY_ID,
// AWS_SECRET_ACCESS_KEY) o de un rol de IAM si corre en AWS. No se piden
// aquí para no duplicar la config ni el riesgo de hardcodearlas.
const client = new S3Client({ region: S3_REGION });

const MIME_POR_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const s3Driver: StorageDriver = {
  async guardar(buffer, extension) {
    const nombre = `${randomUUID()}.${extension}`;
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: nombre,
        Body: buffer,
        ContentType: MIME_POR_EXT[extension],
        // Sin ACL pública: el bucket es privado. El único camino de
        // lectura es este driver, llamado desde el endpoint del backend.
      })
    );
    return { ruta: nombre };
  },

  async leer(ruta) {
    const respuesta = await client.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: ruta }));
    const stream = respuesta.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  },
};
