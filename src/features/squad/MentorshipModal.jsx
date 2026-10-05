import React, { useState, useEffect } from 'react'
import { ArrowRight, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { personalitiesApi, PERSONALITY_ARCHETYPES } from '../../api/personalities'
import {
  Badge, Button, Card, CardBody, EmptyState, Field, Progress, ResponsiveOverlay, Select, SectionTitle, Skeleton
} from '../../components/ui'
import { Users } from 'lucide-react'
import { friendlyError } from '../../lib/errors'

const describe = (p) => `${p.name} (${p.position}, ${p.age} años, nivel ${p.overall})`

/** Programa de tutorías: un veterano transmite liderazgo y profesionalismo a un juvenil */
export default function MentorshipModal({ club, players = [], onClose, onMentorshipStarted }) {
  const [mentorships, setMentorships] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVeteran, setSelectedVeteran] = useState('')
  const [selectedYouth, setSelectedYouth] = useState('')
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      setMentorships(await personalitiesApi.getClubMentorships(club.id))
    } catch (e) {
      console.error(e)
      toast.error('Error cargando las mentorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [club?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const eligibleVeterans = players.filter(p => (p.age || 20) >= 25)
  const eligibleYouth = players.filter(p => (p.age || 20) <= 21)

  const handleStartMentorship = async (e) => {
    e.preventDefault()
    if (!selectedVeteran || !selectedYouth) {
      toast.error('Selecciona al tutor y al juvenil')
      return
    }
    try {
      setCreating(true)
      await personalitiesApi.assignMentorship(club.id, selectedVeteran, selectedYouth)
      toast.success('Programa de mentoría iniciado')
      setSelectedVeteran('')
      setSelectedYouth('')
      onMentorshipStarted?.()
      await loadData()
    } catch (err) {
      toast.error(friendlyError(err, 'Error al iniciar la tutoría'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <ResponsiveOverlay
      title="Tutorías y mentoría"
      description="Transmisión de liderazgo y profesionalismo de veteranos a juveniles"
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-7">
        <section aria-labelledby="mentor-new">
          <SectionTitle>Asignar una tutoría</SectionTitle>
          <Card as="div">
            <CardBody>
              <form id="mentor-new" onSubmit={handleStartMentorship} className="grid gap-4 sm:grid-cols-2">
                <Field label="Veterano tutor (25 años o más)">
                  {(p) => (
                    <Select {...p} value={selectedVeteran} onChange={(e) => setSelectedVeteran(e.target.value)}>
                      <option value="">Seleccionar veterano…</option>
                      {eligibleVeterans.map(v => <option key={v.id} value={v.id}>{describe(v)}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Juvenil protegido (21 años o menos)">
                  {(p) => (
                    <Select {...p} value={selectedYouth} onChange={(e) => setSelectedYouth(e.target.value)}>
                      <option value="">Seleccionar juvenil…</option>
                      {eligibleYouth.map(y => <option key={y.id} value={y.id}>{describe(y)}</option>)}
                    </Select>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={creating} disabled={!selectedVeteran || !selectedYouth} className="w-full sm:w-auto">
                    {!creating && <UserCheck />}Iniciar mentoría (20 semanas)
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="mentor-list">
          <SectionTitle>En curso e históricas</SectionTitle>
          {loading ? (
            <div className="space-y-2" aria-busy="true"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          ) : mentorships.length === 0 ? (
            <Card as="div">
              <EmptyState icon={Users} title="Sin tutorías activas" description="Empareja a un veterano con un juvenil para acelerar su madurez competitiva." />
            </Card>
          ) : (
            <ul className="space-y-2.5">
              {mentorships.map(m => (
                <li key={m.id}>
                  <Card as="div">
                    <CardBody className="space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg">
                          <span className="truncate">{m.veteran?.name || 'Veterano'}</span>
                          <ArrowRight className="size-3.5 shrink-0 text-fg-subtle" aria-label="guía a" />
                          <span className="truncate text-accent">{m.youth?.name || 'Juvenil'}</span>
                        </p>
                        <Badge tone={m.status === 'COMPLETED' ? 'accent' : 'warning'} className="num shrink-0">
                          {m.status === 'COMPLETED' ? 'Completada' : `${m.progress_percentage}%`}
                        </Badge>
                      </div>
                      <Progress tone={m.status === 'COMPLETED' ? 'accent' : 'warning'} value={m.progress_percentage} label="Progreso de la mentoría" />
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mentor-guide">
          <SectionTitle>Guía de arquetipos</SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Object.values(PERSONALITY_ARCHETYPES).map(arch => (
              <Card as="div" key={arch.key}>
                <CardBody className="space-y-1.5 py-3">
                  <Badge>{arch.name}</Badge>
                  <p className="text-sm leading-snug text-fg-muted">{arch.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </ResponsiveOverlay>
  )
}
