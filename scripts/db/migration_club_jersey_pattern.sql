-- Diseño de la camiseta titular del club (aditivo): columna nueva y opcional; los clubes existentes quedan con NULL y se ven como hasta ahora (franja central).
alter table public.clubs add column if not exists jersey_pattern text;
