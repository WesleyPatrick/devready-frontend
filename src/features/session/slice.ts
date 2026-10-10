import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

export type ItemKey = { kind: 'question' | 'challenge'; position: number }

type State = { current: Record<string, ItemKey> }

const initialState: State = { current: {} }

const slice = createSlice({
  name: 'sessionUi',
  initialState,
  reducers: {
    itemSelected(state, action: PayloadAction<{ sessionId: string; item: ItemKey }>) {
      state.current[action.payload.sessionId] = action.payload.item
    },
  },
})

export const { itemSelected } = slice.actions
export const sessionUiReducer = slice.reducer

export function selectCurrentItem(state: RootState, sessionId: string): ItemKey | undefined {
  return state.sessionUi.current[sessionId]
}
