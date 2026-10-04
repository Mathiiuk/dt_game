CREATE TABLE IF NOT EXISTS public.careers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  status text DEFAULT 'ACTIVE', 
  ruleset_version text DEFAULT '3.0.0',
  balance_version text DEFAULT '1.0.0',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir carreras propias" ON public.careers;
CREATE POLICY "Permitir carreras propias" ON public.careers 
  FOR ALL USING ((select auth.uid()) = user_id);
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
DROP POLICY IF EXISTS "Permitir sesiones propias" ON public.user_sessions;
CREATE POLICY "Permitir sesiones propias" ON public.user_sessions 
  FOR ALL USING ((select auth.uid()) = user_id);
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL, 
  ip_address text,
  user_agent text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir insertar audit seguridad" ON public.security_audit_log;
CREATE POLICY "Permitir insertar audit seguridad" ON public.security_audit_log 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir ver audit propio" ON public.security_audit_log;
CREATE POLICY "Permitir ver audit propio" ON public.security_audit_log 
  FOR SELECT USING ((select auth.uid()) = user_id);
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
CREATE TABLE IF NOT EXISTS public.career_calendar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id uuid REFERENCES public.careers(id) ON DELETE CASCADE,
  current_season_year int DEFAULT 2026 NOT NULL,
  current_week int DEFAULT 1 NOT NULL,
  "current_date" date DEFAULT '2026-07-01' NOT NULL,
  season_phase text DEFAULT 'PRE_SEASON' NOT NULL,
  transfer_window_open boolean DEFAULT true NOT NULL,
  is_advancing boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_valid_week CHECK (current_week BETWEEN 1 AND 53)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_career_calendar_career_id ON public.career_calendar(career_id);
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
DROP POLICY IF EXISTS "Permitir leer y actualizar calendar" ON public.career_calendar;
CREATE POLICY "Permitir leer y actualizar calendar" ON public.career_calendar FOR ALL USING (true);
ALTER TABLE public.time_advance_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir time_advance_log" ON public.time_advance_log;
CREATE POLICY "Permitir time_advance_log" ON public.time_advance_log FOR ALL USING (true);
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
DROP POLICY IF EXISTS "Permitir club_training_plans" ON public.club_training_plans;
CREATE POLICY "Permitir club_training_plans" ON public.club_training_plans FOR ALL USING (true);
ALTER TABLE public.player_training_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir player_training_assignments" ON public.player_training_assignments;
CREATE POLICY "Permitir player_training_assignments" ON public.player_training_assignments FOR ALL USING (true);
ALTER TABLE public.training_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir training_execution_logs" ON public.training_execution_logs;
CREATE POLICY "Permitir training_execution_logs" ON public.training_execution_logs FOR ALL USING (true);
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
ALTER TABLE public.tactic_lineup_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tactic_lineup_slots" ON public.tactic_lineup_slots;
CREATE POLICY "Permitir tactic_lineup_slots" ON public.tactic_lineup_slots FOR ALL USING (true);
CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  minute int NOT NULL,
  event_type text NOT NULL, 
  club_id uuid,
  player_id uuid,
  assist_player_id uuid,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_match_events_fixture ON public.match_events(fixture_id, minute);
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir match_events" ON public.match_events;
CREATE POLICY "Permitir match_events" ON public.match_events FOR ALL USING (true);
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
DROP POLICY IF EXISTS "Permitir match_reports" ON public.match_reports;
CREATE POLICY "Permitir match_reports" ON public.match_reports FOR ALL USING (true);
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir player_match_stats" ON public.player_match_stats;
CREATE POLICY "Permitir player_match_stats" ON public.player_match_stats FOR ALL USING (true);
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
ALTER TABLE public.transfer_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo transfer_audit_log" ON public.transfer_audit_log;
CREATE POLICY "Permitir todo transfer_audit_log" ON public.transfer_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_transfer_audit_to_club ON public.transfer_audit_log(to_club_id);
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
DROP POLICY IF EXISTS "Permitir todo contract_terminations_log" ON public.contract_terminations_log;
CREATE POLICY "Permitir todo contract_terminations_log" ON public.contract_terminations_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_contract_terminations_club ON public.contract_terminations_log(club_id);
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
DROP POLICY IF EXISTS "Permitir todo contracts" ON public.contracts;
CREATE POLICY "Permitir todo contracts" ON public.contracts FOR ALL USING (true);
ALTER TABLE public.contract_negotiations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo contract_negotiations" ON public.contract_negotiations;
CREATE POLICY "Permitir todo contract_negotiations" ON public.contract_negotiations FOR ALL USING (true);
ALTER TABLE public.contracts_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo contracts_audit_log" ON public.contracts_audit_log;
CREATE POLICY "Permitir todo contracts_audit_log" ON public.contracts_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_contracts_club ON public.contracts(club_id);
CREATE INDEX IF NOT EXISTS idx_contracts_player ON public.contracts(player_id);
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
ALTER TABLE public.manager_agent_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo manager_agent_relations" ON public.manager_agent_relations;
CREATE POLICY "Permitir todo manager_agent_relations" ON public.manager_agent_relations FOR ALL USING (true);
ALTER TABLE public.agent_action_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo agent_action_log" ON public.agent_action_log;
CREATE POLICY "Permitir todo agent_action_log" ON public.agent_action_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_manager_agent_rel ON public.manager_agent_relations(manager_id, agent_id);
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
DROP POLICY IF EXISTS "Permitir todo club_scouts" ON public.club_scouts;
CREATE POLICY "Permitir todo club_scouts" ON public.club_scouts FOR ALL USING (true);
ALTER TABLE public.scouting_missions_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo scouting_missions_log" ON public.scouting_missions_log;
CREATE POLICY "Permitir todo scouting_missions_log" ON public.scouting_missions_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_club_scouts_club ON public.club_scouts(club_id);
CREATE INDEX IF NOT EXISTS idx_scouting_missions_club ON public.scouting_missions_log(club_id);
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
DROP POLICY IF EXISTS "Permitir todo club_academies" ON public.club_academies;
CREATE POLICY "Permitir todo club_academies" ON public.club_academies FOR ALL USING (true);
ALTER TABLE public.youth_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo youth_candidates" ON public.youth_candidates;
CREATE POLICY "Permitir todo youth_candidates" ON public.youth_candidates FOR ALL USING (true);
ALTER TABLE public.youth_intake_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo youth_intake_audit_log" ON public.youth_intake_audit_log;
CREATE POLICY "Permitir todo youth_intake_audit_log" ON public.youth_intake_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_youth_candidates_club ON public.youth_candidates(club_id, status);
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
DROP POLICY IF EXISTS "Permitir todo staff_candidates" ON public.staff_candidates;
CREATE POLICY "Permitir todo staff_candidates" ON public.staff_candidates FOR ALL USING (true);
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo staff_audit_log" ON public.staff_audit_log;
CREATE POLICY "Permitir todo staff_audit_log" ON public.staff_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_staff_candidates_role ON public.staff_candidates(role, status);
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
ALTER TABLE public.financial_transactions_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo financial_transactions_ledger" ON public.financial_transactions_ledger;
CREATE POLICY "Permitir todo financial_transactions_ledger" ON public.financial_transactions_ledger FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_ledger_club ON public.financial_transactions_ledger(club_id, week_number);
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
DROP POLICY IF EXISTS "Permitir todo club_stadiums" ON public.club_stadiums;
CREATE POLICY "Permitir todo club_stadiums" ON public.club_stadiums FOR ALL USING (true);
ALTER TABLE public.stadium_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo stadium_projects" ON public.stadium_projects;
CREATE POLICY "Permitir todo stadium_projects" ON public.stadium_projects FOR ALL USING (true);
ALTER TABLE public.stadium_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo stadium_audit_log" ON public.stadium_audit_log;
CREATE POLICY "Permitir todo stadium_audit_log" ON public.stadium_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_stadium_projects_club ON public.stadium_projects(club_id, status);
CREATE INDEX IF NOT EXISTS idx_stadium_audit_club ON public.stadium_audit_log(club_id);
CREATE TABLE IF NOT EXISTS public.club_fanbase (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  loyal_members_count integer DEFAULT 350 NOT NULL,
  casual_fanbase_potential integer DEFAULT 2500 NOT NULL,
  fan_support_score integer DEFAULT 65 NOT NULL CHECK (fan_support_score BETWEEN 0 AND 100),
  stadium_atmosphere_status text DEFAULT 'PASSIONATE' NOT NULL CHECK (stadium_atmosphere_status IN ('HOSTILE_PROTEST', 'DISAPPOINTED', 'NEUTRAL', 'PASSIONATE', 'EUPHORIC_FORTRESS')),
  derby_rival_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  chants text[] DEFAULT ARRAY['¡Vamos los pibes!', '¡En las buenas y en las malas!'],
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
DROP POLICY IF EXISTS "Permitir todo club_fanbase" ON public.club_fanbase;
CREATE POLICY "Permitir todo club_fanbase" ON public.club_fanbase FOR ALL USING (true);
ALTER TABLE public.match_attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo match_attendance_records" ON public.match_attendance_records;
CREATE POLICY "Permitir todo match_attendance_records" ON public.match_attendance_records FOR ALL USING (true);
ALTER TABLE public.fanbase_events_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo fanbase_events_log" ON public.fanbase_events_log;
CREATE POLICY "Permitir todo fanbase_events_log" ON public.fanbase_events_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_fanbase_club ON public.club_fanbase(club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_home ON public.match_attendance_records(home_club_id);
CREATE INDEX IF NOT EXISTS idx_fanbase_events_club ON public.fanbase_events_log(club_id);
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
DROP POLICY IF EXISTS "Permitir todo club_board_confidence" ON public.club_board_confidence;
CREATE POLICY "Permitir todo club_board_confidence" ON public.club_board_confidence FOR ALL USING (true);
ALTER TABLE public.board_meetings_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo board_meetings_log" ON public.board_meetings_log;
CREATE POLICY "Permitir todo board_meetings_log" ON public.board_meetings_log FOR ALL USING (true);
ALTER TABLE public.manager_dismissals_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo manager_dismissals_log" ON public.manager_dismissals_log;
CREATE POLICY "Permitir todo manager_dismissals_log" ON public.manager_dismissals_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_board_conf_club ON public.club_board_confidence(club_id);
CREATE INDEX IF NOT EXISTS idx_board_meetings_club ON public.board_meetings_log(club_id);
CREATE INDEX IF NOT EXISTS idx_dismissals_club ON public.manager_dismissals_log(club_id);
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
ALTER TABLE public.press_qa_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo press_qa_items" ON public.press_qa_items;
CREATE POLICY "Permitir todo press_qa_items" ON public.press_qa_items FOR ALL USING (true);
ALTER TABLE public.press_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo press_audit_log" ON public.press_audit_log;
CREATE POLICY "Permitir todo press_audit_log" ON public.press_audit_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_press_qa_conf ON public.press_qa_items(conference_id);
CREATE INDEX IF NOT EXISTS idx_press_audit_manager ON public.press_audit_log(manager_id);
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
DROP POLICY IF EXISTS "Permitir todo club_locker_room" ON public.club_locker_room;
CREATE POLICY "Permitir todo club_locker_room" ON public.club_locker_room FOR ALL USING (true);
ALTER TABLE public.player_social_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo player_social_status" ON public.player_social_status;
CREATE POLICY "Permitir todo player_social_status" ON public.player_social_status FOR ALL USING (true);
ALTER TABLE public.locker_room_events_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo locker_room_events_log" ON public.locker_room_events_log;
CREATE POLICY "Permitir todo locker_room_events_log" ON public.locker_room_events_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_locker_club ON public.club_locker_room(club_id);
CREATE INDEX IF NOT EXISTS idx_player_social_club ON public.player_social_status(club_id);
CREATE INDEX IF NOT EXISTS idx_locker_events_club ON public.locker_room_events_log(club_id);
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
DROP POLICY IF EXISTS "Permitir todo player_personalities" ON public.player_personalities;
CREATE POLICY "Permitir todo player_personalities" ON public.player_personalities FOR ALL USING (true);
ALTER TABLE public.player_mentorships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo player_mentorships" ON public.player_mentorships;
CREATE POLICY "Permitir todo player_mentorships" ON public.player_mentorships FOR ALL USING (true);
ALTER TABLE public.personality_events_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo personality_events_log" ON public.personality_events_log;
CREATE POLICY "Permitir todo personality_events_log" ON public.personality_events_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_mentorship_club ON public.player_mentorships(club_id, status);
CREATE INDEX IF NOT EXISTS idx_personality_events_player ON public.personality_events_log(player_id);
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
DROP POLICY IF EXISTS "Permitir todo player_injuries" ON public.player_injuries;
CREATE POLICY "Permitir todo player_injuries" ON public.player_injuries FOR ALL USING (true);
ALTER TABLE public.medical_infiltrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo medical_infiltrations" ON public.medical_infiltrations;
CREATE POLICY "Permitir todo medical_infiltrations" ON public.medical_infiltrations FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_player_injuries_active ON public.player_injuries(player_id, is_cleared);
CREATE INDEX IF NOT EXISTS idx_player_injuries_club ON public.player_injuries(club_id, is_cleared);
CREATE INDEX IF NOT EXISTS idx_medical_infiltrations_player ON public.medical_infiltrations(player_id);
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
DROP POLICY IF EXISTS "Permitir todo player_evolution_history" ON public.player_evolution_history;
CREATE POLICY "Permitir todo player_evolution_history" ON public.player_evolution_history FOR ALL USING (true);
ALTER TABLE public.player_retirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo player_retirements" ON public.player_retirements;
CREATE POLICY "Permitir todo player_retirements" ON public.player_retirements FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_player_evolution_history_player ON public.player_evolution_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_evolution_history_club ON public.player_evolution_history(club_id, season_year);
CREATE INDEX IF NOT EXISTS idx_player_retirements_club ON public.player_retirements(club_id);
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
DROP POLICY IF EXISTS "Permitir todo season_snapshots" ON public.season_snapshots;
CREATE POLICY "Permitir todo season_snapshots" ON public.season_snapshots FOR ALL USING (true);
ALTER TABLE public.annual_financial_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo annual_financial_statements" ON public.annual_financial_statements;
CREATE POLICY "Permitir todo annual_financial_statements" ON public.annual_financial_statements FOR ALL USING (true);
ALTER TABLE public.season_transition_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo season_transition_log" ON public.season_transition_log;
CREATE POLICY "Permitir todo season_transition_log" ON public.season_transition_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_season_snapshots_career ON public.season_snapshots(career_id, season_year);
CREATE INDEX IF NOT EXISTS idx_annual_financial_club ON public.annual_financial_statements(club_id, season_year);
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
DROP POLICY IF EXISTS "Permitir todo league_tiers_config" ON public.league_tiers_config;
CREATE POLICY "Permitir todo league_tiers_config" ON public.league_tiers_config FOR ALL USING (true);
ALTER TABLE public.promotion_relegation_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo promotion_relegation_ledger" ON public.promotion_relegation_ledger;
CREATE POLICY "Permitir todo promotion_relegation_ledger" ON public.promotion_relegation_ledger FOR ALL USING (true);
ALTER TABLE public.playoff_fixtures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo playoff_fixtures" ON public.playoff_fixtures;
CREATE POLICY "Permitir todo playoff_fixtures" ON public.playoff_fixtures FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_prom_rel_career ON public.promotion_relegation_ledger(career_id, season_year);
CREATE INDEX IF NOT EXISTS idx_playoff_fixtures_career ON public.playoff_fixtures(career_id, season_year, division_tier);
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
DROP POLICY IF EXISTS "Permitir todo manager_job_offers" ON public.manager_job_offers;
CREATE POLICY "Permitir todo manager_job_offers" ON public.manager_job_offers FOR ALL USING (true);
ALTER TABLE public.manager_career_stints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo manager_career_stints" ON public.manager_career_stints;
CREATE POLICY "Permitir todo manager_career_stints" ON public.manager_career_stints FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_job_offers_manager_status ON public.manager_job_offers(manager_id, status);
CREATE INDEX IF NOT EXISTS idx_job_offers_career ON public.manager_job_offers(career_id);
CREATE INDEX IF NOT EXISTS idx_career_stints_manager ON public.manager_career_stints(manager_id);
CREATE INDEX IF NOT EXISTS idx_career_stints_career ON public.manager_career_stints(career_id);
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
DROP POLICY IF EXISTS "Permitir todo manager_reputation_ledger" ON public.manager_reputation_ledger;
CREATE POLICY "Permitir todo manager_reputation_ledger" ON public.manager_reputation_ledger FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_reputation_ledger_mgr ON public.manager_reputation_ledger(manager_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_ledger_career ON public.manager_reputation_ledger(career_id);
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
ALTER TABLE public.event_consequences_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo event_consequences_log" ON public.event_consequences_log;
CREATE POLICY "Permitir todo event_consequences_log" ON public.event_consequences_log FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_event_consequences_event ON public.event_consequences_log(event_id);
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
ALTER TABLE public.club_hemeroteca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo club_hemeroteca" ON public.club_hemeroteca;
CREATE POLICY "Permitir todo club_hemeroteca" ON public.club_hemeroteca FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_club_hemeroteca_club ON public.club_hemeroteca(club_id, created_at DESC);
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
DROP POLICY IF EXISTS "Permitir todo club_legends" ON public.club_legends;
CREATE POLICY "Permitir todo club_legends" ON public.club_legends FOR ALL USING (true);
ALTER TABLE public.retired_shirt_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo retired_shirt_numbers" ON public.retired_shirt_numbers;
CREATE POLICY "Permitir todo retired_shirt_numbers" ON public.retired_shirt_numbers FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_club_legends_club ON public.club_legends(club_id, status_level);
CREATE INDEX IF NOT EXISTS idx_retired_shirt_numbers_club ON public.retired_shirt_numbers(club_id);
