import { supabase } from './supabase'

export const auditApi = {
  /**
   * Registra una accion en el audit log
   * @param {Object} params
   * @param {string} params.whoId - ID del manager/usuario (requerido)
   * @param {string} params.action - Nombre de la accion (ej: 'TRANSFER_PLAYER') (requerido)
   * @param {string} [params.entityType] - Tipo de entidad afectada (ej: 'player')
   * @param {string} [params.entityId] - ID de la entidad afectada
   * @param {Object} [params.stateBefore] - Estado previo (JSON)
   * @param {Object} [params.stateAfter] - Estado posterior (JSON)
   */
  async logAction({ whoId, action, entityType = null, entityId = null, stateBefore = null, stateAfter = null }) {
    if (!whoId || !action) {
      console.warn('auditApi.logAction requires whoId and action')
      return false
    }

    try {
      const { error } = await supabase.from('audit_log').insert({
        who_id: whoId,
        what_action: action,
        entity_type: entityType,
        entity_id: entityId,
        state_before: stateBefore,
        state_after: stateAfter
      })
      
      if (error) {
        console.error('Failed to write audit log:', error)
        return false
      }
      return true
    } catch (e) {
      console.error('Exception writing audit log:', e)
      return false
    }
  }
}
