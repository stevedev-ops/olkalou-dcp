const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

async function request(endpoint, { body, ...customConfig } = {}) {
  const token = localStorage.getItem('dcp_token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  if (!navigator.onLine && endpoint === '/register') {
    return { data: { offline: true }, error: null };
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (response.ok) {
      return { data, error: null };
    } else {
      // Standardize error handling
      const errorMsg = data.detail || data.error || (typeof data === 'string' ? data : JSON.stringify(data));
      return { data: null, error: { message: errorMsg } };
    }
  } catch (err) {
    if (endpoint === '/register') {
      return { data: { offline: true }, error: null };
    }
    return { data: null, error: { message: 'Network connection failed' } };
  }
}

export const api = {
  login: (firstName, nationalId) => 
    request('/login', { body: { firstName, nationalId } }),
  
  register: (memberData, inviteToken) => 
    request('/register', { body: { ...memberData, invite_token: inviteToken } }),
  
  getInsights: (memberId) => 
    request(`/members/${memberId}/insights`),

  getMemberPublic: (memberId) =>
    request(`/members/${memberId}/public`),

  updateMember: (memberId, data) =>
    request(`/members/${memberId}`, { method: 'PATCH', body: data }),

  getMe: () =>
    request('/members/me'),
  
  getMembers: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return request(`/members?${searchParams.toString()}`);
  },
  
  getVoterRecords: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return request(`/voter-records?${searchParams.toString()}`);
  },

  getStats: () => 
    request('/stats'),

  getReportStats: (memberId, mode = 'all') => {
    const params = new URLSearchParams();
    if (memberId) params.set('member_id', memberId);
    params.set('mode', mode);
    return request(`/stats/reports?${params.toString()}`);
  },
  
  getInvite: (id) =>
    request(`/invites/${id}`),
  
  createInvite: (data) => 
    request('/invites', { body: data }),

  lookupVoter: (query) =>
    request(`/voter-lookup?q=${encodeURIComponent(query)}`),

  getPollingCoverage: () =>
    request('/polling-coverage'),

  getLeaderboard: () =>
    request('/leaderboard'),

  getGotvList: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return request(`/gotv?${searchParams.toString()}`);
  },

  markVoted: (memberId) =>
    request(`/gotv/${memberId}/voted`, { method: 'PATCH' }),

  // Panna Pramukh
  getCanvass: (memberId) =>
    request(memberId ? `/canvass?member=${memberId}` : '/canvass'),
  createCanvass: (data) =>
    request('/canvass', { method: 'POST', body: JSON.stringify(data) }),
  toggleCanvass: (id) =>
    request(`/canvass/${id}`, { method: 'PATCH' }),
  deleteCanvass: (id) =>
    request(`/canvass/${id}`, { method: 'DELETE' }),

  // Boda-boda Transport
  getTransport: (ward) =>
    request(ward ? `/transport?ward=${encodeURIComponent(ward)}` : '/transport'),
  requestTransport: (data) =>
    request('/transport', { method: 'POST', body: JSON.stringify(data) }),
  updateTransport: (id, data) =>
    request(`/transport/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Polling Agents
  getAgents: () =>
    request('/agents'),
  assignAgent: (data) =>
    request('/agents', { method: 'POST', body: JSON.stringify(data) }),
  checkInAgent: (id) =>
    request(`/agents/${id}/checkin`, { method: 'PATCH' }),

  // PVT Tally
  getTallies: (ward) =>
    request(ward ? `/tally?ward=${encodeURIComponent(ward)}` : '/tally'),
  submitTally: (data) =>
    request('/tally', { method: 'POST', body: JSON.stringify(data) }),

  // SMS Export
  getSmsRecipients: (params = {}) => {
    const q = new URLSearchParams(params);
    return request(`/sms-export?${q.toString()}`);
  },

  // Relational Contact Matcher
  searchContacts: (query) =>
    request(`/contact-matcher?q=${encodeURIComponent(query)}`),

  // Ushahidi-Style Incidents
  getIncidents: () =>
    request('/incidents'),
  reportIncident: (data) =>
    request('/incidents', { method: 'POST', body: data }),
  updateIncidentStatus: (id, status) =>
    request(`/incidents/${id}`, { method: 'PATCH', body: { status } }),

  // Virtual Phone Banking
  getPhoneBankTarget: () =>
    request('/phone-bank/queue'),
  logCall: (data) =>
    request('/phone-bank/call', { method: 'POST', body: data }),
};
