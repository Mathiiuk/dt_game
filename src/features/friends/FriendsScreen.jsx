import React, { useCallback, useEffect, useState } from 'react'
import { Users, Copy, LogOut, Skull, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { friendsApi } from '../../api/friends'
import { useGameContext } from '../../context/GameContext'
import { MAX_MEMBERS, MOTES, PRANKS, prankBlockReason, prankById } from '../../domain/friendRoom'
import { Badge, Button, Card, CardBody, EmptyState, Field, Input, PageHeader, ResponsiveOverlay, Skeleton } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { DEFAULT_SETTINGS, sanitizeSettings } from '../../domain/friendLeague'
import LeagueSetupCard from './LeagueSetupCard'
import LeagueView from './LeagueView'

/** Liga de amigos: sala con código para hasta 10 DT, con tabla compartida, muro y travesuras de la AFA */
export default function FriendsScreen() {
  const { club, loading: contextLoading } = useGameContext()
  const [rooms, setRooms] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [table, setTable] = useState([])
  const [wall, setWall] = useState([])
  const [busy, setBusy] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [prankFor, setPrankFor] = useState(null) // { prank, choice }
  const [newSettings, setNewSettings] = useState({ ...DEFAULT_SETTINGS })
  const [draft, setDraft] = useState(null) // ajustes en edición dentro del lobby
  const [league, setLeague] = useState({ table: [], teams: [], fixtures: [] })

  const room = rooms?.find(r => r.id === roomId) || null
  const me = table.find(t => t.is_me)
  const isOwner = Boolean(room && me && room.created_by === me.user_id)
  const started = room && room.status !== 'LOBBY'

  const loadRooms = useCallback(async (selectId) => {
    try {
      const list = await friendsApi.getMyRooms()
      setRooms(list)
      setRoomId(prev => selectId || (list.some(r => r.id === prev) ? prev : list[0]?.id || null))
    } catch (err) {
      toast.error(friendlyError(err, 'No pudimos cargar tus salas.'))
      setRooms([])
    }
  }, [])

  const loadRoom = useCallback(async (id) => {
    if (!id) return
    try {
      const [t, w] = await Promise.all([friendsApi.getTable(id), friendsApi.getWall(id)])
      setTable(t)
      setWall(w)
      const current = (await friendsApi.getMyRooms()).find(r => r.id === id)
      if (current) setRooms(prev => (prev || []).map(r => (r.id === id ? current : r)))
      if (current && current.status !== 'LOBBY') {
        const [lt, lf] = await Promise.all([friendsApi.getLeagueTable(id), friendsApi.getLeagueFixtures(id)])
        setLeague({ table: lt, teams: lf.teams, fixtures: lf.fixtures })
      }
    } catch (err) {
      toast.error(friendlyError(err, 'No pudimos cargar la sala.'))
    }
  }, [])

  useEffect(() => { if (!contextLoading) loadRooms() }, [contextLoading, loadRooms])
  useEffect(() => { loadRoom(roomId) }, [roomId, loadRoom])

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      const res = await fn()
      if (okMsg) toast.success(okMsg)
      return res
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo completar.'))
      return null
    } finally {
      setBusy(false)
    }
  }

  const create = async () => {
    const res = await run(async () => {
      const created = await friendsApi.createRoom(roomName, club.id)
      await friendsApi.configureRoom(created.id, newSettings)
      return created
    }, 'Sala creada. Pasales el código a tus amigos.')
    if (res) { setRoomName(''); await loadRooms(res.id) }
  }
  const join = async () => {
    const res = await run(() => friendsApi.joinRoom(joinCode, club.id), 'Te sumaste a la sala.')
    if (res) { setJoinCode(''); await loadRooms(res.id) }
  }
  const leave = async () => {
    if (!window.confirm('¿Salir de la sala? Perdés tus puntos de travesuras.')) return
    await run(() => friendsApi.leaveRoom(roomId), 'Saliste de la sala.')
    setTable([]); setWall([]); await loadRooms()
  }
  const saveSettings = async () => {
    const res = await run(() => friendsApi.configureRoom(roomId, draft), 'Ajustes guardados.')
    if (res) { setDraft(null); await loadRooms(roomId); await loadRoom(roomId) }
  }
  const startLeague = async () => {
    const res = await run(() => friendsApi.startLeague(room, table.length), '¡Arrancó la liga!')
    if (res) await loadRoom(roomId)
  }
  const playRound = async () => {
    const res = await run(() => friendsApi.playRound(roomId))
    if (res) { toast.success(res.done ? 'Se jugó la última fecha.' : `Fecha ${res.round} jugada.`); await loadRoom(roomId) }
  }
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(room.code); toast.success('Código copiado.') } catch { toast.info(`Código: ${room.code}`) }
  }
  const doPrank = async (target) => {
    const { prank, choice } = prankFor
    const res = await run(() => friendsApi.prank(roomId, prank.id, target?.user_id || null, choice))
    if (res) {
      res.ok ? toast.success(res.message) : toast.error(res.message)
      setPrankFor(null)
      await loadRoom(roomId)
    }
  }

  if (contextLoading || rooms === null) {
    return <div className="mx-auto max-w-3xl space-y-3 px-4 py-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 w-full" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Con amigos"
        title="Liga de amigos"
        description={`Hasta ${MAX_MEMBERS} DT, una sala, puntos y mucha AFA.`}
      />

      {!room ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card as="div"><CardBody className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-fg">Armar una sala</h2>
            <Field label="Nombre de la sala">{(p) => <Input {...p} value={roomName} maxLength={40} placeholder="Los Pibes del Potrero" onChange={e => setRoomName(e.target.value)} />}</Field>
            <LeagueSetupCard settings={newSettings} onChange={setNewSettings} />
            <Button onClick={create} loading={busy} disabled={!roomName.trim() || !club}><Users />Crear sala</Button>
          </CardBody></Card>
          <Card as="div"><CardBody className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-fg">Entrar con un código</h2>
            <Field label="Código de la sala">{(p) => <Input {...p} value={joinCode} maxLength={8} placeholder="AB12CD" onChange={e => setJoinCode(e.target.value)} />}</Field>
            <Button variant="secondary" onClick={join} loading={busy} disabled={!joinCode.trim() || !club}>Entrar</Button>
          </CardBody></Card>
        </div>
      ) : (
        <div className="space-y-5">
          {rooms.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mis salas">
              {rooms.map(r => <Button key={r.id} size="sm" variant={r.id === roomId ? 'primary' : 'outline'} onClick={() => setRoomId(r.id)}>{r.name}</Button>)}
            </div>
          )}

          <Card as="div"><CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-fg">{room.name}</h2>
              <p className="text-sm text-fg-muted">{table.length} de {MAX_MEMBERS} DT · código <strong className="num tracking-widest text-fg">{room.code}</strong></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyCode}><Copy />Copiar código</Button>
              <Button size="sm" variant="ghost" onClick={leave}><LogOut />Salir</Button>
            </div>
          </CardBody></Card>

          {started ? (
            <LeagueView room={room} table={league.table} teams={league.teams} fixtures={league.fixtures} isOwner={isOwner} busy={busy} onPlayRound={playRound} />
          ) : (
            <>
            <Card as="div" className="overflow-hidden">
              <table className="w-full text-left text-sm" aria-label="Tabla de la sala">
                <thead><tr className="border-b border-line bg-surface-2 text-fg-subtle">
                  <th scope="col" className="eyebrow w-10 py-3 pl-3 text-center">Pos</th>
                  <th scope="col" className="eyebrow py-3">Club</th>
                  <th scope="col" className="eyebrow py-3 text-right">Liga</th>
                  <th scope="col" className="eyebrow py-3 text-right">Travesuras</th>
                  <th scope="col" className="eyebrow py-3 pr-3 text-right">Total</th>
                </tr></thead>
                <tbody>
                  {table.map((t, i) => (
                    <tr key={t.user_id} className={t.is_me ? 'bg-accent-soft/40' : ''}>
                      <td className="num py-2.5 pl-3 text-center text-fg-muted">{i + 1}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-fg">{t.club_name}</span>
                        {t.is_me && <Badge tone="accent" className="ml-2">Vos</Badge>}
                        {t.mote && <span className="block text-xs text-fg-subtle">“{t.mote}”</span>}
                      </td>
                      <td className="num py-2.5 text-right text-fg-muted">{t.league_points}</td>
                      <td className="num py-2.5 text-right text-fg-muted">{t.bonus > 0 ? `+${t.bonus}` : t.bonus}</td>
                      <td className="num py-2.5 pr-3 text-right font-semibold text-fg">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

              <Card as="div"><CardBody className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-fg">La liga de la sala</h3>
                {isOwner ? (
                  <>
                    <LeagueSetupCard settings={draft || sanitizeSettings({ ...DEFAULT_SETTINGS, ...(room.settings || {}) })} onChange={setDraft} humans={table.length} />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={saveSettings} loading={busy} disabled={!draft}>Guardar ajustes</Button>
                      <Button onClick={startLeague} loading={busy} disabled={table.length < 2 || Boolean(draft)}>Empezar la liga</Button>
                    </div>
                    {table.length < 2 && <p className="text-sm text-fg-subtle">Hacen falta al menos 2 DT. Pasales el código.</p>}
                    {draft && <p className="text-sm text-fg-subtle">Guardá los ajustes antes de empezar.</p>}
                  </>
                ) : (
                  <p className="text-sm text-fg-muted">Quien armó la sala decide los ajustes y cuándo empieza. Esperá al lobby.</p>
                )}
              </CardBody></Card>
            </>
          )}

          <section aria-labelledby="pranks-title">
            <h3 id="pranks-title" className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-fg">
              <Skull className="size-4.5 text-danger" aria-hidden="true" />Travesuras de la AFA
              <Badge tone="gold" className="num">{me?.mangos ?? 0} mangos</Badge>
            </h3>
            <p className="mb-3 text-sm text-fg-subtle">Ganás 2 mangos por partido jugado. Solo mueven puntos de la sala y el muro, nunca tu caja ni tu plantel. Máximo 3 por día.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PRANKS.map(p => (
                <li key={p.id}><Card as="div"><CardBody className="space-y-2">
                  <p className="font-semibold text-fg">{p.name} <span className="num text-sm font-normal text-fg-muted">· {p.cost} mangos</span></p>
                  <p className="text-sm text-fg-muted">{p.blurb}</p>
                  <Button size="sm" variant="secondary" disabled={Boolean(prankBlockReason(p, { mangos: me?.mangos || 0 })) || (p.target === 'friend' && table.length < 2)} onClick={() => setPrankFor({ prank: p, choice: p.needsChoice ? MOTES[0] : null })}>Hacer travesura</Button>
                </CardBody></Card></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="wall-title">
            <h3 id="wall-title" className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-fg"><Megaphone className="size-4.5 text-accent" aria-hidden="true" />Muro de la AFA</h3>
            {wall.length === 0 ? <EmptyState icon={Megaphone} title="Muro vacío" description="Todavía no pasó nada raro. Es cuestión de tiempo." /> : (
              <ul className="space-y-2">
                {wall.map(w => (
                  <li key={w.id} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg-muted">
                    {w.text}
                    <span className="mt-0.5 block text-xs text-fg-subtle">{new Date(w.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {prankFor && (
        <ResponsiveOverlay title={prankFor.prank.name} description={prankFor.prank.blurb} onClose={() => setPrankFor(null)} size="sm">
          <div className="space-y-3">
            {prankFor.prank.needsChoice && (
              <Field label="Mote">{(p) => (
                <select {...p} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg" value={prankFor.choice} onChange={e => setPrankFor({ ...prankFor, choice: e.target.value })}>
                  {MOTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}</Field>
            )}
            {prankById(prankFor.prank.id).target === 'self' ? (
              <Button onClick={() => doPrank(null)} loading={busy}>Apostar</Button>
            ) : (
              <ul className="space-y-2">
                {table.filter(t => !t.is_me).map(t => (
                  <li key={t.user_id}><Button variant="outline" className="w-full justify-between" loading={busy} onClick={() => doPrank(t)}><span>{t.club_name}</span><span className="num text-fg-muted">{t.points} pts</span></Button></li>
                ))}
              </ul>
            )}
          </div>
        </ResponsiveOverlay>
      )}
    </div>
  )
}
