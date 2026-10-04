DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS tactics CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS managers CASCADE;
-- Script para crear la tabla de managers en Supabase

CREATE TABLE IF NOT EXISTS public.managers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  reputation int DEFAULT 10,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age int NOT NULL,
  nationality text NOT NULL,
  city text NOT NULL,
  dominant_foot text NOT NULL,
  philosophy text NOT NULL,
  attr_leadership int NOT NULL,
  attr_tactics int NOT NULL,
  attr_motivation int NOT NULL,
  attr_management int NOT NULL,
  attr_youth int NOT NULL,
  attr_negotiation int NOT NULL,
  attr_locker_room int NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Pol铆ticas de seguridad
CREATE POLICY "Los usuarios pueden ver su propio manager" 
  ON public.managers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar su propio manager" 
  ON public.managers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar su propio manager" 
  ON public.managers FOR UPDATE 
  USING (auth.uid() = user_id);


-- Script para crear la tabla de clubs

CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  founded_year int NOT NULL,
  colors text NOT NULL,
  nickname text,
  history_type text NOT NULL,
  budget numeric DEFAULT 0,
  wage_budget numeric DEFAULT 0,
  reputation int DEFAULT 10,
  stadium_name text NOT NULL,
  stadium_capacity int DEFAULT 1000,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Asumimos que el manager_id pertenece al usuario actual a trav閟 de joins, pero para MVP permitimos leer todo
CREATE POLICY "Permitir leer todos los clubes" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Permitir insertar clubes" ON public.clubs FOR INSERT WITH CHECK (true);



-- Script para crear la tabla de jugadores

CREATE TABLE IF NOT EXISTS public.players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age int NOT NULL,
  nationality text NOT NULL,
  shirt_number int NOT NULL,
  position text NOT NULL,
  
  -- Physical
  attr_pace int NOT NULL,
  attr_acceleration int NOT NULL,
  attr_strength int NOT NULL,
  attr_stamina int NOT NULL,
  
  -- Technical
  attr_technique int NOT NULL,
  attr_passing int NOT NULL,
  attr_control int NOT NULL,
  attr_dribbling int NOT NULL,
  attr_finishing int NOT NULL,
  attr_shooting int NOT NULL,
  attr_heading int NOT NULL,
  attr_marking int NOT NULL,
  attr_tackling int NOT NULL,
  
  -- Mental
  attr_positioning int NOT NULL,
  attr_vision int NOT NULL,
  attr_decisions int NOT NULL,
  attr_mentality int NOT NULL,
  attr_concentration int NOT NULL,
  attr_leadership int NOT NULL,
  attr_aggression int NOT NULL,
  attr_professionalism int NOT NULL,
  
  -- State
  state_fitness int DEFAULT 100,
  state_morale int DEFAULT 100,
  state_form int DEFAULT 5,
  is_injured boolean DEFAULT false,
  is_suspended boolean DEFAULT false,
  
  -- Contract
  contract_wage numeric NOT NULL,
  contract_years int NOT NULL,
  market_value numeric NOT NULL,
  release_clause numeric,
  squad_role text NOT NULL,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer todos los jugadores" ON public.players FOR SELECT USING (true);
CREATE POLICY "Permitir insertar jugadores" ON public.players FOR INSERT WITH CHECK (true);



-- ALTER TABLE public.clubs ADD COLUMN game_date date DEFAULT '2026-07-01';



-- Script para crear la tabla de t醕ticas
CREATE TABLE IF NOT EXISTS public.tactics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) NOT NULL,
  formation text DEFAULT '4-4-2',
  mentality text DEFAULT 'Equilibrada',
  pressure text DEFAULT 'Media',
  tempo text DEFAULT 'Normal',
  defensive_line text DEFAULT 'Media',
  build_up text DEFAULT 'Mixta',
  lineup jsonb DEFAULT '[]', -- Array de player_ids para los 11 titulares
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tactics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer t醕ticas" ON public.tactics FOR SELECT USING (true);
CREATE POLICY "Permitir insertar t醕ticas" ON public.tactics FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar t醕ticas" ON public.tactics FOR UPDATE USING (true);



-- Script para tabla de competiciones
CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  level int DEFAULT 1,
  teams_count int DEFAULT 20,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Script para standings (posiciones)
