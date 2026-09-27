// Valida que un archivo sea REALMENTE una imagen JPG/PNG/WEBP mirando los
// primeros bytes (firma binaria), no la extensión ni el Content-Type que
// mande el cliente (ambos se pueden falsificar fácilmente).
//
// Usa la librería `file-type`, que solo lee la cabecera del buffer.
// OJO: file-type v17+ es ESM-only; si el proyecto es CommonJS hay que
// importarlo con `await import('file-type')` en vez de `require`.

const EXTENSIONES_PERMITIDAS = new Set(['jpg', 'png', 'webp']);
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB, ajustable

export interface ResultadoValidacion {
  valido: boolean;
  extension?: 'jpg' | 'png' | 'webp';
  motivo?: string;
}

export async function validarImagenReal(buffer: Buffer): Promise<ResultadoValidacion> {
  if (buffer.length === 0) {
    return { valido: false, motivo: 'Archivo vacío' };
  }
  if (buffer.length > TAMANO_MAXIMO_BYTES) {
    return { valido: false, motivo: `Excede el tamaño máximo (${TAMANO_MAXIMO_BYTES} bytes)` };
  }

  const { fileTypeFromBuffer } = await import('file-type');
  const tipo = await fileTypeFromBuffer(buffer);

  if (!tipo) {
    return { valido: false, motivo: 'No se reconoce el contenido como una imagen válida' };
  }

  const extension = tipo.ext === 'jpeg' ? 'jpg' : tipo.ext;

  if (!EXTENSIONES_PERMITIDAS.has(extension)) {
    return { valido: false, motivo: `Formato no permitido: ${tipo.mime}` };
  }

  return { valido: true, extension: extension as 'jpg' | 'png' | 'webp' };
}
