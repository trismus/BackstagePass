/**
 * Vitest Test Setup
 */

import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var mockSupabase: ReturnType<typeof createMockSupabaseClient>
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockData: Record<string, unknown[]> = {}

  const createQueryBuilder = () => {
    let currentTable = ''
    let currentData: unknown[] = []
    let filters: Array<{ column: string; value: unknown; op: string }> = []

    const applyFilters = (data: unknown[]) => {
      return data.filter((item) => {
        return filters.every(({ column, value, op }) => {
          const itemValue = (item as Record<string, unknown>)[column]
          switch (op) {
            case 'eq': return itemValue === value
            case 'neq': return itemValue !== value
            case 'in': return (value as unknown[]).includes(itemValue)
            case 'gte': return itemValue >= value
            case 'lte': return itemValue <= value
            default: return true
          }
        })
      })
    }

    const queryBuilder = {
      select: vi.fn().mockImplementation(() => {
        currentData = mockData[currentTable] || []
        return queryBuilder
      }),
      insert: vi.fn().mockImplementation((data: unknown) => {
        const newItem = { id: `mock-${Date.now()}`, ...data as object }
        if (!mockData[currentTable]) mockData[currentTable] = []
        mockData[currentTable].push(newItem)
        currentData = [newItem]
        return queryBuilder
      }),
      update: vi.fn().mockImplementation(() => queryBuilder),
      delete: vi.fn().mockImplementation(() => queryBuilder),
      eq: vi.fn().mockImplementation((column: string, value: unknown) => {
        filters.push({ column, value, op: 'eq' })
        return queryBuilder
      }),
      neq: vi.fn().mockImplementation((column: string, value: unknown) => {
        filters.push({ column, value, op: 'neq' })
        return queryBuilder
      }),
      in: vi.fn().mockImplementation((column: string, value: unknown[]) => {
        filters.push({ column, value, op: 'in' })
        return queryBuilder
      }),
      gte: vi.fn().mockImplementation((column: string, value: unknown) => {
        filters.push({ column, value, op: 'gte' })
        return queryBuilder
      }),
      lte: vi.fn().mockImplementation((column: string, value: unknown) => {
        filters.push({ column, value, op: 'lte' })
        return queryBuilder
      }),
      order: vi.fn().mockImplementation(() => queryBuilder),
      limit: vi.fn().mockImplementation(() => queryBuilder),
      single: vi.fn().mockImplementation(() => {
        const filtered = applyFilters(currentData)
        filters = []
        return Promise.resolve({
          data: filtered[0] || null,
          error: filtered.length === 0 ? { message: 'Not found' } : null,
        })
      }),
      then: (resolve: (result: { data: unknown[]; error: null }) => void) => {
        const filtered = applyFilters(currentData)
        filters = []
        resolve({ data: filtered, error: null })
      },
    }

    return {
      from: vi.fn().mockImplementation((table: string) => {
        currentTable = table
        filters = []
        return queryBuilder
      }),
      setData: (table: string, data: unknown[]) => {
        mockData[table] = data
      },
      clearData: () => {
        Object.keys(mockData).forEach(key => delete mockData[key])
      },
    }
  }

  return createQueryBuilder()
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
