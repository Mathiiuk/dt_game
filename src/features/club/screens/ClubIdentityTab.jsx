import React, { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, Button, Jersey, Kicker, OptionCards } from '../../../components/ui'
import { JERSEY_PATTERNS, normalizeJerseyPattern } from '../../../domain/jerseyKits'
import { calculateClubDNA } from '../../../domain/clubDna'

/** Encabezado de sección de diario: título slab, filete y acción opcional a la derecha */
function Heading({ children, aside }) {
  return (
    <div className="flex items-baseline gap-3">
      <h3 className="font-slab text-base font-bold text-fg">{children}</h3>
      <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
      {aside}
    </div>
  )
}

const Row = 'flex items-center justify-between gap-3 border-b border-line py-2 text-xs'

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
  onGenerateProspect,
  onChangeJersey
}) {
  const dna = useMemo(() => {
    return calculateClubDNA(club, history)
  }, [club, history])

  const topIdols = idols.slice(0, 3)

  const trophies = history.filter(h => h.champions)
  const attrs = [
    ['Cantera', dna.attributes.cantera, 'Semillero', 'bg-accent'],
    ['Identidad local', dna.attributes.identidadLocal, club?.city || 'Barrio', 'bg-primary'],
    ['Tradición', dna.attributes.tradicion, 'Historia', 'bg-gold'],
    ['Potrero y garra', dna.attributes.potrero, 'Ascenso', 'bg-danger']
  ]

  return (
    <div className="space-y-4">
      {/* 1. ADN institucional */}
      <Card masthead as="section" aria-label="ADN institucional">
        <CardBody className="space-y-3 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Kicker>ADN institucional</Kicker>
              <h2 className="font-slab text-lg font-bold leading-tight text-fg">{dna.primaryTrait}</h2>
            </div>
            <Badge tone="accent">Fundado en {club?.founded_year || 1928}</Badge>
          </div>
          <p className="text-sm italic leading-relaxed text-fg-muted">"{dna.subtitle}"</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {attrs.map(([label, value, hint, bar]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd className="flex items-baseline justify-between">
                  <span className="num font-display text-xl font-bold leading-tight text-fg">{value}</span>
                  <span className="text-[11px] text-fg-subtle">{hint}</span>
                </dd>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {/* Camiseta titular */}
      <Card as="section" aria-label="Camiseta titular">
        <CardBody className="flex flex-col items-center gap-3 p-3 sm:flex-row sm:p-4">
          <Jersey primary={club?.primary_color} secondary={club?.secondary_color} pattern={club?.jersey_pattern} label={`Camiseta titular de ${club?.name || 'tu club'}`} className="size-20 shrink-0" />
          <div className="w-full flex-1">
            <Heading>Camiseta titular</Heading>
            <OptionCards
              label="Diseño de la camiseta"
              value={normalizeJerseyPattern(club?.jersey_pattern)}
              onChange={(id) => onChangeJersey?.(id)}
              columns="grid-cols-2 sm:grid-cols-3"
              options={JERSEY_PATTERNS.map(j => ({ value: j.id, ...j }))}
              renderOption={(j) => <span className="text-xs font-medium text-fg">{j.label}</span>}
            />
          </div>
        </CardBody>
      </Card>

      {/* 2. Nuestra casa y vitrina */}
      <Card as="section" aria-label="Casa y vitrina">
        <CardBody className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2 lg:divide-x lg:divide-line">
          <div className="space-y-2">
            <Heading aside={<Link to="/finances" className="text-xs font-semibold text-primary hover:underline">Obras →</Link>}>Nuestra casa</Heading>
            <h4 className="text-sm font-semibold text-fg">{club?.stadium_name || `Estadio de ${club?.name || 'la Ciudad'}`}</h4>
            <p className="text-xs text-fg-muted">
              {(club?.stadium_capacity || 8000).toLocaleString('es-AR')} espectadores · {club?.city || 'Rosario'}, {club?.country || 'Argentina'}
            </p>
          </div>
          <div className="space-y-2 lg:pl-4">
            <Heading aside={<span className="text-xs text-fg-muted">{trophies.length} trofeos oficiales</span>}>Vitrina de títulos</Heading>
            {trophies.length === 0 ? (
              <p className="text-xs text-fg-muted"><b className="font-semibold text-fg">Vitrina esperando su primera vuelta olímpica.</b> Las copas llegarán cuando tu proyecto culmine en lo más alto.</p>
            ) : (
              <ul>
                {trophies.map(trophy => (
                  <li key={trophy.id || trophy.season_year} className={Row}>
                    <span className="flex items-center gap-2 font-semibold text-fg"><Trophy className="size-4 text-gold" aria-hidden="true" />{trophy.competition_name || 'Torneo de Liga'}</span>
                    <Badge tone="accent">Temporada {trophy.season_year}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 3. Ídolos de la casa */}
      <section aria-label="Ídolos de la casa" className="space-y-2">
        <Heading aside={<span className="hidden text-xs text-fg-subtle sm:inline">Las figuras grabadas en la memoria del hincha</span>}>Ídolos de la casa</Heading>
        {topIdols.length === 0 ? (
          <p className="text-xs text-fg-muted"><b className="font-semibold text-fg">Escribiendo las primeras leyendas.</b> Los jugadores con más partidos, goles y títulos ascenderán a este mural.</p>
        ) : (
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {topIdols.map((idol, i) => (
              <li key={idol.id || i} className="w-56 shrink-0 border border-line bg-surface p-2.5 sm:w-auto">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-fg">{idol.player_name || idol.name}</span>
                  <Badge tone="accent">{idol.role_label || 'Ídolo'}</Badge>
                </div>
                <p className="text-xs text-fg-subtle">{idol.matches_count || 120} partidos · {idol.goals_count || 0} goles</p>
                <p className="mt-0.5 text-xs italic text-fg-muted">"{idol.legacy_quote || 'Referente en el crecimiento del club.'}"</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Cuerpo técnico y cantera */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="Cuerpo técnico" className="space-y-1">
          <Heading aside={<Button size="sm" variant="outline" onClick={onOpenStaffModal}>Especialistas</Button>}>Cuerpo técnico</Heading>
          {staff.length === 0 ? (
            <p className="py-2 text-xs text-fg-muted">Sos el único al mando táctico y físico del club.</p>
          ) : (
            <ul>
              {staff.map(s => (
                <li key={s.id} className={Row}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg">{s.name}</p>
                    <p className="text-fg-subtle">{s.role} · Nivel {s.level}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onFireStaff(s)} aria-label={`Despedir a ${s.name}`}>Despedir</Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Academia" className="space-y-1">
          <Heading aside={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={onOpenYouthModal}>Cantera</Button><Button size="sm" onClick={onGenerateProspect}>Otear · $5.000</Button></div>}>
            Academia · Nv. {club?.academy_level || 1}
          </Heading>
          {youth.length === 0 ? (
            <p className="py-2 text-xs text-fg-muted">Cantera vacía. Oteá talento juvenil para nutrir el semillero.</p>
          ) : (
            <ul>
              {youth.map(y => (
                <li key={y.id} className={Row}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg">{y.first_name} {y.last_name}</p>
                    <p className="text-fg-subtle">{y.position} · {y.age} años · POT {y.attr_potential}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onPromoteYouth(y.id)}>Promover</Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
