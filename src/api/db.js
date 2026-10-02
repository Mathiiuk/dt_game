import localforage from 'localforage'

// Configure localforage instance
localforage.config({
  name: 'DtGameDB',
  version: 1.0,
  storeName: 'dt_game_data', // Should be alphanumeric, with underscores.
  description: 'Simulated backend database for DT Game'
})

// Initialize collections if they don't exist
export const initDB = async () => {
  const users = await localforage.getItem('users')
  if (!users) {
    await localforage.setItem('users', [])
  }
  
  const careers = await localforage.getItem('careers')
  if (!careers) {
    await localforage.setItem('careers', [])
  }
}

export const getCollection = async (collection) => {
  return await localforage.getItem(collection) || []
}

export const saveCollection = async (collection, data) => {
  return await localforage.setItem(collection, data)
}
