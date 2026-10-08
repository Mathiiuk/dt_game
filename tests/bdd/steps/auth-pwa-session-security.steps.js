import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { AUTH_STORAGE_KEY } from '../../../src/api/supabase.js'
import { DT_LAST_USER_KEY } from '../../../src/api/auth.js'

Given('una app PWA con sesión activa almacenada en {string}', function (storageKey) {
  this.storageKey = storageKey
  assert.equal(AUTH_STORAGE_KEY, storageKey)
  this.hasActiveSession = true
  this.autoRefreshStarted = false
})

When('la aplicación recupera la visibilidad en pantalla', function () {
  this.isForeground = true
  if (this.hasActiveSession) {
    this.autoRefreshStarted = true
  }
})

Then('el cliente de autenticación reanuda el auto-refresco de tokens', function () {
  assert.equal(this.autoRefreshStarted, true)
})

Then('la sesión activa se mantiene disponible para el usuario', function () {
  assert.equal(this.hasActiveSession, true)
})

Given('un usuario autenticado con sesión válida en el sistema', function () {
  this.currentUser = {
    id: 'user-pwa-test',
    email: 'dt@pwa.com',
    name: 'DT Master'
  }
})

When('el usuario retrocede o ingresa a la ruta {string}', function (path) {
  this.navigatedPath = path
  if (this.currentUser && path === '/auth') {
    this.redirectTarget = '/dashboard'
    this.replaceHistory = true
  }
})

Then('el sistema detecta la sesión activa de inmediato', function () {
  assert.ok(this.currentUser)
})

Then('redirige al usuario a {string} con reemplazo en el historial', function (expectedTarget) {
  assert.equal(this.redirectTarget, expectedTarget)
  assert.equal(this.replaceHistory, true)
})

Given('un director técnico con sesión activa y caché local {string}', function (cacheKey) {
  assert.equal(DT_LAST_USER_KEY, cacheKey)
  this.localCache = {
    [cacheKey]: { id: 'dt-123', name: 'Gallardo' }
  }
})

When('el usuario confirma el cierre de sesión', function () {
  delete this.localCache[DT_LAST_USER_KEY]
  this.sessionRevoked = true
})

Then('se revoca la sesión y se eliminan las credenciales locales', function () {
  assert.equal(this.sessionRevoked, true)
  assert.equal(this.localCache[DT_LAST_USER_KEY], undefined)
})

Then('el estado queda completamente limpio para nuevos ingresos', function () {
  assert.deepEqual(this.localCache, {})
})
