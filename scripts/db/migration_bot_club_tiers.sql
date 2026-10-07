-- Categoría real de los clubes rivales (bolsa de trabajo con todas las divisiones).
--
-- Los clubes de la IA se creaban sin categoría y quedaban en la 1 (valor por defecto): la bolsa de trabajo ofrecía 15 clubes de
-- "Primera División" que el DT no podía conseguir. Ahora se crean con la categoría de su liga (src/api/competition.js) y este script
-- corrige los existentes con el nivel de la competición en la que juegan.
update public.clubs c set league_tier = comp.level
from public.standings s
join public.competitions comp on comp.id = s.competition_id
where s.club_id = c.id and c.history_type = 'bot' and comp.level is not null;
