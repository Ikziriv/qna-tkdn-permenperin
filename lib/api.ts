const API_URL = import.meta.env.VITE_API_URL || "/api";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function getAccessToken() {
  return localStorage.getItem("tkdn_token");
}

function getRefreshToken() {
  return localStorage.getItem("tkdn_refresh_token");
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("tkdn_token", accessToken);
  localStorage.setItem("tkdn_refresh_token", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("tkdn_token");
  localStorage.removeItem("tkdn_refresh_token");
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
}

async function fetchJson(path: string, options: RequestInit = {}, retry = true): Promise<any> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await doRefresh();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        return fetchJson(path, options, false);
      } else {
        clearTokens();
        window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Session expired. Please log in again.");
      }
    } else {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async (newToken) => {
          try {
            const retryRes = await fetch(`${API_URL}${path}`, {
              ...options,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
                ...options.headers,
              },
            });
            const data = await retryRes.json().catch(() => ({}));
            if (!retryRes.ok) {
              reject(new Error(data.error || `Request failed: ${retryRes.status}`));
            } else {
              resolve(data);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      fetchJson(`${API_URL}/auth/register`, { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string; mfaCode?: string }) =>
      fetchJson(`${API_URL}/auth/login`, { method: "POST", body: JSON.stringify(body) }),
    refresh: (refreshToken: string) =>
      fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }),
    logout: (refreshToken: string) =>
      fetchJson(`${API_URL}/auth/logout`, { method: "POST", body: JSON.stringify({ refreshToken }) }),
    logoutAll: () => fetchJson(`${API_URL}/auth/logout-all`, { method: "POST" }),
    me: () => fetchJson(`${API_URL}/auth/me`),
    mfaSetup: () => fetchJson(`${API_URL}/auth/mfa/setup`, { method: "POST" }),
    mfaVerify: (code: string) => fetchJson(`${API_URL}/auth/mfa/verify`, { method: "POST", body: JSON.stringify({ code }) }),
    mfaDisable: (code: string) => fetchJson(`${API_URL}/auth/mfa/disable`, { method: "POST", body: JSON.stringify({ code }) }),
  },
  quiz: {
    getQuizzes: () => fetchJson(`${API_URL}/quiz/quizzes`),
    createAttempt: (body: { quizId: number; totalQuestions: number }) =>
      fetchJson(`${API_URL}/quiz/attempts`, { method: "POST", body: JSON.stringify(body) }),
    completeAttempt: (id: number, body: { score: number; correctAnswers: number; timeSpentSeconds: number }) =>
      fetchJson(`${API_URL}/quiz/attempts/${id}/complete`, { method: "PATCH", body: JSON.stringify(body) }),
    saveResponses: (body: { attemptId: number; responses: Array<{ questionId: number; selectedAnswerIndex: number; isCorrect: boolean }> }) =>
      fetchJson(`${API_URL}/quiz/responses`, { method: "POST", body: JSON.stringify(body) }),
    getMyAttempts: () => fetchJson(`${API_URL}/quiz/my-attempts`),
    getMyProgress: () => fetchJson(`${API_URL}/quiz/my-progress`),
    getAttemptResponses: (id: number) => fetchJson(`${API_URL}/quiz/attempts/${id}/responses`),
    exportData: () =>
      fetch(`${API_URL}/quiz/export`, {
        headers: {
          Authorization: `Bearer ${getAccessToken() || ""}`,
        },
      }),
    anonymous: {
      start: (body: { quizId: number; totalQuestions: number }) =>
        fetch(`${API_URL}/quiz/anonymous/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      complete: (token: string, body: { score: number; correctAnswers: number; timeSpentSeconds: number; responses?: any[] }) =>
        fetch(`${API_URL}/quiz/anonymous/${token}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      preview: (token: string) =>
        fetch(`${API_URL}/quiz/anonymous/${token}/preview`),
      link: (token: string) =>
        fetchJson(`${API_URL}/quiz/anonymous/${token}/link`, { method: "POST" }),
    },
  },
  admin: {
    getStats: () => fetchJson(`${API_URL}/admin/stats`),
    getAttempts: () => fetchJson(`${API_URL}/admin/attempts`),
    getUsers: () => fetchJson(`${API_URL}/admin/users`),
    getUser: (id: number) => fetchJson(`${API_URL}/admin/users/${id}`),
    updateRole: (id: number, body: { role: string }) =>
      fetchJson(`${API_URL}/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify(body) }),
    updateStatus: (id: number, body: { isActive: boolean }) =>
      fetchJson(`${API_URL}/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteUser: (id: number) => fetchJson(`${API_URL}/admin/users/${id}`, { method: "DELETE" }),
    getLeaderboard: () => fetchJson(`${API_URL}/admin/leaderboard`),
    getDailyActivity: () => fetchJson(`${API_URL}/admin/daily-activity`),
    generateReport: (body: { name: string; format: string; params?: any }) =>
      fetchJson(`${API_URL}/admin/reports/generate`, { method: "POST", body: JSON.stringify(body) }),
    getReports: () => fetchJson(`${API_URL}/admin/reports`),
    downloadReport: (id: number) =>
      fetch(`${API_URL}/admin/reports/${id}/download`, { headers: { Authorization: `Bearer ${getAccessToken() || ""}` } }),
    getReportAccessLogs: (id: number) => fetchJson(`${API_URL}/admin/reports/${id}/access-logs`),
  },
};

export { setTokens, clearTokens, getAccessToken, getRefreshToken };
