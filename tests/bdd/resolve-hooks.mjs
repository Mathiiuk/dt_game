// Node puro no resuelve imports sin extensión (`./consequences`), que Vite sí acepta: se prueba `.js` y `/index.js`.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND' || !(specifier.startsWith('.') || specifier.startsWith('/'))) throw err
    for (const suffix of ['.js', '/index.js']) {
      try { return await nextResolve(specifier + suffix, context) } catch { /* se prueba el siguiente */ }
    }
    throw err
  }
}