CREATE TABLE IF NOT EXISTS public.standings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id uuid REFERENCES public.competitions(id) NOT NULL,
  club_id uuid REFERENCES public.clubs(id) NOT NULL,
  played int DEFAULT 0,
  won int DEFAULT 0,
  drawn int DEFAULT 0,
  lost int DEFAULT 0,
  goals_for int DEFAULT 0,
  goals_against int DEFAULT 0,
  points int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (competition_id, club_id)
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer competiciones" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Permitir insertar competiciones" ON public.competitions FOR INSERT WITH CHECK (true);

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer standings" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Permitir actualizar standings" ON public.standings FOR UPDATE USING (true);
CREATE POLICY "Permitir insertar standings" ON public.standings FOR INSERT WITH CHECK (true);




-- Fase 14 & 15: Contratos y Ofertas
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS contract_salary int DEFAULT 10000;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS contract_end date;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS contract_role text DEFAULT 'Rotaci髇';

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) NOT NULL,
  from_club_id uuid REFERENCES public.clubs(id),
  to_club_id uuid REFERENCES public.clubs(id),
  amount int NOT NULL,
  status text DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Permitir insertar offers" ON public.offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar offers" ON public.offers FOR UPDATE USING (true);



-- Fase 16 & 17: Agentes y Scouting
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  greed int DEFAULT 50,
  influence int DEFAULT 50,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS attr_potential int DEFAULT 70;

CREATE TABLE IF NOT EXISTS public.scout_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) NOT NULL,
  player_id uuid REFERENCES public.players(id) NOT NULL,
  level int DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (club_id, player_id)
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo agents" ON public.agents FOR ALL USING (true);

ALTER TABLE public.scout_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo scout" ON public.scout_reports FOR ALL USING (true);



-- Fase 18 & 19: Inferiores y Staff
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS academy_level int DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id),
  name text NOT NULL,
  role text NOT NULL,
  level int DEFAULT 1,
  salary int DEFAULT 1000,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_youth boolean DEFAULT false;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo staff" ON public.staff FOR ALL USING (true);



-- Fase 20 & 21: Econom韆 y Estadio
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS debt int DEFAULT 0;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS stadium_level int DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS stadium_condition int DEFAULT 100;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS medical_level int DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS store_level int DEFAULT 1;



-- Fase 22 & 23: Hinchada y Dirigencia
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS board_confidence int DEFAULT 80;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS fans_confidence int DEFAULT 80;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS season_objective text DEFAULT 'Mitad de tabla';



-- Fase 24 & 25: Prensa y Vestuario
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS cohesion int DEFAULT 50;
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS authority int DEFAULT 50;



-- Fase 26 & 27: Personalidades y Lesiones
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS personality text DEFAULT 'Profesional';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS injury_days int DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS injury_type text;



-- Fase 28 & 29: Evoluci髇 y Temporadas
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_retired boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.season_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id),
  season_year int NOT NULL,
  position int,
  matches_won int DEFAULT 0,
  matches_drawn int DEFAULT 0,
  matches_lost int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.season_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo season history" ON public.season_history FOR ALL USING (true);



-- Fase 30 & 31: Ascensos y Carrera DT
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS league_tier int DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.manager_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id),
  club_name text,
  start_year int,
  end_year int,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.manager_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager history" ON public.manager_history FOR ALL USING (true);



-- Fase 32 & 33: Reputaci髇 y Selecciones
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS reputation_level text DEFAULT 'Local';
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_national_team boolean DEFAULT false;
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS national_team_id uuid REFERENCES public.clubs(id);



-- Fase 34 & 35: Copas Internacionales y Eventos
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS in_international_cup boolean DEFAULT false;



-- Fase 36 & 37: Historia e 蚫olos
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_idol boolean DEFAULT false;



-- Fase 38, 39 & 40: Sal髇 de Fama, Logros y Endgame
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}';
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS is_retired boolean DEFAULT false;





