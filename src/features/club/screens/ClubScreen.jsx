import React, { useEffect, useState } from 'react'
import { GraduationCap, Mic, Sparkles, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { staffApi, academyApi } from '../../../api/clubFeatures'
import { clubHistoryApi } from '../../../api/clubHistory'
import { financesApi } from '../../../api/finances'
import { supabase } from '../../../api/supabase'
import { useGameContext } from '../../../context/GameContext'
import { queryCache } from '../../../utils/cache'
import { formatMoney } from '../../../lib/format'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Skeleton, Stat, Tabs, TabsList, TabsTrigger
} from '../../../components/ui'
import YouthAcademyModal from './YouthAcademyModal'
import StaffManagementModal from './StaffManagementModal'
import StadiumManagementTab from './StadiumManagementTab'
import FanbaseManagementTab from './FanbaseManagementTab'
import BoardManagementTab from './BoardManagementTab'
import LockerRoomTab from './LockerRoomTab'
import PressRoomModal from './PressRoomModal'
import InfirmaryTab from './InfirmaryTab'
import ClubHistoryTab from './ClubHistoryTab'
import IdolsLegendsTab from './IdolsLegendsTab'
import { friendlyError } from '../../../lib/errors'

const TABS = [
  ['gestion', 'Gestión y staff'],
  ['vestuario', 'Vestuario'],
  ['enfermeria', 'Enfermería'],
  ['estadio', 'Estadio y obras'],
  ['hinchada', 'Hinchada'],
  ['directiva', 'Directiva'],
  ['historia', 'Historia y récords'],
  ['idolos', 'Ídolos y leyendas']
]

const PROSPECT_COST = 5000

