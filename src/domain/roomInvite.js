/** Invitar a una sala de la liga de amigos con un enlace: el código viaja en la URL y se normaliza igual que al escribirlo */
import { SITE } from '../data/site'

export const CODE_LENGTH = 8

export const normalizeCode = (raw) => String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)

export const inviteUrl = (code) => `${SITE.url}/friends?codigo=${normalizeCode(code)}&utm_source=invite&utm_medium=room`

export const inviteText = ({ code, name }) =>
  `Armé la sala "${name || 'mi sala'}" en Vestuario, la liga de amigos de DT. Entrá con el código ${normalizeCode(code)} o con este enlace: ${inviteUrl(code)}`

export const codeFromSearch = (search) => {
  try { return normalizeCode(new URLSearchParams(search || '').get('codigo')) } catch { return '' }
}