-- Fase 2: Game Config
CREATE TABLE IF NOT EXISTS public.game_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    category text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fase 2: Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    who_id uuid NOT NULL,
    what_action text NOT NULL,
    entity_type text,
    entity_id uuid,
    state_before jsonb,
    state_after jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_who ON public.audit_log(who_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(what_action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- Fase 2: DB Cleanup - updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON public.managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_tactics_updated_at BEFORE UPDATE ON public.tactics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON public.standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_scout_reports_updated_at BEFORE UPDATE ON public.scout_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.season_history ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_season_history_updated_at BEFORE UPDATE ON public.season_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.manager_history ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE TRIGGER update_manager_history_updated_at BEFORE UPDATE ON public.manager_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




-- Fase 10: Match History
CREATE TABLE IF NOT EXISTS public.match_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) NOT NULL,
    opponent_name text NOT NULL,
    home_score int NOT NULL,
    away_score int NOT NULL,
    is_home boolean NOT NULL,
    match_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_history_club ON public.match_history(club_id);


-- Fase 05: Level Config
CREATE TABLE IF NOT EXISTS public.level_config (
    level int PRIMARY KEY,
    xp_required int NOT NULL,
    unlocks jsonb DEFAULT '{}'::jsonb
);


-- Fase 02: DT Attributes
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS specialization text;


-- Fase 12: Competition Engine
ALTER TABLE public.clubs ALTER COLUMN manager_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.fixtures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) NOT NULL,
    match_week int NOT NULL,
    home_team_id uuid REFERENCES public.clubs(id) NOT NULL,
    away_team_id uuid REFERENCES public.clubs(id) NOT NULL,
    status text DEFAULT 'PENDING',
    home_score int DEFAULT 0,
    away_score int DEFAULT 0,
    match_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- Fase 01: Inicio de Sesi贸n, Autenticaci贸n y Aislamiento de Carreras
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.careers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  status text DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ABANDONED, CORRUPTED
  ruleset_version text DEFAULT '3.0.0',
  balance_version text DEFAULT '1.0.0',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir carreras propias" ON public.careers 
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  device_fingerprint text,
  ip_address text,
  active_career_id uuid REFERENCES public.careers(id),
  expires_at timestamp with time zone,
  is_revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir sesiones propias" ON public.user_sessions 
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL, -- USER_REGISTERED, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_RESET_REQ, SESSION_REVOKED
  ip_address text,
  user_agent text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insertar audit seguridad" ON public.security_audit_log 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir ver audit propio" ON public.security_audit_log 
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Fase 02: Creaci贸n del DT, Presets y Restricci贸n de Unicidad
-- ============================================================================

ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS background text DEFAULT 'STREET_COACH';
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_manager_per_user ON public.managers(user_id) WHERE is_retired = false;

-- ============================================================================
-- Fase 03: Fundaci贸n del Club, Estadio y Balance Tier 5
-- ============================================================================

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS pitch_condition int DEFAULT 60;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS ticket_price numeric DEFAULT 10.0;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_user_club boolean DEFAULT true;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#047857';
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#FFFFFF';
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS badge_id text DEFAULT 'SHIELD';

-- ============================================================================
-- Fase 04: Generaci贸n del Primer Plantel y Dorsales 脷nicos
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_club_jersey_number ON public.players(club_id, shirt_number);

-- ============================================================================
-- Fase 05: Niveles y Progresi贸n del DT, Ledger de XP y Perks
-- ============================================================================

ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS unallocated_perk_points int DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.manager_xp_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) NOT NULL,
  source_type text NOT NULL,
  source_entity_id text,
  xp_awarded int NOT NULL,
  level_before int NOT NULL,
  level_after int NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_manager_xp_source ON public.manager_xp_ledger(manager_id, source_type, source_entity_id);

CREATE TABLE IF NOT EXISTS public.manager_unlocked_perks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) NOT NULL,
  perk_code text NOT NULL,
  acquired_at_level int NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (manager_id, perk_code)
);

-- ============================================================================
-- Fase 07: Calendario, Motor de Tiempo y Avance Semanal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.career_calendar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  current_season_year int DEFAULT 2026 NOT NULL,
  current_week int DEFAULT 1 NOT NULL,
  current_date date DEFAULT '2026-07-01' NOT NULL,
  season_phase text DEFAULT 'PRE_SEASON' NOT NULL,
  transfer_window_open boolean DEFAULT true NOT NULL,
  is_advancing boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_valid_week CHECK (current_week BETWEEN 1 AND 53)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_career_calendar_career_id ON public.career_calendar(career_id);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  season_year int NOT NULL,
  week_number int NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL, -- LEAGUE_MATCH, CUP_MATCH, FRIENDLY, TRANSFER_DEADLINE, SALARY_PAYMENT, YOUTH_INTAKE, BOARD_MEETING
  title text NOT NULL,
  description text,
  entity_id uuid,
  is_completed boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_career_week ON public.calendar_events(career_id, season_year, week_number);

