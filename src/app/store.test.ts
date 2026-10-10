import * as toolkit from '@reduxjs/toolkit'
import { makeStore } from './store'

vi.mock('@reduxjs/toolkit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@reduxjs/toolkit')>()
  return { ...actual, configureStore: vi.fn(actual.configureStore) }
})

const lastOptions = () => vi.mocked(toolkit.configureStore).mock.calls.at(-1)?.[0]

describe('makeStore', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('no build de produção, sem DevTools: elas registrariam a senha provisória e os tokens', () => {
    vi.stubEnv('DEV', false)

    makeStore()

    expect(lastOptions()?.devTools).toBe(false)
  })

  it('em desenvolvimento, com DevTools', () => {
    vi.stubEnv('DEV', true)

    makeStore()

    expect(lastOptions()?.devTools).toBe(true)
  })
})
