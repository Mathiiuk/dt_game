import { isBusy } from './busy'

/** Pantallas donde nunca se actualiza: un partido en juego y su resumen (recargar ahí corta la jugada o la rueda de prensa) */
export const UNSAFE_ROUTES = ['/match', '/post-match']

/** ¿Es un buen momento para instalar una versión nueva? Fuera de un partido y sin nada a medias */
export function isSafeToUpdate({ pathname = '/' } = {}) {
  return !UNSAFE_ROUTES.includes(pathname) && !isBusy()
}
