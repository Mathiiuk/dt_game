import React, { useMemo } from 'react'
import { Card, CardBody, Badge, Kicker } from '../../../components/ui'
import { getClubAtmosphere } from '../../../domain/clubDna'
import FanbaseManagementTab from './FanbaseManagementTab'

export default function ClubTribuneTab({ fanbase = {}, club }) {
  const atmosphere = useMemo(() => {
    return getClubAtmosphere({
      popularity: club?.fan_base_size ? Math.min(99, Math.round(club.fan_base_size / 200)) : fanbase.popularity,
      satisfaction: fanbase.satisfaction || 78,
      members_count: fanbase.members_count || Math.round((club?.stadium_capacity || 8000) * 0.9),
      stadium_capacity: club?.stadium_capacity || 8000,
      last_attendance: fanbase.last_attendance
    })
  }, [fanbase, club])

  const gauges = [
    ['Popularidad', atmosphere.popularity, 'en la ciudad', 'bg-gold', `${atmosphere.popularity}%`],
    ['Confianza', atmosphere.satisfaction, 'en el DT', 'bg-accent', `${atmosphere.satisfaction}%`],
    ['Asistencia media', atmosphere.attendanceRate, 'capacidad', 'bg-primary', atmosphere.attendanceRate],
    ['Socios al día', atmosphere.sociosCount.toLocaleString('es-AR'), 'padrón', 'bg-primary', '80%']
  ]

  return (
    <div className="space-y-4">
      {/* 1. Pulso de la hinchada */}
      <Card masthead as="section" aria-label="Pulso de la hinchada">
        <CardBody className="space-y-3 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Kicker>Pulso de la hinchada</Kicker>
              <h2 className="font-slab text-lg font-bold leading-tight text-fg">{atmosphere.headline}</h2>
            </div>
            <Badge tone="accent">{atmosphere.attendanceRate} de cancha llena</Badge>
          </div>
          <p className="text-sm italic leading-relaxed text-fg-muted">"{atmosphere.summary}"</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {gauges.map(([label, value, hint, bar, width]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd className="flex items-baseline justify-between">
                  <span className="num font-display text-xl font-bold leading-tight text-fg">{value}</span>
                  <span className="text-[11px] text-fg-subtle">{hint}</span>
                </dd>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full ${bar}`} style={{ width }} /></div>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {/* 2. Eventos y vida de la hinchada: plegado, se abre al tocar */}
      <details className="group" open>
        <summary className="flex cursor-pointer items-baseline gap-3">
          <h3 className="font-slab text-base font-bold text-fg">Último movimiento en la tribuna</h3>
          <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
        </summary>
        <p className="mt-1 text-sm font-semibold text-fg">{atmosphere.latestEvent}</p>
        <p className="text-xs text-fg-muted">La gente se autoconvoca en la previa del fin de semana para alentar al equipo en la salida del micro.</p>
      </details>

      <section aria-label="Identidad de la gente" className="space-y-1">
        <div className="flex items-baseline gap-3">
          <h3 className="font-slab text-base font-bold text-fg">Identidad de la gente</h3>
          <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
        </div>
        <ul className="divide-y divide-line text-xs">
          <li className="py-2"><p className="font-semibold text-fg">El calor de local</p><p className="text-fg-subtle">Un estadio colmado intimida a los rivales de la categoría y presiona por el resultado.</p></li>
          <li className="py-2"><p className="font-semibold text-fg">Padrón de socios activo</p><p className="text-fg-subtle">Aporta un piso mensual de recaudación estable que protege las finanzas en los meses difíciles.</p></li>
        </ul>
      </section>

      {/* 3. Gestión de afición y cánticos */}
      <FanbaseManagementTab club={club} />
    </div>
  )
}
