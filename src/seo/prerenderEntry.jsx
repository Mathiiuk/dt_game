// Entrada para el prerender de build (se carga con Vite en modo SSR): el mismo componente de la página, a texto HTML
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import InfoPage from '../features/home/InfoPage'
import NotFoundScreen from '../features/errors/NotFoundScreen'
import { PUBLIC_PAGES, PUBLIC_PATHS, pageLastmod } from '../data/publicPages'
import { pageStructuredData } from './structuredData'

export { PUBLIC_PAGES, PUBLIC_PATHS, pageLastmod }

export const renderPage = (page) => renderToStaticMarkup(<MemoryRouter initialEntries={[page.path]}><InfoPage path={page.path} /></MemoryRouter>)
export const pageJsonLd = (page) => pageStructuredData(page)

export const renderNotFound = () => renderToStaticMarkup(<MemoryRouter initialEntries={['/404']}><NotFoundScreen /></MemoryRouter>)
