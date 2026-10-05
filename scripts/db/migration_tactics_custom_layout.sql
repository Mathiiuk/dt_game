-- Alineación libre: posiciones personalizadas de los 11 jugadores sobre la cancha ([{ slot, x, y }]).
-- Con formation = 'LIBRE' la táctica usa este layout en vez de una formación fija.
alter table tactics add column if not exists custom_layout jsonb;
