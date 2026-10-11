// Versión del juego instalada: la pone el build (ver `define` en vite.config.ts). En desarrollo y en pruebas es "dev".
/* global __APP_VERSION__, __APP_BUILD_TIME__ */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
export const APP_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : null
