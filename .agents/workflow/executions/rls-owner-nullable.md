# rls-owner-nullable

Al correr `migration_rls_owner_isolation.sql` en el editor SQL fallaba: `owner_user_id` se agregaba como NOT NULL con default `auth.uid()`, que en el editor es nulo, y las filas existentes quedaban nulas.

Fix: la columna es nula-permitida. Las filas existentes (datos de prueba) quedan sin dueño y ninguna cuenta las ve; las nuevas toman `auth.uid()` por defecto y las políticas siguen exigiendo `owner_user_id = auth.uid()`. El bloque es atómico: el intento fallido no dejó nada aplicado.
