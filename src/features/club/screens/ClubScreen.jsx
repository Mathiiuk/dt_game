import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, GraduationCap, Mic, Sparkles, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { staffApi, academyApi } from '../../../api/clubFeatures'
import { clubHistoryApi } from '../../../api/clubHistory'
import { financesApi } from '../../../api/finances'
import { supabase } from '../../../api/supabase'
import { useGameContext } from '../../../context/GameContext'
import { queryCache } from '../../../utils/cache'
import { formatMoney } from '../../../lib/format'
import {
  Badge, Button, Card, CardBody, PageHeader, Skeleton, Stat, Tabs, TabsList, TabsTrigger
} from '../../../components/ui'
import YouthAcademyModal from './YouthAcademyModal'
import StaffManagementModal from './StaffManagementModal'
import PressRoomModal from './PressRoomModal'
import ClubIdentityTab from './ClubIdentityTab'
import ClubTribuneTab from './ClubTribuneTab'
import LockerRoomTab from './LockerRoomTab'
import InfirmaryTab from './InfirmaryTab'
import BoardManagementTab from './BoardManagementTab'
import { friendlyError } from '../../../lib/errors'

const TABS = [
  ['mistica', 'Mística y vitrina'],
  ['tribuna', 'La tribuna'],
  ['vestuario', 'El vestuario']
]

const PROSPECT_COST = 5000

