import React, { useState } from 'react'
import { Trophy, Users, ShieldAlert, Dumbbell } from 'lucide-react'
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter, Badge, Stat, Progress,
  Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogTrigger, DialogContent, DialogBody, DialogFooter, DialogClose,
  Field, Input, Select, Segmented, Switch, Tooltip, Skeleton, EmptyState, PageHeader, SectionTitle
} from '../../components/ui'

const SWATCHES = [
  ['bg', 'bg-bg'], ['surface', 'bg-surface'], ['surface-2', 'bg-surface-2'], ['surface-3', 'bg-surface-3'],
  ['line', 'bg-line-strong'], ['accent', 'bg-accent'], ['warning', 'bg-warning'], ['danger', 'bg-danger'], ['gold', 'bg-gold']
]

/** Catálogo vivo del sistema de diseño: referencia visual y base de las pruebas manuales de contraste/foco */
export default function DesignSystemScreen() {
  const [mentality, setMentality] = useState('balanced')
  const [notify, setNotify] = useState(true)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Sistema de diseño"
        title="El Pizarrón"
        description="Tokens, tipografía y componentes base. Un solo acento (verde cancha); el resto del color comunica estado."
        actions={<Button variant="outline" size="sm" asChild><a href="/dashboard">Volver al juego</a></Button>}
      />

      <div className="space-y-10">
        <section aria-labelledby="ds-color">
          <SectionTitle>Color</SectionTitle>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9" id="ds-color">
            {SWATCHES.map(([name, cls]) => (
              <li key={name}>
                <div className={`h-14 rounded-md border border-line ${cls}`} />
                <p className="mt-1.5 text-xs text-fg-muted">{name}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ds-type">
          <SectionTitle>Tipografía</SectionTitle>
          <Card>
            <CardBody className="space-y-3">
              <p className="font-display text-5xl font-semibold leading-none">Fecha 12 · Clásico del barrio</p>
              <p className="font-display text-3xl font-semibold leading-none">Titular de sección</p>
              <p className="text-base text-fg">Texto de lectura en Inter, 16 px, con buen contraste sobre las superficies oscuras.</p>
              <p className="text-sm text-fg-muted">Texto secundario para descripciones y ayudas.</p>
              <p className="eyebrow">Rótulo pequeño</p>
              <p className="num font-display text-4xl font-semibold">1.250.340</p>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="ds-buttons">
          <SectionTitle>Botones y etiquetas</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Disputar partido</Button>
            <Button variant="secondary">Ajustar táctica</Button>
            <Button variant="outline">Ver tabla</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger">Rescindir</Button>
            <Button loading>Guardando</Button>
            <Button disabled>Deshabilitado</Button>
            <Button size="icon" variant="outline" aria-label="Plantel"><Users /></Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="accent" dot>En forma</Badge>
            <Badge tone="warning" dot>Lesión leve</Badge>
            <Badge tone="danger" dot>Suspendido</Badge>
            <Badge tone="gold">Ídolo</Badge>
          </div>
        </section>

        <section aria-labelledby="ds-cards">
          <SectionTitle>Tarjetas y datos</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardBody className="grid grid-cols-2 gap-4">
                <Stat label="Caja" value="$94.916" delta={12} hint="vs. semana pasada" />
                <Stat label="Reputación" value="42" delta={-3} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Estado del plantel</CardTitle>
                  <CardDescription>18 de 20 aptos</CardDescription>
                </div>
                <ShieldAlert className="size-5 text-warning" aria-hidden="true" />
              </CardHeader>
              <CardBody className="space-y-3">
                <div><div className="mb-1.5 flex justify-between text-xs text-fg-muted"><span>Condición física</span><span className="num">82%</span></div><Progress auto value={82} label="Condición física" /></div>
                <div><div className="mb-1.5 flex justify-between text-xs text-fg-muted"><span>Moral</span><span className="num">48%</span></div><Progress auto value={48} label="Moral" /></div>
                <div><div className="mb-1.5 flex justify-between text-xs text-fg-muted"><span>Cohesión</span><span className="num">21%</span></div><Progress auto value={21} label="Cohesión" /></div>
              </CardBody>
              <CardFooter><Button variant="ghost" size="sm">Ver enfermería</Button></CardFooter>
            </Card>
            <Card><EmptyState icon={Trophy} title="Sin títulos todavía" description="Cuando ganes tu primer torneo aparecerá en la vitrina." action={<Button size="sm">Ver competición</Button>} /></Card>
          </div>
        </section>

        <section aria-labelledby="ds-forms">
          <SectionTitle>Formularios</SectionTitle>
          <Card>
            <CardBody className="grid gap-5 md:grid-cols-2">
              <Field label="Nombre del club" hint="Máximo 30 caracteres">{(p) => <Input placeholder="Atlético del Potrero" {...p} />}</Field>
              <Field label="Formación">{(p) => <Select {...p}><option>4-4-2</option><option>4-3-3</option><option>3-5-2</option></Select>}</Field>
              <Field label="Presupuesto" error="Supera el tope salarial de la categoría">{(p) => <Input defaultValue="999999" {...p} />}</Field>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-fg">Mentalidad</p>
                <Segmented label="Mentalidad" value={mentality} onChange={setMentality} options={[{ value: 'def', label: 'Defensiva' }, { value: 'balanced', label: 'Equilibrada' }, { value: 'att', label: 'Ofensiva' }]} />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm font-medium text-fg">
                Avisos de partido
                <Switch checked={notify} onCheckedChange={setNotify} aria-label="Avisos de partido" />
              </label>
              <div className="flex items-center gap-3">
                <Tooltip content="Intensidad de entrenamiento semanal"><Button variant="outline" size="icon" aria-label="Ayuda de entrenamiento"><Dumbbell /></Button></Tooltip>
                <span className="text-sm text-fg-muted">Pasá el mouse o enfocá el botón</span>
              </div>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="ds-nav">
          <SectionTitle>Pestañas y superposiciones</SectionTitle>
          <Tabs defaultValue="gestion">
            <TabsList>
              <TabsTrigger value="gestion">Gestión y staff</TabsTrigger>
              <TabsTrigger value="historia">Historia</TabsTrigger>
              <TabsTrigger value="records">Récords y leyendas</TabsTrigger>
              <TabsTrigger value="vestuario">Vestuario</TabsTrigger>
            </TabsList>
            <TabsContent value="gestion"><p className="text-sm text-fg-muted">Contenido de la pestaña de gestión.</p></TabsContent>
            <TabsContent value="historia"><p className="text-sm text-fg-muted">Línea de tiempo del club.</p></TabsContent>
            <TabsContent value="records"><p className="text-sm text-fg-muted">Récords y camisetas retiradas.</p></TabsContent>
            <TabsContent value="vestuario"><p className="text-sm text-fg-muted">Jerarquía y cohesión.</p></TabsContent>
          </Tabs>

          <div className="mt-5 flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Abrir diálogo (escritorio)</Button></DialogTrigger>
              <DialogContent title="Renovar contrato" description="Ramiro Benítez · 24 años · Delantero" size="md">
                <DialogBody className="grid gap-4 sm:grid-cols-2">
                  <Field label="Años">{(p) => <Select {...p}><option>1</option><option>2</option><option>3</option></Select>}</Field>
                  <Field label="Salario semanal">{(p) => <Input defaultValue="420" {...p} />}</Field>
                </DialogBody>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button>Ofrecer contrato</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section aria-labelledby="ds-loading">
          <SectionTitle>Carga</SectionTitle>
          <Card><CardBody className="space-y-3"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></CardBody></Card>
        </section>
      </div>
    </main>
  )
}
