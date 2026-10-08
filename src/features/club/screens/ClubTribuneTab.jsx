import React, { useMemo } from 'react'
import { Bell, Flame, HeartHandshake, Megaphone, Ticket, Users } from 'lucide-react'
import { Card, CardBody, Badge, Button, Stat } from '../../../components/ui'
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

  return (
    <div className="space-y-6">
      {/* 1. Clima de la Tribuna (Lectura Humana y Narrativa) */}
      <Card className="border border-line bg-surface/90 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-4 py-3 sm:px-6 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="eyebrow text-amber-400">Pulso de la hinchada</span>
              <h2 className="font-display text-lg font-bold text-fg sm:text-xl">
                {atmosphere.headline}
              </h2>
            </div>
          </div>
          <Badge tone="accent">
            {atmosphere.attendanceRate} de cancha llena
          </Badge>
        </div>

        <CardBody className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-fg-muted italic leading-relaxed">
            "{atmosphere.summary}"
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Popularidad</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{atmosphere.popularity}</span>
                <span className="text-[11px] text-fg-subtle">en la ciudad</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${atmosphere.popularity}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Confianza</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{atmosphere.satisfaction}</span>
                <span className="text-[11px] text-fg-subtle">en el DT</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${atmosphere.satisfaction}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Asistencia media</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{atmosphere.attendanceRate}</span>
                <span className="text-[11px] text-fg-subtle">capacidad</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: atmosphere.attendanceRate }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Socios al día</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">
                  {atmosphere.sociosCount.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-fg-subtle">padrón</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Eventos y Vida de la Hinchada */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Flame className="size-4 text-orange-400" />
              <h3 className="font-display text-base font-bold text-fg">Último movimiento en la tribuna</h3>
            </div>

            <div className="rounded-xl bg-surface-2 p-4 border border-line space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="accent">Evento reciente</Badge>
              </div>
              <p className="text-sm font-semibold text-fg">
                {atmosphere.latestEvent}
              </p>
              <p className="text-xs text-fg-muted">
                La gente se autoconvoca en la previa del fin de semana para alentar al equipo en la salida del micro.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <HeartHandshake className="size-4 text-accent" />
              <h3 className="font-display text-base font-bold text-fg">Identidad de la gente</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-2 border border-line space-y-1">
                <p className="font-semibold text-fg">El calor de local</p>
                <p className="text-fg-subtle">
                  Un estadio colmado intimida a los rivales de la categoría y presiona por el resultado.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-line space-y-1">
                <p className="font-semibold text-fg">Padrón de socios activo</p>
                <p className="text-fg-subtle">
                  Aporta un piso mensual de recaudación estable que protege las finanzas en los meses difíciles.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3. Gestión de afición y cánticos */}
      <FanbaseManagementTab club={club} />
    </div>
  )
}
