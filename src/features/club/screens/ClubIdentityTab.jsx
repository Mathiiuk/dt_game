import React, { useMemo } from 'react'
import { Award, Dna, Flag, GraduationCap, History, Home, Sparkles, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, Button, Stat } from '../../../components/ui'
import { calculateClubDNA } from '../../../domain/clubDna'

export default function ClubIdentityTab({
  club,
  history = [],
  idols = [],
  _records = [],
  staff = [],
  youth = [],
  onFireStaff,
  onOpenStaffModal,
  onOpenYouthModal,
  onPromoteYouth,
  onGenerateProspect
}) {
  const dna = useMemo(() => {
    return calculateClubDNA(club, history)
  }, [club, history])

  const topIdols = idols.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* 1. ADN Institucional del Club */}
      <Card className="border border-line bg-surface/90 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-accent/15 via-accent/5 to-transparent px-4 py-3 sm:px-6 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/20 text-accent border border-accent/30">
              <Dna className="size-5" />
            </div>
            <div>
              <span className="eyebrow text-accent">ADN institucional</span>
              <h2 className="font-display text-lg font-bold text-fg sm:text-xl">
                {dna.primaryTrait}
              </h2>
            </div>
          </div>
          <Badge tone="accent">
            Fundado en {club?.founded_year || 1928}
          </Badge>
        </div>

        <CardBody className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-fg-muted italic leading-relaxed">
            "{dna.subtitle}"
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Cantera</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{dna.attributes.cantera}</span>
                <span className="text-[11px] text-fg-subtle">Semillero</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${dna.attributes.cantera}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Identidad local</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{dna.attributes.identidadLocal}</span>
                <span className="text-[11px] text-fg-subtle">{club?.city || 'Barrio'}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${dna.attributes.identidadLocal}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Tradición</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{dna.attributes.tradicion}</span>
                <span className="text-[11px] text-fg-subtle">Historia</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${dna.attributes.tradicion}%` }} />
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-3 border border-line">
              <span className="eyebrow text-[10px]">Potrero y garra</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-display text-lg font-bold text-fg">{dna.attributes.potrero}</span>
                <span className="text-[11px] text-fg-subtle">Ascenso</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${dna.attributes.potrero}%` }} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Nuestra Casa (Estadio) y Vitrina de Copas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Estadio como Identidad */}
        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Home className="size-4 text-accent" />
                <h3 className="font-display text-base font-bold text-fg">Nuestra casa</h3>
              </div>
              <Link to="/finances" className="text-xs font-semibold text-accent hover:underline">
                Obras e infraestructura →
              </Link>
            </div>

            <div className="rounded-xl bg-surface-2 p-4 border border-line space-y-2">
              <h4 className="font-display text-lg font-bold text-fg">
                {club?.stadium_name || `Estadio de ${club?.name || 'la Ciudad'}`}
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-fg-subtle block">Capacidad:</span>
                  <span className="font-semibold text-fg text-sm">
                    {(club?.stadium_capacity || 8000).toLocaleString('es-AR')} espectadores
                  </span>
                </div>
                <div>
                  <span className="text-fg-subtle block">Ubicación:</span>
                  <span className="font-semibold text-fg text-sm">
                    {club?.city || 'Rosario'}, {club?.country || 'Argentina'}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Vitrina de Copas */}
        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-400" />
                <h3 className="font-display text-base font-bold text-fg">Vitrina de títulos</h3>
              </div>
              <span className="text-xs text-fg-muted font-medium">
                {history.filter(h => h.champions).length} trofeos oficiales
              </span>
            </div>

            {history.filter(h => h.champions).length === 0 ? (
              <div className="rounded-xl bg-surface-2/60 border border-line/60 p-4 text-center space-y-1">
                <Trophy className="size-8 text-fg-subtle mx-auto opacity-50" />
                <p className="text-sm font-semibold text-fg">Vitrina esperando su primera vuelta olímpica</p>
                <p className="text-xs text-fg-muted">Las copas llegarán cuando tu proyecto culmine en lo más alto.</p>
              </div>
            ) : (
              <ul className="space-y-2 text-xs">
                {history.filter(h => h.champions).map(trophy => (
                  <li key={trophy.id || trophy.season_year} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <span className="font-bold text-fg">{trophy.competition_name || 'Torneo de Liga'}</span>
                    </div>
                    <Badge tone="accent">Temporada {trophy.season_year}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 3. Ídolos de la Casa */}
      <Card className="border border-line bg-surface/90">
        <CardBody className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-accent" />
              <h3 className="font-display text-base font-bold text-fg">Ídolos de la casa</h3>
            </div>
            <span className="text-xs text-fg-subtle">Las figuras grabadas en la memoria del hincha</span>
          </div>

          {topIdols.length === 0 ? (
            <div className="rounded-xl bg-surface-2/60 border border-line/60 p-4 text-center space-y-1">
              <Users className="size-7 text-fg-subtle mx-auto opacity-50" />
              <p className="text-sm font-semibold text-fg">Escribiendo las primeras leyendas</p>
              <p className="text-xs text-fg-muted">Los jugadores con más partidos, goles y títulos ascenderán a este mural.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {topIdols.map((idol, i) => (
                <div key={idol.id || i} className="rounded-xl bg-surface-2 p-3 border border-line space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-fg">{idol.player_name || idol.name}</span>
                    <Badge tone="accent">{idol.role_label || 'Ídolo'}</Badge>
                  </div>
                  <p className="text-xs text-fg-subtle">
                    {idol.matches_count || 120} partidos · {idol.goals_count || 0} goles
                  </p>
                  <p className="text-xs text-fg-muted italic">
                    "{idol.legacy_quote || 'Referente en el crecimiento del club.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 4. Cuerpo Técnico y Semillero de Cantera */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cuerpo Técnico de la Casa */}
        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-fg">Cuerpo técnico</h3>
              <Button size="sm" variant="outline" onClick={onOpenStaffModal}>
                Especialistas
              </Button>
            </div>

            {staff.length === 0 ? (
              <p className="text-xs text-fg-muted py-4 text-center">
                Sos el único al mando táctico y físico del club.
              </p>
            ) : (
              <ul className="space-y-2">
                {staff.map(s => (
                  <li key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-line text-xs">
                    <div>
                      <p className="font-semibold text-fg">{s.name}</p>
                      <p className="text-fg-subtle">{s.role} · Nivel {s.level}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFireStaff(s)}
                      aria-label={`Despedir a ${s.name}`}
                    >
                      Despedir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Cantera y Juveniles */}
        <Card className="border border-line bg-surface/90">
          <CardBody className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-fg">
                Academia · Nv. {club?.academy_level || 1}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onOpenYouthModal}>
                  Cantera
                </Button>
                <Button size="sm" onClick={onGenerateProspect}>
                  Otear · $5.000
                </Button>
              </div>
            </div>

            {youth.length === 0 ? (
              <p className="text-xs text-fg-muted py-4 text-center">
                Cantera vacía. Oteá talento juvenil para nutrir el semillero.
              </p>
            ) : (
              <ul className="space-y-2">
                {youth.map(y => (
                  <li key={y.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-line text-xs">
                    <div>
                      <p className="font-semibold text-fg">
                        {y.first_name} {y.last_name}
                      </p>
                      <p className="text-fg-subtle">{y.position} · {y.age} años · POT {y.attr_potential}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onPromoteYouth(y.id)}>
                      Promover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
