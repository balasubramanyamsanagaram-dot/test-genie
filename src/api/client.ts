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
  const metaEnv = (import.meta as any).env || {};
  const jiraEmail = metaEnv.VITE_JIRA_USER_EMAIL || 'admin@brilyant.com';
  const jiraToken = metaEnv.VITE_JIRA_API_TOKEN || '';
  if (!jiraToken) return null;

  const authHeader = 'Basic ' + btoa(`${jiraEmail}:${jiraToken}`);
  const rawKey = (payload.projectKey || 'HGA').trim().toUpperCase();
  const cleanProjKey = rawKey === 'HRM' ? 'HGA' : rawKey;

  // Resolve assignee accountId
  let assigneeAccountId: string | null = null;
  if (payload.assignedDeveloper && payload.assignedDeveloper !== 'Unassigned') {
    try {
      const userRes = await fetch(`/jira-proxy/rest/api/3/user/assignable/search?project=${cleanProjKey}`, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      });
      if (userRes.ok) {
        const assignableUsers = await userRes.json();
        if (Array.isArray(assignableUsers)) {
          const query = payload.assignedDeveloper.trim().toLowerCase();
          const matched = assignableUsers.find((u: any) =>
            u.accountId === payload.assignedDeveloper ||
            u.displayName.toLowerCase().includes(query) ||
            (u.emailAddress && u.emailAddress.toLowerCase().includes(query))
          );
          if (matched) {
            assigneeAccountId = matched.accountId;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to resolve assignee accountId:', e);
    }
  }

  const bodyData = {
    fields: {
      project: { key: cleanProjKey },
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
      priority: { name: payload.severity === 'Blocker' || payload.severity === 'Critical' ? 'High' : 'Medium' },
      ...(assigneeAccountId ? { assignee: { accountId: assigneeAccountId } } : {})
    }
  };

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
          const createdKey = data.key;
          if (assigneeAccountId) {
            try {
              const putUrl = endpoint.startsWith('/jira-proxy')
                ? `/jira-proxy/rest/api/3/issue/${createdKey}/assignee`
                : `${JIRA_CLOUD_HOST}/rest/api/3/issue/${createdKey}/assignee`;

              await fetch(putUrl, {
                method: 'PUT',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ accountId: assigneeAccountId })
              });
            } catch (e) {
              console.warn('[Jira Assignee PUT Warning] Could not set assignee:', e);
            }
          }

          return {
            issueKey: createdKey,
            issueUrl: `${JIRA_CLOUD_HOST}/browse/${createdKey}`
          };
        }
      }
    } catch (e) {
      console.warn(`[Jira Direct Fallback Warning] Endpoint ${endpoint} unreachable:`, e);
    }
  }

  return null;
}
