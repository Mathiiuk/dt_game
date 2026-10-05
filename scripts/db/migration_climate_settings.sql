-- Ajustes del clima por club: dificultad y avisos silenciados (se reactivan tras un escándalo o una racha de 5 victorias).
alter table club_climate add column if not exists difficulty text not null default 'NORMAL';
alter table club_climate add column if not exists muted_warnings jsonb not null default '{}'::jsonb;
alter table club_climate drop constraint if exists club_climate_difficulty_check;
alter table club_climate add constraint club_climate_difficulty_check check (difficulty in ('RELAXED', 'NORMAL', 'REALISTIC'));