CREATE TABLE IF NOT EXISTS public.time_advance_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid,
  week_advanced_from int NOT NULL,
  week_advanced_to int NOT NULL,
  financials_processed boolean DEFAULT true,
  fixtures_simulated_count int DEFAULT 0,
  injuries_updated_count int DEFAULT 0,
  duration_ms int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.career_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leer y actualizar calendar" ON public.career_calendar FOR ALL USING (true);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir calendar_events" ON public.calendar_events FOR ALL USING (true);

ALTER TABLE public.time_advance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir time_advance_log" ON public.time_advance_log FOR ALL USING (true);

-- ============================================================================
-- Fase 08: Entrenamiento, Preparacion Fisica y Desarrollo Individual
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_training_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  general_focus text DEFAULT 'BALANCED' NOT NULL,
  intensity_level text DEFAULT 'MEDIUM' NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_training_plan UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.player_training_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  focus_attribute text NOT NULL,
  retraining_position text,
  familiarity_percentage int DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_training_assignment UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.training_execution_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  focus_applied text NOT NULL,
  intensity_applied text NOT NULL,
  average_stamina_cost numeric DEFAULT 0,
  injuries_sustained int DEFAULT 0,
  attributes_improved_count int DEFAULT 0,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_training_club_week UNIQUE (club_id, week_number)
);

ALTER TABLE public.club_training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir club_training_plans" ON public.club_training_plans FOR ALL USING (true);

ALTER TABLE public.player_training_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir player_training_assignments" ON public.player_training_assignments FOR ALL USING (true);

ALTER TABLE public.training_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir training_execution_logs" ON public.training_execution_logs FOR ALL USING (true);

-- ============================================================================
-- Fase 09: Tacticas, Formaciones, Pizarra y Afinidad Posicional
-- ============================================================================

ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS slot_number int DEFAULT 1;
ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS passing_style text DEFAULT 'MIXED';
ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS width text DEFAULT 'BALANCED';
ALTER TABLE public.tactics ADD COLUMN IF NOT EXISTS pressing_intensity text DEFAULT 'BALANCED';

CREATE UNIQUE INDEX IF NOT EXISTS uq_club_tactic_slot ON public.tactics(club_id, slot_number);

CREATE TABLE IF NOT EXISTS public.tactic_lineup_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tactic_id uuid REFERENCES public.tactics(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id),
  pitch_position text NOT NULL,
  player_role text DEFAULT 'DEFAULT',
  is_starter boolean DEFAULT true NOT NULL,
  order_index int DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tactics_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid,
  tactic_id uuid,
  formation_applied text NOT NULL,
  lineup_snapshot jsonb DEFAULT '[]'::jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tactic_lineup_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tactic_lineup_slots" ON public.tactic_lineup_slots FOR ALL USING (true);

ALTER TABLE public.tactics_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tactics_audit_log" ON public.tactics_audit_log FOR ALL USING (true);

-- ============================================================================
-- Fase 10: Motor de Simulacion de Partidos y Direccion en Vivo
-- ============================================================================

ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS current_minute int DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS seed text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS match_stats jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS simulation_payload jsonb;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS finished_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  minute int NOT NULL,
  event_type text NOT NULL, -- GOAL, CARD_YELLOW, CARD_RED, INJURY, SAVE, CORNER, MISS
  club_id uuid,
  player_id uuid,
  assist_player_id uuid,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_events_fixture ON public.match_events(fixture_id, minute);

CREATE TABLE IF NOT EXISTS public.match_interventions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  minute int NOT NULL,
  intervention_type text NOT NULL, -- SHOUT, SUBSTITUTION, TACTIC_CHANGE
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir match_events" ON public.match_events FOR ALL USING (true);

ALTER TABLE public.match_interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir match_interventions" ON public.match_interventions FOR ALL USING (true);

