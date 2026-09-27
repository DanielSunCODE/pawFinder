/** Une nombres de clases CSS ignorando los vacíos: clases('a', false, 'b') → 'a b' */
export const clases = (...nombres: (string | false | null | undefined)[]): string =>
  nombres.filter(Boolean).join(' ')
