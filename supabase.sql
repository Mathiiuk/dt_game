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

-- PolÃ­ticas de seguridad
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

-- Asumimos que el manager_id pertenece al usuario actual a través de joins, pero para MVP permitimos leer todo
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



-- Script para crear la tabla de tácticas
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
CREATE POLICY "Permitir leer tácticas" ON public.tactics FOR SELECT USING (true);
CREATE POLICY "Permitir insertar tácticas" ON public.tactics FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizar tácticas" ON public.tactics FOR UPDATE USING (true);



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
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS contract_role text DEFAULT 'Rotación';

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



-- Fase 20 & 21: Economía y Estadio
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS debt int DEFAULT 0;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS stadium_level int DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS stadium_condition int DEFAULT 100;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS medical_level int DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS store_level int DEFAULT 1;



-- Fase 22 & 23: Hinchada y Dirigencia
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS board_confidence int DEFAULT 80;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS fans_confidence int DEFAULT 80;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS season_objective text DEFAULT 'Mitad de tabla';

