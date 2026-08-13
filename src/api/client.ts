const API_BASE_URL = 'http://localhost:4600/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[TestGenie API Warning] Endpoint '${endpoint}' unreachable. Using client-side storage fallback.`, error);
    return null;
  }
}
