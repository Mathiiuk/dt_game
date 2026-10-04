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

-- FASE 18: CANTERA, DIVISIONES INFERIORES Y CAPTACI脫N DE POTRERO
CREATE TABLE IF NOT EXISTS public.club_academies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  academy_level int DEFAULT 1 NOT NULL,
  scouting_network_tier int DEFAULT 1 NOT NULL,
  weekly_maintenance_cost numeric(8,2) DEFAULT 100 NOT NULL,
  last_intake_year int,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_academy UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.youth_candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  age int DEFAULT 16 NOT NULL,
  position text NOT NULL,
  overall_rating int NOT NULL,
  potential_rating int NOT NULL,
  potential_stars_perceived numeric(2,1) DEFAULT 3.0 NOT NULL,
  attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'TRIAL' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.youth_intake_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_year int NOT NULL,
  candidates_generated_count int NOT NULL,
  top_potential_rating int NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_academies" ON public.club_academies FOR ALL USING (true);

ALTER TABLE public.youth_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo youth_candidates" ON public.youth_candidates FOR ALL USING (true);

ALTER TABLE public.youth_intake_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo youth_intake_audit_log" ON public.youth_intake_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_youth_candidates_club ON public.youth_candidates(club_id, status);

-- FASE 19: CUERPO T脡CNICO, STAFF Y ESPECIALISTAS
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS skill_rating int DEFAULT 10;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS wage_weekly numeric(8,2) DEFAULT 150;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS contract_expires_at date;

CREATE TABLE IF NOT EXISTS public.staff_candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  skill_rating int DEFAULT 10 NOT NULL,
  wage_demanded numeric(8,2) DEFAULT 150 NOT NULL,
  status text DEFAULT 'AVAILABLE' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  staff_id uuid,
  role text NOT NULL,
  action text NOT NULL,
  severance_cost numeric(8,2) DEFAULT 0 NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staff_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo staff_candidates" ON public.staff_candidates FOR ALL USING (true);

ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo staff_audit_log" ON public.staff_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_staff_club_role ON public.staff(club_id, role);
CREATE INDEX IF NOT EXISTS idx_staff_candidates_role ON public.staff_candidates(role, status);

-- FASE 20: ECONOM脥A INTEGRAL, BALANCE SEMANAL Y FINANZAS DEL CLUB
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS ticket_price numeric(6,2) DEFAULT 10.00;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS consecutive_deficit_weeks int DEFAULT 0;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS financial_status text DEFAULT 'HEALTHY';

CREATE TABLE IF NOT EXISTS public.club_finances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  balance numeric(12,2) DEFAULT 25000 NOT NULL,
  wage_budget_weekly numeric(10,2) DEFAULT 5000 NOT NULL,
  transfer_budget numeric(12,2) DEFAULT 15000 NOT NULL,
  ticket_price numeric(6,2) DEFAULT 10.00 NOT NULL,
  consecutive_deficit_weeks int DEFAULT 0 NOT NULL,
  financial_status text DEFAULT 'HEALTHY' NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_finances UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.financial_transactions_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_year int DEFAULT 1 NOT NULL,
  week_number int DEFAULT 1 NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.club_sponsorships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  weekly_fixed_amount numeric(8,2) DEFAULT 750 NOT NULL,
  win_bonus numeric(8,2) DEFAULT 200 NOT NULL,
  expires_at_season int DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_sponsor UNIQUE (club_id)
);

ALTER TABLE public.club_finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_finances" ON public.club_finances FOR ALL USING (true);

ALTER TABLE public.financial_transactions_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo financial_transactions_ledger" ON public.financial_transactions_ledger FOR ALL USING (true);

ALTER TABLE public.club_sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_sponsorships" ON public.club_sponsorships FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_ledger_club ON public.financial_transactions_ledger(club_id, week_number);

