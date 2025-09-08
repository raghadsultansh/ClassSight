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
    let userId = localStorage.getItem('x-user-id')
    let userRole = localStorage.getItem('x-user-role')
    
    // Set default values if not present
    if (!userId) {
      userId = '1'
      localStorage.setItem('x-user-id', userId)
    }
    if (!userRole) {
      userRole = 'admin'
      localStorage.setItem('x-user-role', userRole)
    }
    
    defaultHeaders['x-user-id'] = userId
    defaultHeaders['x-user-role'] = userRole
  } else {
    // Server-side defaults
    defaultHeaders['x-user-id'] = '1'
    defaultHeaders['x-user-role'] = 'admin'
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    console.log('Frontend API Request:', { url, method: config.method, headers: config.headers })
    
    const response = await fetch(url, config)
    
    console.log('Frontend API Response:', { url, status: response.status, ok: response.ok })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText
      })
      
      let errorData = null
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        // Not JSON
      }
      
      throw new APIError(
        response.status,
        errorData?.detail || errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      )
    }

    const data = await response.json()
    console.log('Frontend API Success:', { url, dataKeys: Object.keys(data) })
    return data
  } catch (error) {
    console.error('API Request Failed:', { url, error: error instanceof Error ? error.message : error })
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(500, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Specific API methods
export const dashboardAPI = {
  getKpis: (filters: any) => fastApiRequest('/dashboard/kpis', {
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
  getStudentMetrics: (filters: any) => fastApiRequest('/dashboard/student-metrics', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getGradePerformance: (filters: any) => fastApiRequest('/dashboard/grade-performance', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getInstructorPerformance: (filters: any) => fastApiRequest('/dashboard/instructor-performance', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getCorrelationAnalysis: (filters: any) => fastApiRequest('/dashboard/correlation-analysis', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getHeatmapData: (filters: any) => fastApiRequest('/dashboard/heatmap-data', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getLeaderboard: (filters: any) => fastApiRequest('/dashboard/leaderboard', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getBootcampComparison: (filters: any) => fastApiRequest('/dashboard/bootcamp-comparison', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getPredictiveInsights: (filters: any) => fastApiRequest('/dashboard/predictive-insights', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getEngagementMetrics: (filters: any) => fastApiRequest('/dashboard/engagement-metrics', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  // Legacy methods for backwards compatibility
  getGradeDistribution: (filters: any) => fastApiRequest('/dashboard/grade-distribution', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  getAttendanceHeatmap: (filters: any) => fastApiRequest('/dashboard/attendance-heatmap', {
    method: 'POST',
    body: JSON.stringify(filters)
  }),
  // Filter data methods
  getBootcamps: (includeCompleted = false) => fastApiRequest(`/dashboard/bootcamps?include_completed=${includeCompleted}`, {
    method: 'GET'
  }),
  getInstructors: () => fastApiRequest('/dashboard/instructors', {
    method: 'GET'
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