-- ============================================================================
-- Fase 11: Resumen Post-Partido, Calificaciones, Taquilla y Secciones Mobile
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.match_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  home_club_id uuid REFERENCES public.clubs(id),
  away_club_id uuid REFERENCES public.clubs(id),
  final_score text NOT NULL,
  attendance int DEFAULT 0 NOT NULL,
  gate_receipts_gross numeric DEFAULT 0 NOT NULL,
  match_xp_awarded int DEFAULT 0 NOT NULL,
  mvp_player_id uuid REFERENCES public.players(id),
  manager_press_quote text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_match_report_fixture UNIQUE (fixture_id)
);

CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  minutes_played int DEFAULT 90 NOT NULL,
  rating numeric DEFAULT 6.0 NOT NULL,
  goals int DEFAULT 0 NOT NULL,
  assists int DEFAULT 0 NOT NULL,
  yellow_cards int DEFAULT 0 NOT NULL,
  red_cards int DEFAULT 0 NOT NULL,
  fitness_after_match int DEFAULT 80 NOT NULL,
  morale_delta int DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_match_stats_fixture ON public.player_match_stats(fixture_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON public.player_match_stats(player_id);

ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir match_reports" ON public.match_reports FOR ALL USING (true);

ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir player_match_stats" ON public.player_match_stats FOR ALL USING (true);

-- ============================================================================
-- Fase 12: Competicion de Liga, Tabla de Posiciones y Criterios de Desempate
-- ============================================================================

ALTER TABLE public.clubs ALTER COLUMN manager_id DROP NOT NULL;

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS division_tier int DEFAULT 5;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS season_year int DEFAULT 2026;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS total_match_days int DEFAULT 38;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS current_match_day int DEFAULT 1;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS goal_difference int DEFAULT 0;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS form text DEFAULT 'E';

CREATE UNIQUE INDEX IF NOT EXISTS uq_standings_club_competition ON public.standings(club_id, competition_id);

CREATE TABLE IF NOT EXISTS public.competition_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  career_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.competition_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir competition_audit_log" ON public.competition_audit_log FOR ALL USING (true);

-- FASE 13: MERCADO DE PASES, TRANSFERENCIAS Y LISTINGS
CREATE TABLE IF NOT EXISTS public.transfer_market_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  selling_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  listing_type text DEFAULT 'TRANSFER_LISTED' NOT NULL,
  market_value numeric(12,2) NOT NULL,
  asking_price numeric(12,2) NOT NULL,
  status text DEFAULT 'AVAILABLE' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_market_listing_player UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.transfer_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  buying_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  selling_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  fee_offered numeric(12,2) NOT NULL,
  wage_offered numeric(10,2) NOT NULL,
  status text DEFAULT 'PENDING_RESPONSE' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transfer_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  from_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  to_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  transfer_fee numeric(12,2) NOT NULL,
  wage_weekly numeric(10,2) DEFAULT 0 NOT NULL,
  season_year int DEFAULT 1 NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transfer_market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo transfer_market_listings" ON public.transfer_market_listings FOR ALL USING (true);

ALTER TABLE public.transfer_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo transfer_bids" ON public.transfer_bids FOR ALL USING (true);

ALTER TABLE public.transfer_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo transfer_audit_log" ON public.transfer_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_transfer_listings_status ON public.transfer_market_listings(status);
CREATE INDEX IF NOT EXISTS idx_transfer_bids_status ON public.transfer_bids(status);
CREATE INDEX IF NOT EXISTS idx_transfer_audit_to_club ON public.transfer_audit_log(to_club_id);

-- FASE 14: VENTAS DE JUGADORES, LISTA DE TRANSFERIBLES Y OFERTAS DE IA
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS transfer_status text DEFAULT 'NOT_FOR_SALE';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS asking_price numeric(12,2);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS morale_unhappy_transfer_blocked boolean DEFAULT false;

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS counter_amount numeric(12,2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS expires_at_week int;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS sell_on_fee_percentage int DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.contract_terminations_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  termination_type text DEFAULT 'MUTUAL_CONSENT' NOT NULL,
  severance_paid numeric(12,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contract_terminations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo contract_terminations_log" ON public.contract_terminations_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_contract_terminations_club ON public.contract_terminations_log(club_id);
CREATE INDEX IF NOT EXISTS idx_offers_to_club_status ON public.offers(to_club_id, status);

-- FASE 15: CONTRATOS, RENOVACIONES, CL脕USULAS Y MASA SALARIAL
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS release_clause numeric(12,2);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS negotiation_lockout_week int;

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  wage_weekly numeric(10,2) NOT NULL,
  starts_at date DEFAULT CURRENT_DATE,
  expires_at date,
  contract_years_total int DEFAULT 1 NOT NULL,
  release_clause numeric(12,2),
  squad_role text DEFAULT 'ROTATION' NOT NULL,
  goal_bonus numeric(8,2) DEFAULT 0 NOT NULL,
  clean_sheet_bonus numeric(8,2) DEFAULT 0 NOT NULL,
  status text DEFAULT 'ACTIVE' NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_active_contract UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.contract_negotiations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  wage_offered numeric(10,2) NOT NULL,
  years_offered int DEFAULT 1 NOT NULL,
  release_clause_offered numeric(12,2),
  squad_role_offered text DEFAULT 'ROTATION',
  rounds_completed int DEFAULT 1 NOT NULL,
  negotiation_status text DEFAULT 'OPEN' NOT NULL,
  player_demands_snapshot jsonb,
  lockout_until_week int,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contracts_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_wage numeric(10,2),
  new_wage numeric(10,2),
  previous_expiry text,
  new_expiry text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo contracts" ON public.contracts FOR ALL USING (true);

ALTER TABLE public.contract_negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo contract_negotiations" ON public.contract_negotiations FOR ALL USING (true);

ALTER TABLE public.contracts_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo contracts_audit_log" ON public.contracts_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_contracts_club ON public.contracts(club_id);
CREATE INDEX IF NOT EXISTS idx_contracts_player ON public.contracts(player_id);

-- FASE 16: AGENTES, REPRESENTANTES E INTERMEDIARIOS
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS career_id uuid;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS personality text DEFAULT 'FAIR';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS patience_rating int DEFAULT 50;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS base_commission_rate numeric(4,2) DEFAULT 0.08;

CREATE TABLE IF NOT EXISTS public.agent_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  contract_expiry date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_agent_client_player UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.manager_agent_relations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  relationship_score int DEFAULT 50 NOT NULL,
  last_interaction_week int,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_manager_agent UNIQUE (manager_id, agent_id)
);

CREATE TABLE IF NOT EXISTS public.agent_action_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  financial_impact numeric(12,2) DEFAULT 0 NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo agent_clients" ON public.agent_clients FOR ALL USING (true);

ALTER TABLE public.manager_agent_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager_agent_relations" ON public.manager_agent_relations FOR ALL USING (true);

ALTER TABLE public.agent_action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo agent_action_log" ON public.agent_action_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_agent_clients_agent ON public.agent_clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_manager_agent_rel ON public.manager_agent_relations(manager_id, agent_id);

-- FASE 17: SCOUTING, OJEO Y NIEBLA DE GUERRA
CREATE TABLE IF NOT EXISTS public.club_scouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  judging_ability int DEFAULT 10 NOT NULL,
  judging_potential int DEFAULT 10 NOT NULL,
  wage_weekly numeric(8,2) DEFAULT 200 NOT NULL,
  current_assignment_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  weeks_remaining_on_task int DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS knowledge_level int DEFAULT 1;
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS perceived_ovr_min int;
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS perceived_ovr_max int;
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS perceived_potential_tier text DEFAULT 'UNKNOWN';
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS pros text[];
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS cons text[];
ALTER TABLE public.scout_reports ADD COLUMN IF NOT EXISTS recommended_action text DEFAULT 'CONSIDER';

CREATE TABLE IF NOT EXISTS public.scouting_missions_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  scout_id uuid REFERENCES public.club_scouts(id) ON DELETE SET NULL,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  cost_incurred numeric(8,2) DEFAULT 0 NOT NULL,
  status text DEFAULT 'COMPLETED' NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_scouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_scouts" ON public.club_scouts FOR ALL USING (true);

ALTER TABLE public.scouting_missions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo scouting_missions_log" ON public.scouting_missions_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_club_scouts_club ON public.club_scouts(club_id);
CREATE INDEX IF NOT EXISTS idx_scouting_missions_club ON public.scouting_missions_log(club_id);