-- FASE 21: Estadio, Infraestructura y Obras Edilicias
CREATE TABLE IF NOT EXISTS public.club_stadiums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  stadium_name text NOT NULL DEFAULT 'Estadio Principal',
  capacity integer DEFAULT 1500 NOT NULL CHECK (capacity BETWEEN 500 AND 120000),
  pitch_quality integer DEFAULT 60 NOT NULL CHECK (pitch_quality BETWEEN 1 AND 100),
  stands_tier integer DEFAULT 1 NOT NULL CHECK (stands_tier BETWEEN 1 AND 4),
  floodlights_installed boolean DEFAULT false NOT NULL,
  vip_boxes_count integer DEFAULT 0 NOT NULL,
  weekly_maintenance_cost numeric(10,2) DEFAULT 200.00 NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_stadium UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.stadium_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  project_type text NOT NULL,
  cost_paid numeric(12,2) NOT NULL,
  capacity_delta integer DEFAULT 0 NOT NULL,
  weeks_remaining integer NOT NULL,
  status text DEFAULT 'UNDER_CONSTRUCTION' NOT NULL CHECK (status IN ('UNDER_CONSTRUCTION', 'COMPLETED', 'CANCELLED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stadium_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  action text NOT NULL,
  cost numeric(12,2) DEFAULT 0.00 NOT NULL,
  capacity_before integer,
  capacity_after integer,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_stadiums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_stadiums" ON public.club_stadiums FOR ALL USING (true);

ALTER TABLE public.stadium_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo stadium_projects" ON public.stadium_projects FOR ALL USING (true);

ALTER TABLE public.stadium_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo stadium_audit_log" ON public.stadium_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_stadium_projects_club ON public.stadium_projects(club_id, status);
CREATE INDEX IF NOT EXISTS idx_stadium_audit_club ON public.stadium_audit_log(club_id);

-- FASE 22: Hinchada, Aficion y Masa Social
CREATE TABLE IF NOT EXISTS public.club_fanbase (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  loyal_members_count integer DEFAULT 350 NOT NULL,
  casual_fanbase_potential integer DEFAULT 2500 NOT NULL,
  fan_support_score integer DEFAULT 65 NOT NULL CHECK (fan_support_score BETWEEN 0 AND 100),
  stadium_atmosphere_status text DEFAULT 'PASSIONATE' NOT NULL CHECK (stadium_atmosphere_status IN ('HOSTILE_PROTEST', 'DISAPPOINTED', 'NEUTRAL', 'PASSIONATE', 'EUPHORIC_FORTRESS')),
  derby_rival_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  chants text[] DEFAULT ARRAY['隆Vamos los pibes!', '隆En las buenas y en las malas!'],
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_fanbase UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.match_attendance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid,
  home_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  attendance integer NOT NULL,
  capacity_fill_percentage numeric(5,2) NOT NULL,
  home_advantage_bonus numeric(4,2) DEFAULT 1.00 NOT NULL,
  ticket_price_applied numeric(8,2) NOT NULL,
  fan_mood_after_match integer DEFAULT 65 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fanbase_events_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  impact_on_morale integer DEFAULT 0 NOT NULL,
  details text NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_fanbase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_fanbase" ON public.club_fanbase FOR ALL USING (true);

ALTER TABLE public.match_attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo match_attendance_records" ON public.match_attendance_records FOR ALL USING (true);

ALTER TABLE public.fanbase_events_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo fanbase_events_log" ON public.fanbase_events_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_fanbase_club ON public.club_fanbase(club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_home ON public.match_attendance_records(home_club_id);
CREATE INDEX IF NOT EXISTS idx_fanbase_events_club ON public.fanbase_events_log(club_id);

-- FASE 23: Dirigencia, Confianza y Condicion de Despido
CREATE TABLE IF NOT EXISTS public.club_board_confidence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  season_year integer DEFAULT 1 NOT NULL,
  confidence_score integer DEFAULT 70 NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  sports_satisfaction integer DEFAULT 70 NOT NULL CHECK (sports_satisfaction BETWEEN 0 AND 100),
  financial_satisfaction integer DEFAULT 70 NOT NULL CHECK (financial_satisfaction BETWEEN 0 AND 100),
  squad_satisfaction integer DEFAULT 70 NOT NULL CHECK (squad_satisfaction BETWEEN 0 AND 100),
  season_objective text DEFAULT 'MID_TABLE' NOT NULL,
  is_under_ultimatum boolean DEFAULT false NOT NULL,
  ultimatum_points_required integer DEFAULT 0 NOT NULL,
  ultimatum_matches_remaining integer DEFAULT 0 NOT NULL,
  ultimatum_points_gathered integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_board UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.board_meetings_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  meeting_reason text NOT NULL,
  board_statement text NOT NULL,
  manager_response text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.manager_dismissals_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  dismissal_reason text NOT NULL,
  final_confidence_score integer NOT NULL,
  matches_managed integer DEFAULT 0 NOT NULL,
  severance_compensation_paid numeric(10,2) DEFAULT 0.00 NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_board_confidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_board_confidence" ON public.club_board_confidence FOR ALL USING (true);

ALTER TABLE public.board_meetings_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo board_meetings_log" ON public.board_meetings_log FOR ALL USING (true);

ALTER TABLE public.manager_dismissals_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager_dismissals_log" ON public.manager_dismissals_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_board_conf_club ON public.club_board_confidence(club_id);
CREATE INDEX IF NOT EXISTS idx_board_meetings_club ON public.board_meetings_log(club_id);
CREATE INDEX IF NOT EXISTS idx_dismissals_club ON public.manager_dismissals_log(club_id);

-- FASE 24: Prensa Deportiva, Ruedas de Prensa y Reputaci贸n
CREATE TABLE IF NOT EXISTS public.press_conferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  delegated_to_assistant boolean DEFAULT false NOT NULL,
  status text DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.press_qa_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id uuid REFERENCES public.press_conferences(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  journalist_name text NOT NULL,
  media_outlet text NOT NULL,
  topic_category text NOT NULL,
  question_text text NOT NULL,
  chosen_tone text CHECK (chosen_tone IN ('COMBATIVE', 'SELF_CRITICAL', 'PRAISING', 'PRAGMATIC', 'NO_COMMENT')),
  manager_answer_text text,
  morale_impact_applied integer DEFAULT 0 NOT NULL,
  options jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.press_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  conference_id uuid REFERENCES public.press_conferences(id) ON DELETE CASCADE,
  reputation_delta integer DEFAULT 0 NOT NULL,
  board_reaction text NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.press_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo press_conferences" ON public.press_conferences FOR ALL USING (true);

ALTER TABLE public.press_qa_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo press_qa_items" ON public.press_qa_items FOR ALL USING (true);

ALTER TABLE public.press_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo press_audit_log" ON public.press_audit_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_press_conf_club ON public.press_conferences(club_id);
CREATE INDEX IF NOT EXISTS idx_press_qa_conf ON public.press_qa_items(conference_id);
CREATE INDEX IF NOT EXISTS idx_press_audit_manager ON public.press_audit_log(manager_id);

-- FASE 25: Vestuario, Cohesion y Jerarqu铆a de Liderazgo
CREATE TABLE IF NOT EXISTS public.club_locker_room (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_cohesion_score integer DEFAULT 60 NOT NULL CHECK (team_cohesion_score BETWEEN 0 AND 100),
  captain_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  vice_captain_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  manager_support_level text DEFAULT 'FAVORABLE' NOT NULL CHECK (manager_support_level IN ('COMMITTED', 'FAVORABLE', 'DIVIDED', 'SKEPTICAL', 'MUTINOUS')),
  last_team_meeting_week integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_locker_room UNIQUE (club_id)
);

CREATE TABLE IF NOT EXISTS public.player_social_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  hierarchy_tier text DEFAULT 'INFLUENTIAL' NOT NULL CHECK (hierarchy_tier IN ('TEAM_LEADER', 'HIGHLY_INFLUENTIAL', 'INFLUENTIAL', 'FRINGE_PLAYER')),
  social_group text DEFAULT 'HOMEGROWN_CORE' NOT NULL CHECK (social_group IN ('HOMEGROWN_CORE', 'EXPERIENCED_VETS', 'FOREIGN_NEWCOMERS', 'NEUTRAL')),
  satisfaction_with_manager integer DEFAULT 70 NOT NULL CHECK (satisfaction_with_manager BETWEEN 0 AND 100),
  satisfaction_playing_time integer DEFAULT 75 NOT NULL CHECK (satisfaction_playing_time BETWEEN 0 AND 100),
  satisfaction_wage integer DEFAULT 70 NOT NULL CHECK (satisfaction_wage BETWEEN 0 AND 100),
  is_demanding_talk boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_social UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.locker_room_events_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  cohesion_delta integer DEFAULT 0 NOT NULL,
  details text NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_locker_room ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_locker_room" ON public.club_locker_room FOR ALL USING (true);

ALTER TABLE public.player_social_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_social_status" ON public.player_social_status FOR ALL USING (true);

ALTER TABLE public.locker_room_events_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo locker_room_events_log" ON public.locker_room_events_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_locker_club ON public.club_locker_room(club_id);
CREATE INDEX IF NOT EXISTS idx_player_social_club ON public.player_social_status(club_id);
CREATE INDEX IF NOT EXISTS idx_locker_events_club ON public.locker_room_events_log(club_id);

-- FASE 26: Personalidades, Rasgos y Psicolog铆a del Jugador
CREATE TABLE IF NOT EXISTS public.player_personalities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  primary_archetype text DEFAULT 'STREET_RESILIENT' NOT NULL CHECK (primary_archetype IN ('NATURAL_LEADER', 'MODEL_PROFESSIONAL', 'AMBITIOUS', 'TEMPERAMENTAL', 'STREET_RESILIENT', 'SLACKER', 'FRAGILE')),
  ambition integer DEFAULT 10 NOT NULL CHECK (ambition BETWEEN 1 AND 20),
  professionalism integer DEFAULT 10 NOT NULL CHECK (professionalism BETWEEN 1 AND 20),
  loyalty integer DEFAULT 10 NOT NULL CHECK (loyalty BETWEEN 1 AND 20),
  pressure_handling integer DEFAULT 10 NOT NULL CHECK (pressure_handling BETWEEN 1 AND 20),
  temperament integer DEFAULT 10 NOT NULL CHECK (temperament BETWEEN 1 AND 20),
  determination integer DEFAULT 10 NOT NULL CHECK (determination BETWEEN 1 AND 20),
  special_traits text[] DEFAULT '{}',
  mentor_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_personality UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.player_mentorships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  veteran_player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  youth_player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  progress_percentage integer DEFAULT 0 NOT NULL CHECK (progress_percentage BETWEEN 0 AND 100),
  status text DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'INCOMPATIBLE_CANCELLED')),
  started_at_season integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.personality_events_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  attribute_shifted text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.player_personalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_personalities" ON public.player_personalities FOR ALL USING (true);

ALTER TABLE public.player_mentorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_mentorships" ON public.player_mentorships FOR ALL USING (true);

ALTER TABLE public.personality_events_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo personality_events_log" ON public.personality_events_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_mentorship_club ON public.player_mentorships(club_id, status);
CREATE INDEX IF NOT EXISTS idx_personality_events_player ON public.personality_events_log(player_id);

-- ==============================================================================
-- FASE 27: LESIONES, ENFERMER脥A Y GESTI脫N M脡DICA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.player_injuries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  injury_type text NOT NULL,
  severity_tier text NOT NULL CHECK (severity_tier IN ('MINOR', 'MODERATE', 'SEVERE', 'CATASTROPHIC')),
  occurred_in_context text NOT NULL CHECK (occurred_in_context IN ('MATCH', 'TRAINING', 'INFILTRATION_RELAPSE')),
  weeks_total integer NOT NULL DEFAULT 1,
  weeks_remaining integer NOT NULL DEFAULT 1,
  is_cleared boolean DEFAULT false NOT NULL,
  permanent_attribute_loss jsonb DEFAULT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  cleared_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.medical_infiltrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE SET NULL,
  was_successful boolean NOT NULL,
  resulting_injury_id uuid REFERENCES public.player_injuries(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.player_injuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_injuries" ON public.player_injuries FOR ALL USING (true);

ALTER TABLE public.medical_infiltrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo medical_infiltrations" ON public.medical_infiltrations FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_player_injuries_active ON public.player_injuries(player_id, is_cleared);
CREATE INDEX IF NOT EXISTS idx_player_injuries_club ON public.player_injuries(club_id, is_cleared);
CREATE INDEX IF NOT EXISTS idx_medical_infiltrations_player ON public.medical_infiltrations(player_id);

-- ==============================================================================
-- FASE 28: EVOLUCI脫N, MADURACI脫N Y DECLIVE NATURAL DEL JUGADOR
-- ==============================================================================

ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS minutes_played_season integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS career_phase text DEFAULT 'PRIME_DEVELOPMENT',
  ADD COLUMN IF NOT EXISTS announced_retirement_year integer DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.player_evolution_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  age_at_season integer NOT NULL,
  ovr_before integer NOT NULL,
  ovr_after integer NOT NULL,
  attributes_delta jsonb DEFAULT '{}'::jsonb NOT NULL,
  minutes_played integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_season_evolution UNIQUE (player_id, season_year)
);

CREATE TABLE IF NOT EXISTS public.player_retirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  announcement_week integer NOT NULL,
  planned_retirement_season integer NOT NULL,
  future_role_interest text DEFAULT 'LEAVE_FOOTBALL' NOT NULL CHECK (future_role_interest IN ('COACH', 'SCOUT', 'PHYSIO', 'LEAVE_FOOTBALL')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_player_retirement UNIQUE (player_id)
);

ALTER TABLE public.player_evolution_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_evolution_history" ON public.player_evolution_history FOR ALL USING (true);

ALTER TABLE public.player_retirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo player_retirements" ON public.player_retirements FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_player_evolution_history_player ON public.player_evolution_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_evolution_history_club ON public.player_evolution_history(club_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_retirements_club ON public.player_retirements(club_id);

-- ==============================================================================
-- FASE 29: TRANSICI脫N Y CIERRE ANUAL DE TEMPORADA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.season_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  division_tier integer DEFAULT 5 NOT NULL,
  champion_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  runner_up_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  promoted_club_ids uuid[] DEFAULT '{}',
  relegated_club_ids uuid[] DEFAULT '{}',
  top_scorer_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  top_scorer_goals integer DEFAULT 0,
  best_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  final_standings_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_career_season_tier UNIQUE (career_id, season_year, division_tier)
);

CREATE TABLE IF NOT EXISTS public.annual_financial_statements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  total_income numeric(12,2) DEFAULT 0 NOT NULL,
  total_expenses numeric(12,2) DEFAULT 0 NOT NULL,
  net_profit_loss numeric(12,2) DEFAULT 0 NOT NULL,
  prize_money_received numeric(12,2) DEFAULT 0 NOT NULL,
  approved_transfer_budget_next_year numeric(12,2) DEFAULT 0 NOT NULL,
  approved_wage_budget_next_year numeric(10,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_season_finances UNIQUE (club_id, season_year)
);

CREATE TABLE IF NOT EXISTS public.season_transition_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid,
  from_year integer NOT NULL,
  to_year integer NOT NULL,
  players_aged_count integer DEFAULT 0,
  contracts_expired_count integer DEFAULT 0,
  players_retired_count integer DEFAULT 0,
  duration_ms integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.season_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo season_snapshots" ON public.season_snapshots FOR ALL USING (true);

ALTER TABLE public.annual_financial_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo annual_financial_statements" ON public.annual_financial_statements FOR ALL USING (true);

ALTER TABLE public.season_transition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo season_transition_log" ON public.season_transition_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_season_snapshots_career ON public.season_snapshots(career_id, season_year);
CREATE INDEX IF NOT EXISTS idx_annual_financial_club ON public.annual_financial_statements(club_id, season_year);

-- ==============================================================================
-- FASE 30: ASCENSOS, DESCENSOS Y ESTRUCTURA PIRAMIDAL DE LIGAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.league_tiers_config (
  tier_level integer PRIMARY KEY,
  tier_name text NOT NULL,
  total_teams integer DEFAULT 20 NOT NULL,
  automatic_promotions integer DEFAULT 2 NOT NULL,
  playoff_promotions integer DEFAULT 1 NOT NULL,
  relegations_count integer DEFAULT 3 NOT NULL,
  base_tv_revenue_weekly numeric(10,2) DEFAULT 500 NOT NULL,
  base_wage_cap_weekly numeric(10,2) DEFAULT 10000 NOT NULL,
  min_stadium_capacity_required integer DEFAULT 1000 NOT NULL
);

INSERT INTO public.league_tiers_config (tier_level, tier_name, total_teams, automatic_promotions, playoff_promotions, relegations_count, base_tv_revenue_weekly, base_wage_cap_weekly, min_stadium_capacity_required)
VALUES
  (1, 'Liga Profesional', 20, 0, 0, 3, 12000, 150000, 15000),
  (2, 'Primera Nacional', 20, 2, 1, 3, 5000, 60000, 8000),
  (3, 'Primera B Metropolitana / Federal A', 20, 2, 1, 3, 2000, 28000, 4000),
  (4, 'Primera C Metropolitana', 20, 2, 1, 3, 900, 14000, 2000),
  (5, 'Torneo Promocional Regional / Potrero', 20, 2, 1, 0, 400, 7000, 800)
ON CONFLICT (tier_level) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.promotion_relegation_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('PROMOTION_CHAMPION', 'PROMOTION_RUNNER_UP', 'PROMOTION_PLAYOFF', 'RELEGATION', 'MAINTAINED')),
  from_tier integer NOT NULL,
  to_tier integer NOT NULL,
  final_position integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_club_season_move UNIQUE (career_id, season_year, club_id)
);

