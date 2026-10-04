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
