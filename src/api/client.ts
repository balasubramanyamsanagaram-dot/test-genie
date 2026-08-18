const API_BASE_URL = 'http://localhost:4600/api/v1';
const JIRA_CLOUD_HOST = 'https://brilyant-team-ouq206ed.atlassian.net';

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

export interface DirectJiraPayload {
  projectKey: string;
  summary: string;
  description: string;
  severity?: string;
  assignedDeveloper?: string;
  raisedBy?: string;
}

export async function createDirectJiraIssue(payload: DirectJiraPayload): Promise<{ issueKey: string; issueUrl: string } | null> {
  const projectKey = (payload.projectKey || 'HGA').trim().toUpperCase();
  const bodyData = {
    fields: {
      project: { key: projectKey === 'HRM' ? 'HGA' : projectKey },
      summary: payload.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: payload.description || 'Defect raised by TestGenie Enterprise QA Platform' }]
          }
        ]
      },
      issuetype: { name: 'Bug' },
      priority: { name: payload.severity === 'Blocker' || payload.severity === 'Critical' ? 'High' : 'Medium' }
    }
  };

  const metaEnv = (import.meta as any).env || {};
  const jiraEmail = metaEnv.VITE_JIRA_USER_EMAIL || 'admin@brilyant.com';
  const jiraToken = metaEnv.VITE_JIRA_API_TOKEN || '';
  if (!jiraToken) return null;

  const authHeader = 'Basic ' + btoa(`${jiraEmail}:${jiraToken}`);
  const endpoints = ['/jira-proxy/rest/api/3/issue', `${JIRA_CLOUD_HOST}/rest/api/3/issue`];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.key) {
          return {
            issueKey: data.key,
            issueUrl: `${JIRA_CLOUD_HOST}/browse/${data.key}`
          };
        }
      }
    } catch (e) {
      console.warn(`[Jira Direct Fallback Warning] Endpoint ${endpoint} unreachable:`, e);
    }
  }

  return null;
}
