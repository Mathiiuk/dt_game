// Entrada para el prerender de build (se carga con Vite en modo SSR): el mismo componente de la página, a texto HTML
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import InfoPage from '../features/home/InfoPage'
import { PUBLIC_PAGES, PUBLIC_PATHS } from '../data/publicPages'
import { faqStructuredData } from './structuredData'

export { PUBLIC_PAGES, PUBLIC_PATHS }

export const renderPage = (page) => renderToStaticMarkup(<MemoryRouter initialEntries={[page.path]}><InfoPage path={page.path} /></MemoryRouter>)
export const pageJsonLd = (page) => (page.faq ? faqStructuredData(page.sections) : null)
