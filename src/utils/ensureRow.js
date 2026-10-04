/**
 * Garantiza que exista una fila (idempotente y seguro ante cargas concurrentes).
 * Usa upsert con ignoreDuplicates sobre la columna única y luego lee la fila vigente,
 * evitando los 409 (violación de unicidad) cuando dos pantallas inicializan lo mismo a la vez.
 */
export async function ensureRow(supabase, table, row, conflictColumn) {
  const { error: upsertError } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictColumn, ignoreDuplicates: true })

  if (upsertError) return { data: null, error: upsertError }

  return supabase
    .from(table)
    .select('*')
    .eq(conflictColumn, row[conflictColumn])
    .maybeSingle()
}
