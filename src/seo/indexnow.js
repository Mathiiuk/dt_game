// IndexNow: avisa a los buscadores que lo usan (Bing y otros; Google no participa) qué URLs nuevas o cambiadas hay.
// No garantiza indexación. La clave es pública por diseño del protocolo: el buscador la lee de /<clave>.txt para comprobar que el sitio es nuestro.
import { SITE } from '../data/site'

export const INDEXNOW_KEY = 'bf7610832d117bb6d193c4a51c50964f'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const SITE_HOST = new URL(SITE.url).host
const MAX_ATTEMPTS = 3
const BATCH = 10000

const allowed = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && x.host === SITE_HOST } catch { return false } }

/** Direcciones de un sitemap, solo las de nuestro dominio */
export const urlsFromSitemap = (xml) => [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]).filter(allowed)

/** Cuerpo del pedido: solo URLs https de nuestro host, sin repetir */
export const buildPayload = (urls) => ({
  host: SITE_HOST,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`,
  urlList: [...new Set((urls || []).filter(allowed))]
})

const wait = (ms) => new Promise(r => setTimeout(r, ms))

/** Envía las URLs. Reintenta con espera progresiva solo ante 429 o errores del servidor; 200 y 202 son aceptado. */
export async function submitUrls(urls, { fetchImpl = (...a) => fetch(...a), sleep = wait } = {}) {
  const { urlList, ...rest } = buildPayload(urls)
  if (urlList.length === 0) return { ok: true, status: null, sent: 0 }
  let status = null
  let sent = 0
  for (let i = 0; i < urlList.length; i += BATCH) {
    const body = JSON.stringify({ ...rest, urlList: urlList.slice(i, i + BATCH) })
    status = null
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetchImpl(INDEXNOW_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body })
        status = res.status
      } catch { status = 0 }
      if (status === 200 || status === 202) break
      if (status !== 0 && status !== 429 && status < 500) break
      if (attempt < MAX_ATTEMPTS) await sleep(2000 * attempt)
    }
    if (status !== 200 && status !== 202) return { ok: false, status, sent }
    sent += Math.min(BATCH, urlList.length - i)
  }
  return { ok: true, status, sent }
}
