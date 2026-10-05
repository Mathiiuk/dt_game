import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Crown, Medal, Sparkles, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { hallOfFameApi } from '../../api/hallOfFame'
import { useGameContext } from '../../context/GameContext'
import { HOF_FILTERS, PODIUM, filterRanking, splitPodium } from '../../domain/hallOfFame'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, ChoiceChips, EmptyState, PageHeader, ResponsiveOverlay, Skeleton, Stat } from '../../components/ui'

const num = (n) => Number(n || 0).toLocaleString('es-AR')

export default function HallOfFameScreen() {
  const { manager, loading: contextLoading, confirmAction } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState([])
  const [projection, setProjection] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [inducting, setInducting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [rankingData, projectionData] = await Promise.all([
        hallOfFameApi.getRanking(),
        manager?.id ? hallOfFameApi.getLiveManagerProjection(manager.id) : null
      ])
      setRanking(rankingData || [])
      setProjection(projectionData)
    } catch (err) {
      toast.error('Error al cargar el Salón de la Fama: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager?.id])

  const handleInductSelf = async () => {
    if (!manager?.id || !projection) return
    const confirmed = await confirmAction({
      title: 'Inmortalizar en el Salón de la Fama',
      description: `¿Inmortalizar tu trayectoria actual con ${num(projection.estimatedScore)} puntos de legado (${projection.tier.title})?`,
      confirmText: 'Inmortalizar legado',
      cancelText: 'Cancelar',
      variant: 'default'
    })
    if (!confirmed) return
    try {
      setInducting(true)
      await hallOfFameApi.inductManager(manager.id)
      toast.success('¡Fuiste inducido oficialmente al Salón de la Fama del Fútbol!')
      await loadData()
    } catch (err) {
      toast.error('Error al inducir al Salón de la Fama: ' + err.message)
    } finally {
      setInducting(false)
    }
  }

  const filtered = useMemo(() => filterRanking(ranking, filter), [ranking, filter])
  const { top } = useMemo(() => splitPodium(filtered), [filtered])

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Abriendo el Salón de la Fama">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-36" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        backTo="/manager"
        eyebrow="Récords históricos y legado universal"
        title="Salón de la Fama"
      />

      <ChoiceChips label="Filtrar ranking" value={filter} onChange={setFilter} options={HOF_FILTERS} className="mb-6" />

      {projection && (
        <Card className="mb-8 border-gold/40">
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="gold"><Sparkles className="size-3" aria-hidden="true" />Tu proyección en vivo</Badge>
                  <Badge>{projection.tier.title}</Badge>
                  {projection.isInducted && <Badge tone="accent"><CheckCircle2 className="size-3" aria-hidden="true" />Miembro inducido</Badge>}
                </div>
                <h2 className="font-display text-2xl font-semibold text-fg">{projection.manager.first_name} {projection.manager.last_name}</h2>
                <p className="text-xs text-fg-muted">{projection.manager.club?.name || 'Club'} · Nivel {projection.manager.level} · Prestigio {projection.manager.reputation} pts</p>
              </div>
              {!projection.isInducted && (
                <Button loading={inducting} onClick={handleInductSelf}>{!inducting && <Crown />}Inmortalizar en el Hall</Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-5 border-t border-line pt-4 sm:grid-cols-4">
              <Stat label="Puntos de legado" value={num(projection.estimatedScore)} valueClassName="text-2xl text-gold" />
              <Stat label="Títulos totales" value={projection.stats.totalTitles} valueClassName="text-2xl" />
              <Stat label="Efectividad" value={`${projection.stats.winRatio}%`} valueClassName="text-2xl text-accent" />
              <Stat label="Partidos ganados" value={projection.stats.wonMatches} valueClassName="text-2xl" />
            </div>
          </CardBody>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card as="div"><EmptyState icon={Trophy} title="Sin registros" description="No hay entrenadores que coincidan con el filtro." action={<Button variant="outline" size="sm" onClick={() => setFilter('all')}>Ver todas las leyendas</Button>} /></Card>
      ) : (
        <>
          <section className="mb-8" aria-label="Olimpo de entrenadores">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-fg"><Medal className="size-5 text-gold" aria-hidden="true" />Olimpo de entrenadores</h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {top.map((legend, i) => (
                <li key={legend.id || i}>
                  <button
                    type="button"
                    onClick={() => setSelected(legend)}
                    className={cn('h-full w-full rounded-lg border bg-surface p-4 text-left transition-colors hover:border-line-strong sm:p-5', i === 0 ? 'border-gold/50' : 'border-line')}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('flex items-center gap-1.5 text-xs font-semibold', PODIUM[i].tone)}><Crown className="size-4" aria-hidden="true" />{PODIUM[i].label}</span>
                      <span className="num text-xs font-semibold text-fg-muted">{num(legend.legacy_score)} pts</span>
                    </span>
                    <span className="mt-3 block font-display text-xl font-semibold leading-tight text-fg">{legend.manager_name}</span>
                    <span className="block text-xs text-fg-muted">{legend.nationality} · {legend.era}</span>
                    <span className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-2.5 text-center">
                      <span><span className="eyebrow block">Títulos</span><span className="num text-base font-semibold text-gold">{legend.titles_count}</span></span>
                      <span><span className="eyebrow block">Victorias</span><span className="num text-base font-semibold text-fg">{legend.matches_won}</span></span>
                      <span><span className="eyebrow block">Eficacia</span><span className="num text-base font-semibold text-accent">{legend.win_ratio}%</span></span>
                    </span>
                    <span className="mt-3 block truncate text-xs text-fg-subtle">{Array.isArray(legend.clubs_managed) ? legend.clubs_managed.join(', ') : 'Club'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Card as="section" aria-label="Registro general">
            <CardBody>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-fg"><Trophy className="size-5 text-gold" aria-hidden="true" />Registro general de directores técnicos</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm" aria-label="Ranking histórico">
                  <thead>
                    <tr className="border-b border-line text-fg-subtle">
                      <th scope="col" className="eyebrow pb-3 pl-1">#</th>
                      <th scope="col" className="eyebrow pb-3">Entrenador</th>
                      <th scope="col" className="eyebrow pb-3 text-center">Títulos (nac / int)</th>
                      <th scope="col" className="eyebrow pb-3 text-center">PG / PJ</th>
                      <th scope="col" className="eyebrow pb-3 text-center">Efectividad</th>
                      <th scope="col" className="eyebrow pb-3 pr-1 text-right">Legado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-surface-2">
                        <td className="num py-3 pl-1 font-semibold text-fg-subtle">{idx + 1}</td>
                        <td className="py-3">
                          <button type="button" onClick={() => setSelected(item)} className="text-left" aria-label={`Ver ficha de ${item.manager_name}`}>
                            <span className="flex items-center gap-1.5 font-semibold text-fg">{item.manager_name}{item.is_human && <Badge tone="accent">Vos</Badge>}</span>
                            <span className="block text-xs text-fg-subtle">{item.nationality} · {item.era}</span>
                          </button>
                        </td>
                        <td className="num py-3 text-center"><span className="font-semibold text-gold">{item.titles_count}</span> <span className="text-xs text-fg-subtle">({item.national_titles || 0} / {item.international_titles || 0})</span></td>
                        <td className="num py-3 text-center text-fg-muted">{item.matches_won} / {item.matches_played}</td>
                        <td className="num py-3 text-center font-semibold text-accent">{item.win_ratio}%</td>
                        <td className="num py-3 pr-1 text-right font-display text-lg font-semibold text-gold">{num(item.legacy_score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {selected && (
        <ResponsiveOverlay
          title={selected.manager_name}
          description={`Ficha del entrenador histórico · ${selected.nationality} · ${selected.era}${selected.is_human ? ' · Tu carrera' : ''}`}
          onClose={() => setSelected(null)}
          size="sm"
          footer={<Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-2 p-4">
              <Stat label="Puntaje de legado" value={num(selected.legacy_score)} valueClassName="text-2xl text-gold" />
              <Stat label="Títulos totales" value={selected.titles_count} valueClassName="text-2xl" />
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                ['Títulos locales', selected.national_titles || 0, 'text-fg'],
                ['Títulos internacionales', selected.international_titles || 0, 'text-gold'],
                ['Partidos dirigidos', selected.matches_played || 0, 'text-fg'],
                ['Partidos ganados', selected.matches_won || 0, 'text-accent'],
                ['Eficacia histórica', `${selected.win_ratio || 0}%`, 'text-accent']
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-fg-muted">{k}</dt><dd className={cn('num font-semibold', c)}>{v}</dd></div>
              ))}
            </dl>
            {selected.clubs_managed?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Clubes dirigidos</p>
                <ul className="flex flex-wrap gap-1.5">
                  {selected.clubs_managed.map((name, i) => <li key={i}><Badge>{name}</Badge></li>)}
                </ul>
              </div>
            )}
          </div>
        </ResponsiveOverlay>
      )}
    </div>
  )
}
