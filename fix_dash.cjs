const fs = require('fs')

let code = fs.readFileSync('src/features/dashboard/Dashboard.jsx', 'utf8')

// We will change the layout structure in the return statement.
// The primaryAction is currently rendered at the top in mobile. We'll move it into Next Fixture? 
// The proposal says "Próximo partido con la acción principal".
// I'll keep the current primaryAction buttons but place them nicely.

// First, I'll extract everything in the return down to the end of the file, then re-compose it.
// Since it's complex, I'll use regex to isolate the `return (` block.

const newReturn = `
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow={\`\${formatLongDate(clubSummary.gameDate)} · \${divisionName(club?.league_tier)}\`}
        title={clubSummary.name}
        description={\`\${clubSummary.city}, \${clubSummary.country} · \${clubSummary.stadiumName}\`}
        className="hidden lg:flex"
      />

      {/* En móvil el título vive en la barra superior */}
      <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
        <p className="min-w-0 truncate text-sm text-fg-muted">{clubSummary.city} · {clubSummary.stadiumName}</p>
      </div>

      <div className="min-w-0 space-y-6">
        
        {/* 1. Próximo partido con acción principal */}
        <Card className="border-accent shadow-md shadow-accent/5">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="size-5 text-accent" aria-hidden="true" />
              <CardTitle>Próximo compromiso</CardTitle>
            </div>
            {nextFixture && <Badge className="num">Fecha {nextFixture.match_week || 1}</Badge>}
          </CardHeader>
          <CardBody>
            {seasonEnded ? (
              <div className="py-6 flex flex-col items-start gap-4">
                <div>
                  <p className="font-display text-xl font-semibold text-fg">Fin de Temporada</p>
                  <p className="mt-1 max-w-prose text-sm text-fg-muted">La temporada ha finalizado. Es momento de hacer balance.</p>
                </div>
                {primaryAction}
              </div>
            ) : nextFixture ? (
              <>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                    <Crest name={nextFixture.home?.name} highlight={nextFixture.home_team_id === club.id} />
                    <p className="max-w-full truncate text-sm font-semibold text-fg">{nextFixture.home?.name || 'Local'}</p>
                    <p className="eyebrow">{nextFixture.home_team_id === club.id ? 'Tu club' : 'Rival'}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="rounded-lg bg-surface px-3 py-1 text-sm font-bold tracking-widest text-fg shadow-sm border border-line">VS</div>
                    <span className="mt-2 block text-[11px] font-medium uppercase tracking-wider text-fg-muted">{isHome ? 'Local' : 'Visitante'}</span>
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                    <Crest name={nextFixture.away?.name} highlight={nextFixture.away_team_id === club.id} />
                    <p className="max-w-full truncate text-sm font-semibold text-fg">{nextFixture.away?.name || 'Visitante'}</p>
                    <p className="eyebrow">{nextFixture.away_team_id === club.id ? 'Tu club' : 'Rival'}</p>
                  </div>
                </div>

                {rival && (
                  <p className="flex flex-wrap items-center justify-center gap-2 border-t border-line py-3 text-sm text-fg-muted" data-testid="rival-level">
                    <Badge tone={rival.tone}>Rival: {rival.label} · nivel {rival.level}</Badge>
                    <span>{rival.hint}</span>
                  </p>
                )}

                <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {primaryAction}
                    <Button asChild variant="outline"><Link to="/tactics">Ajustar táctica</Link></Button>
                  </div>
                  {matchFuture && (
                    <p id="match-reason" className="text-sm text-fg-muted">
                      Se juega en {daysToMatch} {daysToMatch === 1 ? 'día' : 'días'}.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col items-start gap-4">
                <div>
                  <p className="font-display text-xl font-semibold text-fg">Pretemporada</p>
                  <p className="mt-1 max-w-prose text-sm text-fg-muted">No hay compromisos oficiales agendados. Aprovecha para entrenar y cerrar fichajes.</p>
                </div>
                {primaryAction}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2. Fila de cuatro datos */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link to="/squad" className="block p-4 rounded-xl border border-line bg-surface hover:border-accent transition-colors">
            <p className="text-xs text-fg-muted mb-1 flex items-center gap-1.5"><Activity className="size-3.5" /> Plantel</p>
            <p className="font-semibold text-fg">{squadHealth.availableCount}/{squadHealth.totalPlayers} aptos</p>
            <p className="text-xs text-fg-subtle mt-1">{squadHealth.averageFitness}% fís. · {squadHealth.averageMorale}% mor.</p>
          </Link>
          <Link to="/finances" className="block p-4 rounded-xl border border-line bg-surface hover:border-accent transition-colors">
            <p className="text-xs text-fg-muted mb-1 flex items-center gap-1.5"><Wallet className="size-3.5" /> Finanzas</p>
            <p className={cn("font-semibold", financesSummary.balance < 0 ? "text-danger" : "text-fg")}>{formatMoney(financesSummary.balance)}</p>
            <p className="text-xs text-fg-subtle mt-1">{formatMoney(financesSummary.weeklyWageBill)}/sem sueldos</p>
          </Link>
          <Link to="/standings" className="block p-4 rounded-xl border border-line bg-surface hover:border-accent transition-colors">
            <p className="text-xs text-fg-muted mb-1 flex items-center gap-1.5"><ListOrdered className="size-3.5" /> Posición</p>
            <p className="font-semibold text-fg">{standingsSnippet?.rank ? \`\${standingsSnippet.rank}º\` : '?'}</p>
            <p className="text-xs text-fg-subtle mt-1">{standingsSnippet?.points || 0} pts · {standingsSnippet?.played || 0} PJ</p>
          </Link>
          <Link to="/manager" className="block p-4 rounded-xl border border-line bg-surface hover:border-accent transition-colors">
            <p className="text-xs text-fg-muted mb-1 flex items-center gap-1.5"><Shield className="size-3.5" /> Carrera</p>
            <p className="font-semibold text-fg">Nivel {managerSummary.level}</p>
            <p className="text-xs text-fg-subtle mt-1">{managerSummary.reputation} reputación</p>
          </Link>
        </div>

        {/* 3. Avisos + Eventos */}
        {/* Aquí insertaremos un aviso extra para los eventos pendientes */}
        <AlertList alerts={
          pendingEvents?.length > 0
            ? [{
                id: 'pending-events',
                type: 'urgent',
                title: 'Tenés una decisión pendiente',
                description: 'La dirigencia o el plantel esperan tu respuesta.',
                action: 'Resolver',
                href: '/events'
              }, ...urgentAlerts]
            : urgentAlerts
        } />

        {/* 4. Clima y bitácora (plegados en móvil: en CSS usamos details/summary o similar, pero por ahora lo dejamos en grid) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <details className="group lg:hidden rounded-xl border border-line bg-surface">
            <summary className="p-4 font-semibold text-fg cursor-pointer select-none">Clima del club</summary>
            <div className="p-4 pt-0">
              <ClimatePanel key={\`climate-\${reloadTick}\`} club={club} gameDate={clubSummary.gameDate} />
            </div>
          </details>
          <details className="group lg:hidden rounded-xl border border-line bg-surface">
            <summary className="p-4 font-semibold text-fg cursor-pointer select-none">Últimos sucesos</summary>
            <div className="p-4 pt-0">
              <ConsequenceFeed key={\`feed-\${reloadTick}\`} clubId={club?.id} />
            </div>
          </details>

          {/* Versión Desktop */}
          <div className="hidden lg:block">
            <ClimatePanel key={\`climate-desktop-\${reloadTick}\`} club={club} gameDate={clubSummary.gameDate} />
          </div>
          <div className="hidden lg:block">
            <ConsequenceFeed key={\`feed-desktop-\${reloadTick}\`} clubId={club?.id} />
          </div>
        </div>

      </div>

      {showSeasonCloseModal && (
        <SeasonCloseModal
          club={club}
          manager={manager}
          careerId={club?.career_id}
          seasonYear={seasonYearOf(clubSummary.gameDate)}
          onClose={() => setShowSeasonCloseModal(false)}
          onSuccess={() => { queryCache.clear() }}
        />
      )}
    </div>
  )
}
`

code = code.replace(/return \(\s*<div className="mx-auto max-w-6xl[\s\S]+/, newReturn)
fs.writeFileSync('src/features/dashboard/Dashboard.jsx', code, 'utf8')
