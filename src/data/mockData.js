export const HOSPITALS = [];

export const CURRENT_HOSPITAL = null;

export const ORGANS = [];

export const REQUESTS = [];

export const ALERTS = [];

export const NOTIFICATIONS = [];

export const TRANSPORT_RECORDS = [];

export const CERTIFICATES = [];

export const ANALYTICS = {
  totalTransplants: 0,
  successRate: 0,
  avgResponseTime: 0,
  organUtilization: 0,
  monthlyData: [],
  organBreakdown: [],
  pendingRequests: 0,
  completedRequests: 0,
  approvalRate: 0,
  avgMatchScore: 0,
};

export const CHAT_MESSAGES = [];

export const STAFF_LIST = [];

export const AUDIT_LOGS = [];

export const ORGAN_TYPES = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Cornea'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const HLA_TYPES = ['A1,B8,DR3', 'A2,B7,DR4', 'A3,B44,DR7', 'A11,B35,DR13', 'A24,B51,DR4', 'A9,B12,DR5', 'A2,B27,DR1', 'A1,B57,DR7'];
export const URGENCY_LEVELS = ['critical', 'high', 'medium', 'low'];
