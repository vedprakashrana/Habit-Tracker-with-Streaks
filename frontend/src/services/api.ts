const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('habitflow_token');
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('habitflow_token', token);
    } else {
      localStorage.removeItem('habitflow_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Check if 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      this.setToken(null);
      // Trigger auth event or redirect if needed
      window.dispatchEvent(new Event('habitflow_unauthorized'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || (data.details ? JSON.stringify(data.details) : 'Request failed');
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Auth Endpoints
  async register(body: { name: string; email: string; password: string; timezone?: string }) {
    return this.request<{ message: string; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(body: { email: string; password: string }) {
    return this.request<{ message: string; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateTimezone(timezone: string) {
    return this.request<{ message: string; timezone: string }>('/auth/timezone', {
      method: 'PATCH',
      body: JSON.stringify({ timezone }),
    });
  }

  // Dashboard Endpoint
  async getDashboard() {
    return this.request<any>('/dashboard');
  }

  // Habits Endpoints
  async getHabits(archived = false) {
    return this.request<{ habits: any[]; today: string }>(`/habits?archived=${archived}`);
  }

  async getHabitById(id: string) {
    return this.request<{ habit: any; recentCompletions: any[]; today: string }>(`/habits/${id}`);
  }

  async createHabit(body: any) {
    return this.request<{ message: string; habit: any }>('/habits', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateHabit(id: string, body: any) {
    return this.request<{ message: string; habit: any }>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async archiveHabit(id: string) {
    return this.request<{ message: string; habit: any }>(`/habits/${id}/archive`, {
      method: 'POST',
    });
  }

  async restoreHabit(id: string) {
    return this.request<{ message: string; habit: any }>(`/habits/${id}/restore`, {
      method: 'POST',
    });
  }

  async deleteHabit(id: string) {
    return this.request<{ message: string }>(`/habits/${id}`, {
      method: 'DELETE',
    });
  }

  // Completions Endpoints
  async getCompletions(habitId: string) {
    return this.request<{ completions: any[] }>(`/habits/${habitId}/completions`);
  }

  async setCompletion(habitId: string, date: string) {
    return this.request<{
      message: string;
      completion: any;
      currentStreak: number;
      longestStreak: number;
      isCompletedToday: boolean;
    }>(`/habits/${habitId}/completions/${date}`, {
      method: 'PUT',
    });
  }

  async removeCompletion(habitId: string, date: string) {
    return this.request<{
      message: string;
      currentStreak: number;
      longestStreak: number;
      isCompletedToday: boolean;
    }>(`/habits/${habitId}/completions/${date}`, {
      method: 'DELETE',
    });
  }

  // Heatmap Endpoint
  async getHeatmap(habitId: string, months = 6) {
    return this.request<any>(`/habits/${habitId}/heatmap?months=${months}`);
  }

  // Statistics Endpoint
  async getStats(days = 30) {
    return this.request<any>(`/stats?days=${days}`);
  }
}

export const api = new ApiClient();
