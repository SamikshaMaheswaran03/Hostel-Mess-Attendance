import { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import * as api from '../api'
import { useQuery } from '../hooks/useQuery'

const AttendanceContext = createContext(undefined)

const MEALS = ['breakfast', 'lunch', 'dinner']
const EMPTY_SUMMARY = Object.fromEntries(MEALS.map((meal) => [meal, 0]))

const initialState = { summary: EMPTY_SUMMARY }

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload }
    default:
      return state
  }
}

export function AttendanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useQuery({
    queryKey: 'summary',
    fetcher: () => api.getSummary(),
    refetchInterval: 5000,
    onSuccess: (data) => dispatch({ type: 'SET_SUMMARY', payload: data.summary })
  })

  const markAttendance = useCallback(async (studentId, meal, payload = {}) => {
    const data = await api.markAttendance(studentId, meal, payload)
    if (data.summary) {
      dispatch({ type: 'SET_SUMMARY', payload: data.summary })
    }
    return data
  }, [])

  const value = useMemo(
    () => ({ summary: state.summary, markAttendance }),
    [state.summary, markAttendance]
  )

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}

export function useAttendance() {
  const context = useContext(AttendanceContext)
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider')
  return context
}
