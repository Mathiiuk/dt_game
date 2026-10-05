# Ejecución: f3-p2-club-screen

- ClubScreen rediseñada: PageHeader, resumen (presupuesto, sueldos, margen, academia), pestañas del sistema de diseño con scroll horizontal, gestión de staff y academia con estados vacíos y confirmación al despedir.
- Paneles internos con `fixed inset-0` migrados a `ResponsiveOverlay`: ficha médica (Enfermería), capitanía (Vestuario) y retiro de camiseta (Ídolos).
- `scripts/restyle-tokens.cjs`: migra la paleta antigua (zinc/emerald/amber/red) a tokens; aplicado a las pestañas internas del club (coherencia visual) y reutilizable en las demás pantallas.
- Verificado a 375 px: las 8 pestañas cargan sin desborde ni errores. 139 tests en verde.
