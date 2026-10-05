import React, { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import {
  Button, Badge, Stat, Progress, Field, Input, Segmented, Switch, EmptyState,
  Dialog, DialogTrigger, DialogContent, DialogBody, DialogFooter, DialogClose,
  Tabs, TabsList, TabsTrigger, TabsContent, PageHeader
} from '../../src/components/ui'

describe('Button', () => {
  it('en estado de carga se deshabilita, anuncia aria-busy y no dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('con asChild renderiza el elemento hijo (por ejemplo un enlace)', () => {
    render(<Button asChild><a href="/club">Ir al club</a></Button>)
    expect(screen.getByRole('link', { name: 'Ir al club' })).toHaveAttribute('href', '/club')
  })
})

describe('Stat y Progress', () => {
  it('Stat comunica la variación con texto además del color', () => {
    render(<Stat label="Reputación" value="42" delta={-3} />)
    expect(screen.getByText('baja')).toBeInTheDocument()
    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('Progress expone role=progressbar con valor acotado a 0-100', () => {
    render(<Progress value={140} label="Condición física" />)
    const bar = screen.getByRole('progressbar', { name: 'Condición física' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('Badge muestra el contenido', () => {
    render(<Badge tone="warning" dot>Lesionado</Badge>)
    expect(screen.getByText('Lesionado')).toBeInTheDocument()
  })
})

describe('Field', () => {
  it('asocia etiqueta, ayuda y error con el control por ARIA', () => {
    render(
      <Field label="Nombre del club" hint="Máximo 30 caracteres" error="Es obligatorio">
        {(props) => <Input {...props} />}
      </Field>
    )
    const input = screen.getByLabelText('Nombre del club')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Es obligatorio')
    expect(screen.getByRole('alert')).toHaveTextContent('Es obligatorio')
  })
})

describe('Segmented', () => {
  const Demo = () => {
    const [v, setV] = useState('a')
    return <Segmented label="Mentalidad" value={v} onChange={setV} options={[{ value: 'a', label: 'Defensiva' }, { value: 'b', label: 'Equilibrada' }, { value: 'c', label: 'Ofensiva' }]} />
  }

  it('se opera con teclado (flechas) y marca la opción activa con aria-checked', async () => {
    render(<Demo />)
    const group = screen.getByRole('radiogroup', { name: 'Mentalidad' })
    const first = within(group).getByRole('radio', { name: 'Defensiva' })
    expect(first).toHaveAttribute('aria-checked', 'true')
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(within(group).getByRole('radio', { name: 'Equilibrada' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(within(group).getByRole('radio', { name: 'Ofensiva' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Switch, Tabs y EmptyState', () => {
  it('Switch alterna su estado', async () => {
    const onChange = vi.fn()
    render(<Switch aria-label="Notificaciones" onCheckedChange={onChange} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Notificaciones' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('Tabs cambia de panel al elegir una pestaña', async () => {
    render(
      <Tabs defaultValue="uno">
        <TabsList><TabsTrigger value="uno">Uno</TabsTrigger><TabsTrigger value="dos">Dos</TabsTrigger></TabsList>
        <TabsContent value="uno">Contenido uno</TabsContent>
        <TabsContent value="dos">Contenido dos</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Contenido uno')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Dos' }))
    expect(screen.getByText('Contenido dos')).toBeInTheDocument()
  })

  it('EmptyState muestra título, descripción y acción', () => {
    render(<EmptyState title="Sin ofertas" description="Todavía no hay propuestas." action={<Button>Buscar vacantes</Button>} />)
    expect(screen.getByRole('heading', { name: 'Sin ofertas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar vacantes' })).toBeInTheDocument()
  })
})

describe('Dialog', () => {
  it('abre con título accesible, se cierra con Esc y devuelve el foco al disparador', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild><Button>Abrir</Button></DialogTrigger>
        <DialogContent title="Renovar contrato" description="Define años y salario">
          <DialogBody>Contenido</DialogBody>
          <DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    )
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Renovar contrato' })
    expect(dialog).toHaveAccessibleDescription('Define años y salario')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('PageHeader', () => {
  it('muestra título h1 y el botón de volver con nombre accesible', () => {
    render(<MemoryRouter><PageHeader title="Plantel" description="Gestión de jugadores" backTo="/dashboard" /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Plantel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })
})
