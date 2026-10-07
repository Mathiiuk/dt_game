// Cláusula de recompra: lo que cuesta dejarla y por cuánto se recompra. Mismo cálculo que grant_buyback en la base (los tests lo comparan).
export const BUYBACK_COST_SHARE = 0.10 // se paga el 10% de la venta al dejar la cláusula
export const BUYBACK_PRICE_FACTOR = 1.25 // se recompra por el 125% de lo cobrado

export function buybackTerms(fee) {
  const f = Number(fee || 0)
  return { cost: Math.round(f * BUYBACK_COST_SHARE), price: Math.round(f * BUYBACK_PRICE_FACTOR) }
}
