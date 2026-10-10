import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { api } = vi.hoisted(() => ({
  api: { getBallot: vi.fn(), castVote: vi.fn(), getStandings: vi.fn() }
}))
vi.mock('../../src/api/leagueVote', () => ({ leagueVoteApi: { getBallot: api.getBallot, castVote: api.castVote } }))
vi.mock('../../src/api/competition', () => ({ competitionApi: { getStandings: api.getStandings } }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import AssemblyCard from '../../src/features/season/AssemblyCard'

const club = { id: 'me' }

describe('Asamblea de la AFA en la gala', () => {
  beforeEach(() => {
    api.getBallot.mockReset().mockResolvedValue({ ballot: ['CERO_CERO', 'EXPRESS', 'GUILLOTINA'], vote: null })
    api.getStandings.mockReset().mockResolvedValue([{ club_id: 'me' }, { club_id: 'r1', clubs: { name: 'Banfield' } }])
    api.castVote.mockReset().mockResolvedValue({
      ballot: ['CERO_CERO', 'EXPRESS', 'GUILLOTINA'], counts: { CERO_CERO: 12, EXPRESS: 5, GUILLOTINA: 3 }, winner: 'CERO_CERO',
      botVotes: [{ clubId: 'r1', quip: 'El DT de Banfield votó con un sobre en la mano.' }], rules: {}
    })
  })

  it('muestra las 3 propuestas, avisa que hay que votar y, al votar, muestra el escrutinio y el ganador', async () => {
    const onStatus = vi.fn()
    render(<AssemblyCard club={club} nextYear={2027} onStatus={onStatus} />)
    expect(await screen.findByText('Cero a cero prohibido')).toBeInTheDocument()
    expect(screen.getByText('La guillotina')).toBeInTheDocument()
    await waitFor(() => expect(onStatus).toHaveBeenLastCalledWith('ready'))

    await userEvent.click(screen.getAllByRole('button', { name: /votar esta/i })[0])
    expect(await screen.findByText(/12 votos/)).toBeInTheDocument()
    expect(api.castVote).toHaveBeenCalledWith(expect.objectContaining({ clubId: 'me', seasonYear: 2027, choice: 'CERO_CERO', rivals: [{ id: 'r1', name: 'Banfield' }] }))
    expect(screen.getByText(/El DT de Banfield votó/)).toBeInTheDocument()
    expect(onStatus).toHaveBeenLastCalledWith('done')
  })

  it('si no se puede cargar la boleta no estorba el cierre', async () => {
    api.getBallot.mockRejectedValue(new Error('sin red'))
    const onStatus = vi.fn()
    const { container } = render(<AssemblyCard club={club} nextYear={2027} onStatus={onStatus} />)
    await waitFor(() => expect(onStatus).toHaveBeenLastCalledWith('failed'))
    expect(container).toBeEmptyDOMElement()
  })
})
