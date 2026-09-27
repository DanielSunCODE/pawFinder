import type { AppConfig } from '../config/env.js';
import type { PerritoRegistro } from '../repositories/perritosRepository.js';

export interface ColorApi {
  id: number;
  nombre: string;
  hex: string | null;
}

export interface PerritoApi {
  id: number;
  nombre: string;
  fotoUrl: string;
  miniaturaUrl: string;
  raza: { id: number; nombre: string } | null;
  colorPrincipal: ColorApi;
  coloresAdicionales: ColorApi[];
  latitud: number;
  longitud: number;
  fechaRegistro: string;
}

const SIN_COLOR: ColorApi = { id: 0, nombre: 'Sin color', hex: null };

function colorApi(color: { id: number; nombre: string }): ColorApi {
  // El catálogo no guarda hex por ahora; se manda null (el frontend lo permite).
  return { id: color.id, nombre: color.nombre, hex: null };
}

function urlFoto(id: number, config: AppConfig): string {
  const base = config.PUBLIC_BASE_URL?.replace(/\/+$/, '') ?? '';
  return `${base}/api/perritos/${id}/foto`;
}

/**
 * Transformación funcional: separa el color principal de los adicionales con
 * `find`/`filter` + `map`, sin mutar el registro ni usar ciclos explícitos.
 */
export function aPerritoApi(registro: PerritoRegistro, config: AppConfig): PerritoApi {
  const principal = registro.colores.find((color) => color.esDominante) ?? registro.colores[0];
  const adicionales = registro.colores.filter((color) => color !== principal);
  const fotoUrl = urlFoto(registro.id, config);

  return {
    id: registro.id,
    nombre: registro.nombre,
    fotoUrl,
    miniaturaUrl: fotoUrl,
    raza:
      registro.razaId !== null && registro.razaNombre !== null
        ? { id: registro.razaId, nombre: registro.razaNombre }
        : null,
    colorPrincipal: principal ? colorApi(principal) : SIN_COLOR,
    coloresAdicionales: adicionales.map(colorApi),
    latitud: registro.latitud,
    longitud: registro.longitud,
    fechaRegistro: registro.fechaRegistro,
  };
}

export function aPerritosApi(registros: PerritoRegistro[], config: AppConfig): PerritoApi[] {
  return registros.map((registro) => aPerritoApi(registro, config));
}
