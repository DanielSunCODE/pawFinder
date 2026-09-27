// Clases de Tailwind que se repiten en el formulario de registro.
// Se juntan aquí para no copiar la misma lista larga de clases en cada campo.

export const estilos = {
  // Página
  formulario: 'mx-auto flex max-w-160 flex-col gap-4',
  encabezado: 'flex items-center gap-2 [&>h1]:text-2xl [&>h1]:font-extrabold',
  cerrar: '-ml-2 grid size-11 place-items-center rounded-full text-texto hover:bg-superficie-2',
  intro: '-mt-2 text-sm text-texto-suave',

  // Secciones numeradas
  seccion: 'flex flex-col gap-4 rounded-tarjeta bg-superficie p-4.5 shadow-suave',
  seccionTitulo: 'flex items-center gap-2.5 text-lg font-extrabold',
  numero: 'grid size-7 place-items-center rounded-full bg-primario-suave text-sm font-black text-primario',

  // Campos
  campo: 'flex flex-col gap-1.5',
  etiqueta: 'p-0 font-extrabold',
  obligatorio: 'text-error',
  opcional: 'text-sm font-semibold text-texto-suave',
  // 16px de letra: evita que el iPhone haga zoom al enfocar el campo
  entrada:
    'h-12.5 w-full rounded-campo border-[1.5px] bg-superficie px-4 text-base focus:border-primario-vivo focus:ring-3 focus:ring-primario-suave focus:outline-none',
  error: 'text-sm font-bold text-error',
  ayuda: 'flex flex-wrap items-center gap-1 text-sm font-semibold text-texto',
  ayudaSuave: 'text-texto-suave',
  aviso: 'rounded-chico bg-aviso-suave px-3.5 py-2.5 text-sm font-semibold',

  // Foto
  foto: 'flex flex-col gap-3',
  fotoMarco: 'relative grid aspect-4/3 place-items-center overflow-hidden rounded-campo border-2 bg-superficie-2 md:max-h-85',
  fotoVista: 'size-full object-cover',
  fotoVacia: 'flex flex-col items-center gap-1.5 p-4 text-center text-texto-suave [&>p]:font-bold [&>p]:text-texto [&>span]:text-xs',
  fotoProcesando: 'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-fondo/85 font-bold',
  fotoBotones: 'grid grid-cols-2 gap-2.5 [&_.boton]:px-3',

  // Colores
  grupo: 'flex min-w-0 flex-col gap-2.5',
  chips: 'flex flex-wrap gap-2',
  chip: 'inline-flex h-10.5 cursor-pointer items-center gap-1.75 rounded-full border-[1.5px] pr-3.5 pl-2.5 text-sm font-bold transition-colors select-none focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primario-vivo',
  chipNormal: 'border-borde bg-superficie hover:border-borde-fuerte',
  chipElegido: 'border-primario bg-primario-suave text-primario',
  chipDeshabilitado: 'cursor-not-allowed opacity-40',

  // Ubicación
  ubicacion: 'flex flex-col gap-3',
  mapaMarco: 'relative overflow-hidden rounded-campo',
  mapa: 'h-70',
  mapaPista:
    'pointer-events-none absolute bottom-3.5 left-1/2 z-1000 -translate-x-1/2 rounded-full bg-texto/82 px-3.5 py-2 text-sm font-bold whitespace-nowrap text-white',

  // Envío
  resumenErrores:
    'rounded-campo bg-error-suave px-4.5 py-4 [&>p]:font-extrabold [&>ul]:mt-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&_button]:inline [&_button]:py-0.5 [&_button]:text-left [&_button]:font-bold [&_button]:text-error [&_button]:underline',
  errorGeneral: 'flex items-start gap-2.5 rounded-campo bg-error-suave px-4 py-3.5 font-bold text-error [&>p]:text-texto',
  barraEnviar:
    'pb-seguro sticky bottom-0 z-1001 -mx-4 bg-linear-to-t from-fondo from-75% to-fondo/0 px-4 pt-3 md:mx-0 md:px-0 md:pt-4 md:pb-6',
  estadoEnvio: 'mt-2 text-center text-sm font-bold text-texto-suave',
  botonEnviar: 'min-h-13.5 text-[1.05rem] shadow-[0_6px_18px_rgb(185_78_28/0.3)] disabled:opacity-85',
} as const
