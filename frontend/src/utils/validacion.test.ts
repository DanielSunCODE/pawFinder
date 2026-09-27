// Pruebas de las reglas de validación del formulario (npm test).
import { describe, expect, it } from 'vitest'
import { erroresDelServidor, validarRegistro, type DatosFormulario } from './validacion'

const fotoJpg = new File(['x'], 'perro.jpg', { type: 'image/jpeg' })

const datosValidos: DatosFormulario = {
  foto: fotoJpg,
  nombre: 'Firulais',
  razaId: null,
  colorPrincipalId: 1,
  coloresAdicionalesIds: [2, 3],
  ubicacion: { latitud: 19.43, longitud: -99.13 },
}

describe('validarRegistro', () => {
  it('acepta un registro completo', () => {
    expect(validarRegistro(datosValidos)).toEqual({})
  })

  it('la raza es opcional', () => {
    expect(validarRegistro({ ...datosValidos, razaId: null })).toEqual({})
  })

  it('pide la foto', () => {
    expect(validarRegistro({ ...datosValidos, foto: null }).foto).toBe('Falta la foto del perrito.')
  })

  it('rechaza formatos que no son JPG, PNG o WEBP', () => {
    const gif = new File(['x'], 'perro.gif', { type: 'image/gif' })
    expect(validarRegistro({ ...datosValidos, foto: gif }).foto).toMatch(/JPG, PNG o WEBP/)
  })

  it('un nombre de puros espacios no cuenta', () => {
    expect(validarRegistro({ ...datosValidos, nombre: '    ' }).nombre).toBeDefined()
  })

  it('pide exactamente un color principal', () => {
    expect(validarRegistro({ ...datosValidos, colorPrincipalId: null }).colorPrincipalId).toBeDefined()
  })

  it('máximo 2 colores adicionales (3 en total)', () => {
    const errores = validarRegistro({ ...datosValidos, coloresAdicionalesIds: [2, 3, 4] })
    expect(errores.coloresAdicionalesIds).toMatch(/máximo 2/)
  })

  it('un adicional no puede repetir el principal', () => {
    const errores = validarRegistro({ ...datosValidos, coloresAdicionalesIds: [1] })
    expect(errores.coloresAdicionalesIds).toMatch(/principal/)
  })

  it('los adicionales no se repiten entre sí', () => {
    const errores = validarRegistro({ ...datosValidos, coloresAdicionalesIds: [2, 2] })
    expect(errores.coloresAdicionalesIds).toBe('No repitas colores.')
  })

  it('pide la ubicación', () => {
    expect(validarRegistro({ ...datosValidos, ubicacion: null }).ubicacion).toBeDefined()
  })

  it('junta varios errores a la vez, uno por campo', () => {
    const vacio: DatosFormulario = {
      foto: null,
      nombre: '',
      razaId: null,
      colorPrincipalId: null,
      coloresAdicionalesIds: [],
      ubicacion: null,
    }
    expect(Object.keys(validarRegistro(vacio)).sort()).toEqual(['colorPrincipalId', 'foto', 'nombre', 'ubicacion'])
  })

  it('no modifica los datos que recibe', () => {
    const copia = structuredClone({ ...datosValidos, foto: null })
    validarRegistro(copia)
    expect(copia).toEqual({ ...datosValidos, foto: null })
  })
})

describe('erroresDelServidor', () => {
  it('traduce latitud/longitud al campo ubicacion', () => {
    expect(erroresDelServidor({ latitud: 'Falta la ubicación.', nombre: 'Falta el nombre.' })).toEqual({
      ubicacion: 'Falta la ubicación.',
      nombre: 'Falta el nombre.',
    })
  })
})
