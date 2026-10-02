-- Script para crear la tabla de managers en Supabase

CREATE TABLE public.managers (
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

CREATE TABLE public.clubs (
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

CREATE TABLE public.players (
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

