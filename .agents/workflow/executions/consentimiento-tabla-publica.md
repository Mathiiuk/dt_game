# Acuerdo de privacidad para la tabla pública de los mejores DT

**Problema:** la tabla de la portada mostraba el nombre del DT de todos sin que nadie lo hubiera aceptado.

**Solución (consentimiento opt-in, revocable):**
- Base de datos (aditivo, **ya aplicado en producción**): `managers.public_ranking boolean not null default false`; `public_top_managers` exige `public_ranking = true`. Todos los DT existentes quedaron fuera (0 consentidos de 15): la tabla pública está vacía hasta que alguien acepte. Probado con un bloque con rollback: sin consentimiento 0 filas, con consentimiento 1, al retirarlo 0.
- Al crear el DT (`CreateManagerWizard`, paso Firma): casilla **sin tildar** con la explicación; `managerApi.createManager` guarda `public_ranking` (solo si es `true`).
- En Más → Privacidad (`PublicRankingCard`): interruptor para activar o retirar el consentimiento en cualquier momento (`managerApi.setPublicRanking`; si falla, vuelve atrás y avisa).
- Política de privacidad: sección "Tabla pública de los mejores DT: solo si lo aceptás" (qué se publica y qué nunca, 10 partidos, cómo se retira, qué pasa al eliminar la cuenta, contacto) y mención en "Qué datos guardamos".
- Novedades: aviso para los DT existentes.

**Tests:** asistente (2), tarjeta de Más (5), política (4), SQL estático (4).
