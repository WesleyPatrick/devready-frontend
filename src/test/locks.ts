export function installFakeLocks(whileWaiting: () => void = () => {}) {
  const requested: string[] = []
  const locks = {
    request: async (name: string, callback: () => Promise<unknown>) => {
      requested.push(name)
      whileWaiting()
      return callback()
    },
  }
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true })
  return { requested }
}

export function removeFakeLocks() {
  Reflect.deleteProperty(navigator, 'locks')
}