export default function ClubScreen() {
  const { club, manager, loading: contextLoading, confirmAction } = useGameContext()

  const cachedClubData = club?.id ? queryCache.get(`club:screen:${club.id}`) : null
  const [loading, setLoading] = useState(!cachedClubData)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')

  // Mapeo inteligente de pestañas históricas a las 3 nuevas vivas
  const resolveActiveTab = (tab) => {
    if (tab === 'enfermeria') return 'enfermeria'
    if (tab === 'directiva') return 'directiva'
    if (tab === 'hinchada') return 'tribuna'
    if (tab === 'vestuario') return 'vestuario'
    if (tab === 'tribuna') return 'tribuna'
    if (tab === 'mistica') return 'mistica'
    return 'mistica'
  }

  const activeTab = resolveActiveTab(requestedTab)
  const setActiveTab = (tab) => setSearchParams(tab === 'mistica' ? {} : { tab }, { replace: true })

  const [showYouthModal, setShowYouthModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showPressModal, setShowPressModal] = useState(false)

  const [data, setData] = useState(cachedClubData || {
    staff: [],
    youth: [],
    candidates: [],
    history: [],
    idols: [],
    milestones: [],
    records: [],
    finances: null
  })

  const loadData = async (force = false) => {
    try {
      if (!club?.id) return
      if (force) queryCache.invalidate(`club:screen:${club.id}`)

      const clubData = await queryCache.fetch(`club:screen:${club.id}`, async () => {
        const [staff, youth, candidates, historyRes, idols, milestones, records, finances] = await Promise.all([
          staffApi.getStaff(club.id).catch(() => []),
          academyApi.getYouthPlayers(club.id).catch(() => []),
          staffApi.getAvailableStaff().catch(() => []),
          supabase.from('season_history').select('*').eq('club_id', club.id).order('season_year', { ascending: false }),
          clubHistoryApi.getIdolsAndLegends(club.id).catch(() => []),
          clubHistoryApi.getClubMilestones(club.id).catch(() => []),
          clubHistoryApi.getClubRecords(club.id).catch(() => []),
          financesApi.getFinances(club.id).catch(() => null)
        ])

        return {
          staff: staff || [],
          youth: youth || [],
          candidates: candidates || [],
          history: historyRes?.data || [],
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
  }, [contextLoading, club?.id])

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
      if (club.budget < PROSPECT_COST) {
        return toast.error(`Presupuesto insuficiente (${formatMoney(PROSPECT_COST)} requeridos)`)
      }
      await financesApi.moveCash({
        clubId: club.id,
        amount: -PROSPECT_COST,
        category: 'ACADEMY',
        description: 'Ojeo de un juvenil para la cantera'
      })
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <PageHeader
        eyebrow={`Fundado en ${club?.founded_year || 2026} · ${club?.city || 'Ciudad'}, ${club?.country || 'Nacional'}`}
        title={club?.name || 'Mi club'}
        actions={<Button variant="outline" size="sm" onClick={() => setShowPressModal(true)}><Mic className="size-4" />Prensa</Button>}
      />

      {/* Métricas clave de la institución */}
      <Card className="border border-line bg-surface/90 shadow-sm">
        <CardBody className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-6">
          <Stat label="Presupuesto" value={formatMoney(club?.budget || 0)} valueClassName="text-2xl font-bold font-display text-accent sm:text-3xl" />
          <Stat label="Sueldos" value={salaries === null ? '—' : formatMoney(salaries)} hint="plantel y staff por semana" valueClassName="text-2xl font-bold font-display sm:text-3xl" />
          <Stat label="Por semana" value={weeklyFlow === null ? '—' : `${weeklyFlow >= 0 ? '+' : ''}${formatMoney(weeklyFlow)}`} hint="lo que entra menos lo que sale" valueClassName="text-2xl font-bold font-display sm:text-3xl" />
          <Stat label="Academia" value={`Nv. ${club?.academy_level || 1}`} hint={`${data.youth.length} juveniles`} valueClassName="text-2xl font-bold font-display sm:text-3xl" />
        </CardBody>
      </Card>

      {/* Redirecciones informativas para rutas históricas */}
      {activeTab === 'enfermeria' && (
        <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-accent">
            <AlertCircle className="size-4 shrink-0" />
            <span>La Enfermería y el parte médico ahora se gestionan de forma directa en el <strong>Plantel</strong>.</span>
          </div>
          <Link to="/squad" className="font-bold text-accent hover:underline flex items-center gap-1 shrink-0">
            Ir a Plantel <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {activeTab === 'directiva' && (
        <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-accent">
            <AlertCircle className="size-4 shrink-0" />
            <span>Los objetivos y la confianza de la Directiva se consultan en el perfil de <strong>Carrera del DT</strong>.</span>
          </div>
          <Link to="/manager" className="font-bold text-accent hover:underline flex items-center gap-1 shrink-0">
            Ir a Carrera <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Pestañas Vivas: Mística, Tribuna, Vestuario */}
      <Tabs value={['mistica', 'tribuna', 'vestuario'].includes(activeTab) ? activeTab : 'mistica'} onValueChange={setActiveTab}>
        <TabsList aria-label="Secciones del club" className="w-full sm:w-auto">
          {TABS.map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="text-xs sm:text-sm font-semibold">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 1. Mística & Vitrina */}
      {activeTab === 'mistica' && (
        <div className="space-y-6">
          <ClubIdentityTab
            club={club}
            history={data.history}
            idols={data.idols}
            records={data.records}
            staff={data.staff}
            youth={data.youth}
            onFireStaff={fireStaff}
            onOpenStaffModal={() => setShowStaffModal(true)}
            onOpenYouthModal={() => setShowYouthModal(true)}
            onPromoteYouth={handlePromote}
            onGenerateProspect={handleGenerateProspect}
          />

          {/* Candidatos a staff para contratación rápida */}
          {data.candidates.length > 0 && (
            <Card className="border border-line bg-surface/90">
              <CardBody className="p-4 sm:p-5 space-y-3">
                <h3 className="eyebrow">Especialistas disponibles para el cuerpo técnico</h3>
                <ul className="space-y-2">
                  {data.candidates.map((c, i) => (
                    <li key={c.id ?? i} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-xs">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">{c.name}</p>
                        <p className="text-fg-muted">{c.role} · Nv. {c.level} · {formatMoney(c.salary)}/mes</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleHireStaff(c)} aria-label={`Contratar a ${c.name}`}>
                        <UserPlus className="size-3.5" />Contratar
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* 2. La Tribuna */}
      {activeTab === 'tribuna' && (
        <ClubTribuneTab club={club} />
      )}

      {/* 3. El Vestuario */}
      {activeTab === 'vestuario' && (
        <LockerRoomTab club={club} confirmAction={confirmAction} onUpdateClub={refresh} />
      )}

      {/* Subsecciones heredadas para compatibilidad con links directos */}
      {activeTab === 'enfermeria' && <InfirmaryTab club={club} />}
      {activeTab === 'directiva' && <BoardManagementTab club={club} manager={manager} confirmAction={confirmAction} onUpdateClub={refresh} />}

      {/* Modales */}
      {showYouthModal && (
        <YouthAcademyModal
          club={club}
          manager={manager}
          onClose={() => setShowYouthModal(false)}
          onCandidatePromoted={refresh}
        />
      )}
      {showStaffModal && (
        <StaffManagementModal
          club={club}
          manager={manager}
          onClose={() => setShowStaffModal(false)}
          onStaffUpdated={refresh}
        />
      )}
      {showPressModal && (
        <PressRoomModal
          club={club}
          onClose={() => setShowPressModal(false)}
        />
      )}
    </div>
  )
}
