const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

const sql = `
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    who_id uuid NOT NULL, -- ID del usuario/manager que realiza la accion
    what_action text NOT NULL, -- Ej: 'TRANSFER_PLAYER', 'FIRE_MANAGER', 'UPGRADE_STADIUM'
    entity_type text, -- Ej: 'player', 'club', 'manager'
    entity_id uuid, -- ID de la entidad afectada
    state_before jsonb, -- Estado previo a la accion
    state_after jsonb, -- Estado posterior a la accion
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices para busquedas rapidas de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_who ON public.audit_log(who_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(what_action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully for audit_log!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
