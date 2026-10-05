vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { buildYouthProspect, nextFreeShirtNumber } from '../../src/api/player'

// Columnas NOT NULL sin valor por defecto de `players` (consultadas en la base)
const REQUIRED = ['club_id', 'first_name', 'last_name', 'age', 'nationality', 'shirt_number', 'position', 'attr_pace', 'attr_acceleration', 'attr_strength', 'attr_stamina', 'attr_technique', 'attr_passing', 'attr_control', 'attr_dribbling', 'attr_finishing', 'attr_shooting', 'attr_heading', 'attr_marking', 'attr_tackling', 'attr_positioning', 'attr_vision', 'attr_decisions', 'attr_mentality', 'attr_concentration', 'attr_leadership', 'attr_aggression', 'attr_professionalism', 'contract_wage', 'contract_years', 'market_value', 'squad_role']

describe('juvenil de la academia', () => {
  it('trae todos los campos obligatorios de players (incluida la nacionalidad)', () => {
    for (let i = 0; i < 50; i++) {
      const row = buildYouthProspect({ clubId: 'c1', academyLevel: 2, shirtNumber: 21 })
      for (const col of REQUIRED) expect(row[col], col).not.toBeNull()
      for (const col of REQUIRED) expect(row[col], col).not.toBeUndefined()
      expect(row.is_youth).toBe(true)
      expect(row.age).toBeGreaterThanOrEqual(16)
      expect(row.age).toBeLessThanOrEqual(17)
    }
  })

  it('usa la nacionalidad del club y un potencial que crece con la academia', () => {
    expect(buildYouthProspect({ clubId: 'c', shirtNumber: 21, nationality: 'Uruguay' }).nationality).toBe('Uruguay')
    const low = Math.min(...Array.from({ length: 40 }, () => buildYouthProspect({ clubId: 'c', academyLevel: 1, shirtNumber: 21 }).attr_potential))
    const high = Math.max(...Array.from({ length: 40 }, () => buildYouthProspect({ clubId: 'c', academyLevel: 5, shirtNumber: 21 }).attr_potential))
    expect(high).toBeGreaterThan(low)
  })

  it('elige el primer dorsal libre desde el 21', () => {
    expect(nextFreeShirtNumber([])).toBe(21)
    expect(nextFreeShirtNumber([1, 2, 21, 22])).toBe(23)
  })
})
