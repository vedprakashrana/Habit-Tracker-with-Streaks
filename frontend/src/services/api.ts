import { clientStore } from './clientStore';

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

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        this.setToken(null);
        window.dispatchEvent(new Event('habitflow_unauthorized'));
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 404 on API in static deployment, throw to trigger fallback
        const errorMsg = data.error || (data.details ? JSON.stringify(data.details) : 'Request failed');
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      // In static GitHub Pages deployment, if backend is not reachable, gracefully fallback to clientStore!
      return this.handleFallback<T>(endpoint, options);
    }
  }

  private handleFallback<T>(endpoint: string, options: RequestInit): T {
    const method = options.method || 'GET';

    if (endpoint === '/auth/me') {
      return { user: clientStore.getUser() } as any;
    }
    if (endpoint === '/auth/login' || endpoint === '/auth/register') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const user = clientStore.login(body.email || 'demo@habitflow.app');
      this.setToken('demo_token');
      return { message: 'Success', user, token: 'demo_token' } as any;
    }
    if (endpoint === '/auth/logout') {
      clientStore.logout();
      this.setToken(null);
      return { message: 'Logged out' } as any;
    }
    if (endpoint === '/dashboard') {
      return clientStore.getDashboardData() as any;
    }
    if (endpoint.startsWith('/habits') && method === 'GET') {
      if (endpoint.includes('/heatmap')) {
        const habitId = endpoint.split('/')[2];
        return clientStore.getHeatmap(habitId) as any;
      }
      if (endpoint.includes('?archived=true')) {
        return { habits: clientStore.getHabits(true), today: new Date().toISOString().split('T')[0] } as any;
      }
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2] && !parts[2].includes('?')) {
        const h = clientStore.getHabit(parts[2]);
        return { habit: h, recentCompletions: [], today: new Date().toISOString().split('T')[0] } as any;
      }
      return { habits: clientStore.getHabits(false), today: new Date().toISOString().split('T')[0] } as any;
    }
    if (endpoint === '/habits' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const habit = clientStore.createHabit(body);
      return { message: 'Habit created', habit } as any;
    }
    if (endpoint.startsWith('/habits/') && method === 'PATCH') {
      const habitId = endpoint.split('/')[2];
      const body = options.body ? JSON.parse(options.body as string) : {};
      const habit = clientStore.updateHabit(habitId, body);
      return { message: 'Habit updated', habit } as any;
    }
    if (endpoint.includes('/archive')) {
      const habitId = endpoint.split('/')[2];
      const habit = clientStore.archiveHabit(habitId);
      return { message: 'Habit archived', habit } as any;
    }
    if (endpoint.includes('/restore')) {
      const habitId = endpoint.split('/')[2];
      const habit = clientStore.restoreHabit(habitId);
      return { message: 'Habit restored', habit } as any;
    }
    if (endpoint.startsWith('/habits/') && method === 'DELETE') {
      const parts = endpoint.split('/');
      if (parts.includes('completions')) {
        const habitId = parts[2];
        const date = parts[4];
        clientStore.removeCompletion(habitId, date);
        return { message: 'Removed', currentStreak: 0, longestStreak: 0, isCompletedToday: false } as any;
      }
      const habitId = parts[2];
      clientStore.deleteHabit(habitId);
      return { message: 'Deleted' } as any;
    }
    if (endpoint.includes('/completions') && method === 'PUT') {
      const parts = endpoint.split('/');
      const habitId = parts[2];
      const date = parts[4];
      clientStore.setCompletion(habitId, date);
      return { message: 'Completed', currentStreak: 1, longestStreak: 1, isCompletedToday: true } as any;
    }
    if (endpoint.startsWith('/stats')) {
      return clientStore.getStats() as any;
    }

    throw new Error(`Endpoint ${endpoint} not found in fallback.`);
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