export default function ClubScreen() {
  const { club, manager, loading: contextLoading, confirmAction } = useGameContext()

  const cachedClubData = club?.id ? queryCache.get(`club:screen:${club.id}`) : null
  const [loading, setLoading] = useState(!cachedClubData)
  const [activeTab, setActiveTab] = useState('gestion')
  const [showYouthModal, setShowYouthModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showPressModal, setShowPressModal] = useState(false)

  const [data, setData] = useState(cachedClubData || {
    staff: [], youth: [], candidates: [], history: [], idols: [], milestones: [], records: [], finances: null
  })

  const loadData = async (force = false) => {
    try {
      if (!club?.id) return
      if (force) queryCache.invalidate(`club:screen:${club.id}`)

      const clubData = await queryCache.fetch(`club:screen:${club.id}`, async () => {
        const [staff, youth, candidates, historyRes, idols, milestones, records, finances] = await Promise.all([
          staffApi.getStaff(club.id),
          academyApi.getYouthPlayers(club.id),
          staffApi.getAvailableStaff(),
          supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false }),
          clubHistoryApi.getIdolsAndLegends(club.id),
          clubHistoryApi.getClubMilestones(club.id),
          clubHistoryApi.getClubRecords(club.id),
          // Sueldos y flujo semanal: los mismos números que la pantalla Finanzas (antes se calculaban acá con valores fijos)
          financesApi.getFinances(club.id).catch(() => null)
        ])

        return {
          staff: staff || [],
          youth: youth || [],
          candidates: candidates || [],
          history: historyRes.data || [],
          idols: idols || [],
          milestones: milestones || [],
          records: records || [],
          finances: finances || null
        }
      }, 60000)

      setData(clubData)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar la información del club')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, club])

  const handleHireStaff = async (staffMember) => {
    try {
      await staffApi.hireStaff(club.id, staffMember)
      toast.success(`${staffMember.name} contratado como ${staffMember.role}`)
      loadData(true)
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const handleGenerateProspect = async () => {
    try {
      if (club.budget < PROSPECT_COST) return toast.error(`Presupuesto insuficiente (${formatMoney(PROSPECT_COST)} requeridos)`)
      await financesApi.moveCash({ clubId: club.id, amount: -PROSPECT_COST, category: 'ACADEMY', description: 'Ojeo de un juvenil para la cantera' })
      await academyApi.generateYouthProspect(club.id, club.academy_level || 1)
      toast.success('¡Nuevo juvenil oteado en la academia!')
      loadData(true)
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const handlePromote = async (youthId) => {
    try {
      await academyApi.promoteToFirstTeam(youthId)
      toast.success('Jugador promovido al primer equipo')
      loadData(true)
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const fireStaff = async (s) => {
    const confirmed = await confirmAction({
      title: 'Despedir staff',
      description: `¿Rescindir el contrato de ${s.name}? Dejará de aportar sus bonificaciones al club.`,
      confirmText: 'Despedir',
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    if (!confirmed) return
    try {
      await staffApi.fireStaff(s.id)
      toast.success('Contrato de staff rescindido')
      loadData(true)
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando instalaciones del club">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-11" />
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      </div>
    )
  }

  const fin = data.finances
  const salaries = fin ? (fin.expenses?.playerWages || 0) + (fin.expenses?.staffWages || 0) : null
  const weeklyFlow = fin ? fin.expectedWeeklyFlow || 0 : null
  const refresh = () => loadData(true)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow={`Fundado en ${club?.founded_year || 2026} · ${club?.city || 'Ciudad'}, ${club?.country || 'Nacional'}`}
        title={club?.name || 'Mi club'}
        actions={<Button variant="outline" size="sm" onClick={() => setShowPressModal(true)}><Mic />Prensa</Button>}
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Presupuesto" value={formatMoney(club?.budget || 0)} valueClassName="text-2xl text-accent sm:text-3xl" />
          <Stat label="Sueldos" value={salaries === null ? '—' : formatMoney(salaries)} hint="plantel y staff por semana" valueClassName="text-2xl sm:text-3xl" />
          <Stat label="Por semana" value={weeklyFlow === null ? '—' : `${weeklyFlow >= 0 ? '+' : ''}${formatMoney(weeklyFlow)}`} hint="lo que entra menos lo que sale" valueClassName={`text-2xl sm:text-3xl ${weeklyFlow === null ? '' : weeklyFlow >= 0 ? 'text-accent' : 'text-danger'}`} />
          <Stat label="Academia" value={`Nv. ${club?.academy_level || 1}`} hint={`${data.youth.length} juveniles`} valueClassName="text-2xl sm:text-3xl" />
        </CardBody>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList aria-label="Secciones del club">
          {TABS.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {activeTab === 'gestion' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Cuerpo técnico</CardTitle>
              <Button size="sm" onClick={() => setShowStaffModal(true)}>Especialistas</Button>
            </CardHeader>
            <CardBody className="space-y-5">
              {data.staff.length === 0 ? (
                <EmptyState title="Sin asistentes" description="Sos el único al mando táctico y físico." className="py-6" />
              ) : (
                <ul className="space-y-2">
                  {data.staff.map(s => (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">{s.name}</p>
                        <p className="text-xs text-fg-muted">{s.role} · Nivel {s.level}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => fireStaff(s)} aria-label={`Despedir a ${s.name}`}>Despedir</Button>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <h3 className="eyebrow mb-2">Especialistas disponibles</h3>
                <ul className="space-y-2">
                  {data.candidates.map((c, i) => (
                    <li key={c.id ?? i} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">{c.name}</p>
                        <p className="text-xs text-fg-muted">{c.role} · Nv. {c.level} · {formatMoney(c.salary)}/mes</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleHireStaff(c)} aria-label={`Contratar a ${c.name}`}><UserPlus />Contratar</Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Academia · Nv. {club?.academy_level || 1}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowYouthModal(true)}><GraduationCap />Cantera</Button>
                <Button size="sm" onClick={handleGenerateProspect}><Sparkles />Otear · {formatMoney(PROSPECT_COST)}</Button>
              </div>
            </CardHeader>
            <CardBody>
              {data.youth.length === 0 ? (
                <EmptyState icon={GraduationCap} title="Cantera vacía" description="Oteá talento juvenil para nutrir el semillero." className="py-6" />
              ) : (
                <ul className="space-y-2">
                  {data.youth.map(y => (
                    <li key={y.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                          <span className="truncate">{y.first_name} {y.last_name}</span>
                          <Badge tone="accent">POT {y.attr_potential}</Badge>
                        </p>
                        <p className="text-xs text-fg-muted">{y.position} · {y.age} años</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handlePromote(y.id)}>Promover</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'vestuario' && <LockerRoomTab club={club} confirmAction={confirmAction} onUpdateClub={refresh} />}
      {activeTab === 'enfermeria' && <InfirmaryTab club={club} />}
      {activeTab === 'estadio' && <StadiumManagementTab club={club} confirmAction={confirmAction} onUpdateClub={refresh} />}
      {activeTab === 'hinchada' && <FanbaseManagementTab club={club} />}
      {activeTab === 'directiva' && <BoardManagementTab club={club} manager={manager} confirmAction={confirmAction} onUpdateClub={refresh} />}
      {activeTab === 'historia' && <ClubHistoryTab club={club} confirmAction={confirmAction} onUpdateClub={refresh} />}
      {activeTab === 'idolos' && <IdolsLegendsTab club={club} manager={manager} confirmAction={confirmAction} onUpdateClub={refresh} />}

      {showYouthModal && <YouthAcademyModal club={club} manager={manager} onClose={() => setShowYouthModal(false)} onCandidatePromoted={refresh} />}
      {showStaffModal && <StaffManagementModal club={club} manager={manager} onClose={() => setShowStaffModal(false)} onStaffUpdated={refresh} />}
      {showPressModal && <PressRoomModal club={club} onClose={() => setShowPressModal(false)} />}
    </div>
  )
}
