import { randomUUID } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ArchivoGuardado, ImagenExtension, StorageDriver } from './index.js';

const MIME_POR_EXTENSION: Record<ImagenExtension, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Guarda las imágenes en un bucket S3 privado. Las credenciales
 * (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY o un rol de IAM) las toma el SDK
 * del entorno estándar de AWS; nunca se codifican.
 */
export function createS3Driver(options: { region: string; bucket: string }): StorageDriver {
  const client = new S3Client({ region: options.region });

  return {
    async guardar(buffer, extension): Promise<ArchivoGuardado> {
      const nombre = `${randomUUID()}.${extension}`;
      await client.send(
        new PutObjectCommand({
          Bucket: options.bucket,
          Key: nombre,
          Body: buffer,
          ContentType: MIME_POR_EXTENSION[extension],
          // Sin ACL pública: el bucket es privado y solo se lee desde el backend.
        }),
      );
      return { ruta: nombre };
    },

    async leer(ruta): Promise<Buffer> {
      const respuesta = await client.send(
        new GetObjectCommand({ Bucket: options.bucket, Key: ruta }),
      );
      const stream = respuesta.Body as unknown as AsyncIterable<Buffer | string>;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },
  };
}
