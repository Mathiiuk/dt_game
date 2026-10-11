// Cosas que la persona tiene a medias (cambios sin guardar, una historia abierta): mientras haya alguna, no se aplica ninguna actualización.
// Cada razón se marca con su nombre y se libera cuando termina; puede haber varias a la vez.
const reasons = new Set()

export const markBusy = (reason) => { reasons.add(reason) }
export const clearBusy = (reason) => { reasons.delete(reason) }
export const isBusy = () => reasons.size > 0
export const resetBusy = () => reasons.clear()
