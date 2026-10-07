/** Navegación con recarga completa (descarta todo el estado en memoria); separada para poder simularla en los tests */
export const hardRedirect = (path) => window.location.assign(path)
