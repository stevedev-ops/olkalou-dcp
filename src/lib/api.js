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

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (response.ok) {
    return { data, error: null };
  } else {
    // Standardize error handling
    const errorMsg = data.detail || data.error || (typeof data === 'string' ? data : JSON.stringify(data));
    return { data: null, error: { message: errorMsg } };
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
};