CREATE TABLE IF NOT EXISTS public.playoff_fixtures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  division_tier integer DEFAULT 5 NOT NULL,
  round_name text NOT NULL CHECK (round_name IN ('SEMI_FINAL', 'FINAL')),
  home_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  away_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  home_score integer DEFAULT 0 NOT NULL,
  away_score integer DEFAULT 0 NOT NULL,
  penalty_home_score integer,
  penalty_away_score integer,
  winner_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  status text DEFAULT 'SCHEDULED' NOT NULL CHECK (status IN ('SCHEDULED', 'FINISHED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.league_tiers_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo league_tiers_config" ON public.league_tiers_config FOR ALL USING (true);

ALTER TABLE public.promotion_relegation_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo promotion_relegation_ledger" ON public.promotion_relegation_ledger FOR ALL USING (true);

ALTER TABLE public.playoff_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo playoff_fixtures" ON public.playoff_fixtures FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_prom_rel_career ON public.promotion_relegation_ledger(career_id, season_year);
CREATE INDEX IF NOT EXISTS idx_playoff_fixtures_career ON public.playoff_fixtures(career_id, season_year, division_tier);

-- ========================================================
-- FASE 31: CARRERA DEL DIRECTOR T脡CNICO, OFERTAS Y STINTS
-- ========================================================

ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'EMPLOYED' CHECK (employment_status IN ('EMPLOYED', 'UNEMPLOYED', 'RETIRED'));
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS current_contract_wage numeric(10,2) DEFAULT 500.00;
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS current_contract_expires_at date;
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS personal_savings numeric(12,2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS public.manager_job_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  offering_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  offering_club_name text NOT NULL,
  offering_club_tier integer DEFAULT 5 NOT NULL,
  wage_offered numeric(10,2) NOT NULL,
  transfer_budget_promised numeric(12,2) NOT NULL,
  season_objective_expected text NOT NULL CHECK (season_objective_expected IN ('AVOID_RELEGATION', 'MID_TABLE', 'TOP_HALF', 'PROMOTION', 'CHAMPION')),
  contract_years integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  expires_at_week integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.manager_career_stints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  club_name text NOT NULL,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone,
  matches_managed integer DEFAULT 0 NOT NULL,
  matches_won integer DEFAULT 0 NOT NULL,
  matches_drawn integer DEFAULT 0 NOT NULL,
  matches_lost integer DEFAULT 0 NOT NULL,
  trophies_won jsonb DEFAULT '[]'::jsonb NOT NULL,
  departure_reason text CHECK (departure_reason IN ('RESIGNED', 'SACKED', 'RETIRED', 'MOVED_TO_ANOTHER_CLUB', 'CONTRACT_EXPIRED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.manager_job_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager_job_offers" ON public.manager_job_offers FOR ALL USING (true);

ALTER TABLE public.manager_career_stints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager_career_stints" ON public.manager_career_stints FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_job_offers_manager_status ON public.manager_job_offers(manager_id, status);
CREATE INDEX IF NOT EXISTS idx_job_offers_career ON public.manager_job_offers(career_id);
CREATE INDEX IF NOT EXISTS idx_career_stints_manager ON public.manager_career_stints(manager_id);
CREATE INDEX IF NOT EXISTS idx_career_stints_career ON public.manager_career_stints(career_id);

-- ========================================================
-- FASE 32: REPUTACI脫N PROFESIONAL Y PRESTIGIO DEL DT
-- ========================================================

ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS reputation_rank text DEFAULT 'LOCAL_UNKNOWN' CHECK (reputation_rank IN ('LOCAL_UNKNOWN', 'REGIONAL_PROSPECT', 'ASCENT_SPECIALIST', 'FIRST_TIER_PRO', 'CONTINENTAL_ELITE', 'WORLD_LEGEND'));
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS peak_career_reputation integer DEFAULT 20;

CREATE TABLE IF NOT EXISTS public.manager_reputation_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('MATCH_RESULT', 'DERBY_VICTORY', 'TITLE_WON', 'PROMOTION', 'RELEGATION', 'DISMISSAL', 'INTERNATIONAL_TRIUMPH', 'RESIGNATION')),
  delta_amount numeric(5,2) NOT NULL,
  reputation_after integer NOT NULL,
  source_entity_id text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_manager_reputation_event UNIQUE (manager_id, event_type, source_entity_id)
);

ALTER TABLE public.manager_reputation_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo manager_reputation_ledger" ON public.manager_reputation_ledger FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_reputation_ledger_mgr ON public.manager_reputation_ledger(manager_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_ledger_career ON public.manager_reputation_ledger(career_id);

-- ========================================================
-- FASE 33: SELECCIONES NACIONALES Y DOBLE CARRERA
-- ========================================================

CREATE TABLE IF NOT EXISTS public.national_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text NOT NULL,
  manager_id uuid REFERENCES public.managers(id) ON DELETE SET NULL,
  world_ranking integer DEFAULT 10 NOT NULL,
  federation text DEFAULT 'CONMEBOL' NOT NULL CHECK (federation IN ('CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC')),
  reputation integer DEFAULT 80 NOT NULL,
  category text DEFAULT 'senior' NOT NULL CHECK (category IN ('senior', 'u20', 'u23')),
  colors jsonb DEFAULT '{"primary": "#75AADB", "secondary": "#FFFFFF"}'::jsonb,
  matches_played integer DEFAULT 0 NOT NULL,
  matches_won integer DEFAULT 0 NOT NULL,
  matches_drawn integer DEFAULT 0 NOT NULL,
  matches_lost integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.national_team_callups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  national_team_id uuid REFERENCES public.national_teams(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  is_starter boolean DEFAULT false NOT NULL,
  caps integer DEFAULT 0 NOT NULL,
  international_goals integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_callup_team_player UNIQUE (national_team_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.national_fixtures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  national_team_id uuid REFERENCES public.national_teams(id) ON DELETE CASCADE,
  opponent_name text NOT NULL,
  tournament_name text NOT NULL,
  match_date date NOT NULL,
  is_home boolean DEFAULT true NOT NULL,
  home_score integer DEFAULT 0 NOT NULL,
  away_score integer DEFAULT 0 NOT NULL,
  played boolean DEFAULT false NOT NULL,
  status text DEFAULT 'SCHEDULED' NOT NULL CHECK (status IN ('SCHEDULED', 'FINISHED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.national_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo national_teams" ON public.national_teams FOR ALL USING (true);

ALTER TABLE public.national_team_callups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo national_team_callups" ON public.national_team_callups FOR ALL USING (true);

ALTER TABLE public.national_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo national_fixtures" ON public.national_fixtures FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_national_teams_mgr ON public.national_teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_national_callups_team ON public.national_team_callups(national_team_id);
CREATE INDEX IF NOT EXISTS idx_national_fixtures_team ON public.national_fixtures(national_team_id);

-- ========================================================
-- FASE 34: COMPETICIONES INTERNACIONALES Y COPAS CONTINENTALES
-- ========================================================

CREATE TABLE IF NOT EXISTS public.international_tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  name text NOT NULL,
  tournament_type text DEFAULT 'CONTINENTAL_CHAMPIONS_CUP' NOT NULL,
  season_year integer DEFAULT 2026 NOT NULL,
  tier integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'in_progress' NOT NULL,
  current_stage text DEFAULT 'quarter_finals' NOT NULL,
  prize_pool numeric(12,2) DEFAULT 1500000.00 NOT NULL,
  champion_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.international_fixtures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.international_tournaments(id) ON DELETE CASCADE,
  stage text NOT NULL,
  match_number integer DEFAULT 1 NOT NULL,
  home_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  away_club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  home_score integer DEFAULT 0 NOT NULL,
  away_score integer DEFAULT 0 NOT NULL,
  played boolean DEFAULT false NOT NULL,
  match_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.international_group_standings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.international_tournaments(id) ON DELETE CASCADE,
  group_letter text NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  points integer DEFAULT 0 NOT NULL,
  played integer DEFAULT 0 NOT NULL,
  won integer DEFAULT 0 NOT NULL,
  drawn integer DEFAULT 0 NOT NULL,
  lost integer DEFAULT 0 NOT NULL,
  goals_for integer DEFAULT 0 NOT NULL,
  goals_against integer DEFAULT 0 NOT NULL,
  goal_difference integer DEFAULT 0 NOT NULL,
  qualified_to_knockout boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_intl_group_club UNIQUE (tournament_id, group_letter, club_id)
);

ALTER TABLE public.international_tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo international_tournaments" ON public.international_tournaments FOR ALL USING (true);

ALTER TABLE public.international_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo international_fixtures" ON public.international_fixtures FOR ALL USING (true);

ALTER TABLE public.international_group_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo international_group_standings" ON public.international_group_standings FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_intl_tournaments_season ON public.international_tournaments(season_year);
CREATE INDEX IF NOT EXISTS idx_intl_fixtures_tourn_stage ON public.international_fixtures(tournament_id, stage);
CREATE INDEX IF NOT EXISTS idx_intl_standings_tourn ON public.international_group_standings(tournament_id);

-- ========================================================
-- FASE 35: EVENTOS DIN脕MICOS NARRATIVOS Y DILEMAS DEL DT
-- ========================================================

CREATE TABLE IF NOT EXISTS public.dynamic_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  template_code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'COMMUNITY' NOT NULL CHECK (category IN ('COMMUNITY', 'LOCKER_ROOM', 'BOARD_PRESS', 'FINANCIAL_CRISIS')),
  severity text DEFAULT 'MEDIUM' NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  options jsonb NOT NULL,
  status text DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'RESOLVED', 'EXPIRED')),
  created_at_week integer DEFAULT 1 NOT NULL,
  resolved_option_id text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.event_consequences_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.dynamic_events(id) ON DELETE CASCADE,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  money_delta numeric(10,2) DEFAULT 0.00 NOT NULL,
  morale_delta integer DEFAULT 0 NOT NULL,
  reputation_delta numeric(4,2) DEFAULT 0.00 NOT NULL,
  board_confidence_delta integer DEFAULT 0 NOT NULL,
  fans_confidence_delta integer DEFAULT 0 NOT NULL,
  delayed_trigger_event_code text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dynamic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo dynamic_events" ON public.dynamic_events FOR ALL USING (true);

ALTER TABLE public.event_consequences_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo event_consequences_log" ON public.event_consequences_log FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_dynamic_events_club_pending ON public.dynamic_events(club_id, status);
CREATE INDEX IF NOT EXISTS idx_event_consequences_event ON public.event_consequences_log(event_id);

-- ==============================================================================
-- FASE 36: HISTORIA DEL CLUB, R脡CORDS Y HEMEROTECA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.club_milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT 2026,
  game_date text,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'milestone',
  importance integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.club_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  title text NOT NULL,
  record_value text NOT NULL,
  holder_name text NOT NULL,
  record_date text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(club_id, record_type)
);

CREATE TABLE IF NOT EXISTS public.club_hemeroteca (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_year integer NOT NULL DEFAULT 2026,
  headline text NOT NULL,
  snippet text NOT NULL,
  media_source text NOT NULL DEFAULT 'El Grafico del Potrero',
  tag text DEFAULT 'CRONICA',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.club_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_milestones" ON public.club_milestones FOR ALL USING (true);

ALTER TABLE public.club_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_records" ON public.club_records FOR ALL USING (true);

ALTER TABLE public.club_hemeroteca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_hemeroteca" ON public.club_hemeroteca FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_club_milestones_club ON public.club_milestones(club_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_club_records_club ON public.club_records(club_id);
CREATE INDEX IF NOT EXISTS idx_club_hemeroteca_club ON public.club_hemeroteca(club_id, created_at DESC);

-- ==============================================================================
-- FASE 37: 脥DOLOS, LEYENDAS Y RETIRO DE CAMISETAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.club_legends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  player_name text NOT NULL,
  status_level text NOT NULL DEFAULT 'IDOL',
  matches_played integer DEFAULT 0 NOT NULL,
  goals_scored integer DEFAULT 0 NOT NULL,
  honors_summary text,
  induction_year integer NOT NULL DEFAULT 2026,
  is_retired boolean DEFAULT false NOT NULL,
  retired_number integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.retired_shirt_numbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  shirt_number integer NOT NULL,
  player_name text NOT NULL,
  retired_year integer NOT NULL DEFAULT 2026,
  reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(club_id, shirt_number)
);

ALTER TABLE public.club_legends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo club_legends" ON public.club_legends FOR ALL USING (true);

ALTER TABLE public.retired_shirt_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo retired_shirt_numbers" ON public.retired_shirt_numbers FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_club_legends_club ON public.club_legends(club_id, status_level);
CREATE INDEX IF NOT EXISTS idx_retired_shirt_numbers_club ON public.retired_shirt_numbers(club_id);
