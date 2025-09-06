// API connection utility - uses Next.js API routes as proxy to FastAPI
const API_BASE_URL = '/api'

export class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'APIError'
  }
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export async function fastApiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth headers from localStorage
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('x-user-id')
    const userRole = localStorage.getItem('x-user-role')
    
    if (userId) {
      defaultHeaders['x-user-id'] = userId
    }
    if (userRole) {
      defaultHeaders['x-user-role'] = userRole
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new APIError(
        response.status,
        errorData?.detail || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(500, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Specific API methods
export const dashboardAPI = {
  getKPIs: (filters: any) => fastApiRequest('/dashboard/kpis', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getAttendanceChart: (filters: any) => fastApiRequest('/dashboard/attendance-chart', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getAttentionChart: (filters: any) => fastApiRequest('/dashboard/attention-chart', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getGradeDistribution: (filters: any) => fastApiRequest('/dashboard/grade-distribution', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getLeaderboard: (filters: any) => fastApiRequest('/dashboard/leaderboard', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getAttendanceHeatmap: (filters: any) => fastApiRequest('/dashboard/attendance-heatmap', {
    method: 'POST',
    body: JSON.stringify(filters)
  })
}

export const bootcampsAPI = {
  getAll: () => fastApiRequest('/bootcamps'),
  getById: (id: string) => fastApiRequest(`/bootcamps/${id}`),
  create: (data: any) => fastApiRequest('/bootcamps', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: any) => fastApiRequest(`/bootcamps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => fastApiRequest(`/bootcamps/${id}`, {
    method: 'DELETE'
  })
}

export const reportsAPI = {
  getAll: (filters: any) => fastApiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  create: (data: any) => fastApiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export const gradesAPI = {
  getAll: (filters: any) => fastApiRequest('/grades', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  update: (id: string, data: any) => fastApiRequest(`/grades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export const assistantAPI = {
  chat: (message: string, model?: string) => fastApiRequest('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, model })
  })
}

export const adminAPI = {
  getInstructors: () => fastApiRequest('/admin-instructors'),
  approveInstructor: (id: string) => fastApiRequest(`/admin-instructors/${id}/approve`, {
    method: 'POST'
  }),
  rejectInstructor: (id: string) => fastApiRequest(`/admin-instructors/${id}/reject`, {
    method: 'POST'
  }),
  assignBootcamp: (instructorId: string, bootcampId: string) => fastApiRequest('/admin-instructors/assign', {
    method: 'POST',
    body: JSON.stringify({ instructor_id: instructorId, bootcamp_id: bootcampId })
  })
}

export const myBootcampsAPI = {
  getAll: () => fastApiRequest('/my-bootcamps'),
  getById: (id: string) => fastApiRequest(`/my-bootcamps/${id}`)
}
