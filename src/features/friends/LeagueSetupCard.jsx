import React from 'react'
import { DIFFICULTIES, ROOM_RULESETS, roundsFor, settingsSummary, teamsFor } from '../../domain/friendLeague'
import { Field, Segmented } from '../../components/ui'

const selectClass = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg'

/** Ajustes de la liga de la sala: los decide quien armó la sala hasta que empieza */
export default function LeagueSetupCard({ settings, onChange, humans = 2, disabled = false }) {
  const set = (patch) => onChange({ ...settings, ...patch })
  const teams = teamsFor(settings, humans)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Equipos" hint="Entre 4 y 20. Los lugares libres se completan con bots.">
          {(p) => <input {...p} type="number" min={4} max={20} disabled={disabled} className={selectClass} value={settings.teams} onChange={e => set({ teams: Number(e.target.value) })} />}
        </Field>
        <Field label="Fechas" hint={`${roundsFor(settings.fillBots ? settings.teams : teams, settings.legs)} en total`}>
          {() => (
            <Segmented label="Ruedas" value={settings.legs} disabled={disabled} onChange={v => set({ legs: v })}
              options={[{ value: 2, label: 'Ida y vuelta' }, { value: 1, label: 'Solo ida' }]} />
          )}
        </Field>
        <Field label="Completar con bots" hint="Si no, juegan solo los DT de la sala.">
          {() => (
            <Segmented label="Bots" value={settings.fillBots ? 'yes' : 'no'} disabled={disabled} onChange={v => set({ fillBots: v === 'yes' })}
              options={[{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }]} />
          )}
        </Field>
        <Field label="Nivel de los bots" hint="Comparado con el promedio de los clubes de los amigos.">
          {(p) => (
            <select {...p} className={selectClass} disabled={disabled || !settings.fillBots} value={settings.difficulty} onChange={e => set({ difficulty: e.target.value })}>
              {Object.entries(DIFFICULTIES).map(([id, d]) => <option key={id} value={id}>{d.label}</option>)}
            </select>
          )}
        </Field>
      </div>
      <Field label="Reglamento" hint="Cambia cómo se reparten los puntos. El sorteo lo elige la AFA.">
        {(p) => (
          <select {...p} className={selectClass} disabled={disabled} value={settings.rulesId} onChange={e => set({ rulesId: e.target.value })}>
            {ROOM_RULESETS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            <option value="SORTEO">Sorpresa: que decida la AFA</option>
          </select>
        )}
      </Field>
      <p className="text-sm text-fg-muted">{settingsSummary(settings, humans)}</p>
    </div>
  )
}
