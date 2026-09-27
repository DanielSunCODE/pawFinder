// Pruebas de las reglas de validación del formulario (npm test).
import { describe, expect, it } from 'vitest'
import { erroresDelServidor, validarRegistro, type DatosFormulario } from './validacion'

const fotoJpg = new File(['x'], 'perro.jpg', { type: 'image/jpeg' })
const ID_SOLIDO = 1

const datosValidos: DatosFormulario = {
  foto: fotoJpg,
  nombre: 'Firulais',
  razaId: 1,
  sexo: 'macho',
  etapaVida: 'adulto',
  tamano: 'mediano',
  longitudPelaje: 'corto',
  patronPelajeId: 2,
  colorPrincipalId: 1,
  coloresAdicionalesIds: [2, 3],
  colorOjosId: 1,
  marcasDistintivas: 'Mancha blanca en el pecho',
  ubicacion: { latitud: 25.42, longitud: -101.0 },
}

describe('validarRegistro', () => {
  it('acepta un registro completo', () => {
    expect(validarRegistro(datosValidos, { idPatronSolido: ID_SOLIDO })).toEqual({})
  })

  it('exige sexo, edad, tamaño, largo del pelo y patrón', () => {
    const sinApariencia: DatosFormulario = {
      ...datosValidos,
      sexo: null,
      etapaVida: null,
      tamano: null,
      longitudPelaje: null,
      patronPelajeId: null,
    }
    expect(Object.keys(validarRegistro(sinApariencia)).sort()).toEqual([
      'etapaVida',
      'longitudPelaje',
      'patronPelajeId',
      'sexo',
      'tamano',
    ])
  })

  it('exige el color de ojos', () => {
    expect(validarRegistro({ ...datosValidos, colorOjosId: null }).colorOjosId).toBeDefined()
  })

  it('pide la raza', () => {
    expect(validarRegistro({ ...datosValidos, razaId: null }).razaId).toMatch(/Sin raza definida/)
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

  it('con pelaje sólido no se permiten colores adicionales', () => {
    const solido = { ...datosValidos, patronPelajeId: ID_SOLIDO }
    expect(validarRegistro(solido, { idPatronSolido: ID_SOLIDO }).coloresAdicionalesIds).toMatch(/sólido/)
    expect(validarRegistro({ ...solido, coloresAdicionalesIds: [] }, { idPatronSolido: ID_SOLIDO })).toEqual({})
  })

  it('marcas distintivas: máximo 500 letras', () => {
    const errores = validarRegistro({ ...datosValidos, marcasDistintivas: 'a'.repeat(501) })
    expect(errores.marcasDistintivas).toMatch(/500/)
  })

  it('pide la ubicación', () => {
    expect(validarRegistro({ ...datosValidos, ubicacion: null }).ubicacion).toBeDefined()
  })

  it('junta varios errores a la vez, uno por campo', () => {
    const vacio: DatosFormulario = {
      ...datosValidos,
      foto: null,
      nombre: '',
      razaId: null,
      colorPrincipalId: null,
      coloresAdicionalesIds: [],
      ubicacion: null,
    }
    expect(Object.keys(validarRegistro(vacio)).sort()).toEqual([
      'colorPrincipalId',
      'foto',
      'nombre',
      'razaId',
      'ubicacion',
    ])
  })

  it('no modifica los datos que recibe', () => {
    const copia = structuredClone({ ...datosValidos, foto: null })
    validarRegistro(copia)
    expect(copia).toEqual({ ...datosValidos, foto: null })
  })
})

describe('erroresDelServidor', () => {
  it('traduce latitud/longitud al campo ubicacion y conserva los demás', () => {
    expect(
      erroresDelServidor({ latitud: 'Falta la ubicación.', nombre: 'Falta el nombre.', colorOjosId: 'No existe.' }),
    ).toEqual({
      ubicacion: 'Falta la ubicación.',
      nombre: 'Falta el nombre.',
      colorOjosId: 'No existe.',
    })
  })
})
