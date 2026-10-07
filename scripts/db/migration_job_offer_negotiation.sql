-- Rondas de negociación ya usadas en una oferta de trabajo (máximo 2, ver src/domain/jobNegotiation.js).
alter table public.manager_job_offers add column if not exists negotiation_rounds integer not null default 0;
