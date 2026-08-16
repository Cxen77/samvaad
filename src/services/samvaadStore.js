// ============================================================
// AICTE Samvaad — Centralized Data Store (localStorage-backed)
// ============================================================
// Every feature reads/writes through this single module.
// This ensures Calendar, Scheduler, Home, Notifications, etc.
// all stay perfectly synchronized.

const STORAGE_KEYS = {
  MEETINGS: 'samvaad_meetings',
  NOTES: 'samvaad_notes',
  NOTIFICATIONS: 'samvaad_notifications',
  AUDIT_LOGS: 'samvaad_audit_logs',
  RECORDINGS: 'samvaad_recordings',
  DOCUMENTS: 'samvaad_documents',
  DECISIONS: 'samvaad_decisions',
  RECENT_ACTIVITY: 'samvaad_recent_activity',
  INSTITUTES: 'samvaad_institutes',
  SEEDED: 'samvaad_seeded',
};

// ---- Helpers ----
const load = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const genId = () => 'AICTE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
const genHash = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');

// ---- Listeners (simple pub/sub for React re-renders) ----
let listeners = new Set();
const notify = () => listeners.forEach(fn => fn());
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// =========================
// MEETINGS
// =========================
export const getMeetings = () => load(STORAGE_KEYS.MEETINGS);

export const getMeeting = (id) => {
  if (!id) return null;
  const clean = id.trim().toUpperCase();
  return getMeetings().find(m => m.id?.toUpperCase() === clean || m.roomId?.toUpperCase() === clean);
};

export const createMeeting = (meeting) => {
  const all = getMeetings();
  const meetingId = meeting.id ? meeting.id.trim().toUpperCase() : ('AICTE-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase());
  const password = (meeting.password && typeof meeting.password === 'string') ? meeting.password.trim() : '';
  
  const newMeeting = {
    id: meetingId,
    password: password,
    title: meeting.title || 'AICTE Hearing',
    institute: meeting.institute || 'ABC Institute of Technology',
    applicationId: meeting.applicationId || 'AICTE-APP-2026-' + Math.floor(1000 + Math.random() * 9000),
    date: meeting.date || new Date().toISOString().split('T')[0],
    startTime: meeting.startTime || '10:30',
    endTime: meeting.endTime || '12:00',
    timeZone: meeting.timeZone || 'IST (UTC+05:30)',
    recurring: meeting.recurring || 'Does not repeat',
    type: meeting.type || 'Institute Approval',
    participantsList: meeting.participantsList || [],
    participants: meeting.participants || (meeting.participantsList ? meeting.participantsList.map(p => p.name).join(', ') : ''),
    description: meeting.description || 'AICTE Review and Approval Hearing',
    allowJoinBeforeHost: meeting.allowJoinBeforeHost ?? false,
    requireApprovalToJoin: meeting.requireApprovalToJoin ?? true,
    
    // Security
    securityLevel: meeting.securityLevel || 'Standard',
    waitingRoom: meeting.waitingRoom ?? true,
    hostApprovalRequired: meeting.hostApprovalRequired ?? true,
    participantPermissions: meeting.participantPermissions || {
      screenShare: true,
      chat: true,
      microphone: true,
      camera: true,
      fileShare: true,
      recording: false,
    },
    autoRecord: meeting.autoRecord ?? true,
    recordingType: meeting.recordingType || 'Cloud recording',
    watermark: meeting.watermark ?? true,
    
    // AI Intelligence
    aiFeatures: meeting.aiFeatures || {
      liveTranscription: true,
      aiSummary: true,
      actionItemDetection: true,
      decisionExtraction: true,
      smartNotes: true,
    },
    
    // Context & Documents
    documents: meeting.documents || [
      { id: 'doc-1', fileName: 'AICTE_Application_2026.pdf', type: 'Application PDF', size: '2.4 MB', uploadedBy: 'Institute Principal', verified: true },
      { id: 'doc-2', fileName: 'Faculty_Details_Compliance.pdf', type: 'Faculty Documents', size: '1.8 MB', uploadedBy: 'Institute Principal', verified: true },
      { id: 'doc-3', fileName: 'Infrastructure_Inspection_Report.pdf', type: 'Inspection Report', size: '4.1 MB', uploadedBy: 'Expert Committee', verified: true },
    ],
    
    // Committee Controls
    committee: meeting.committee || {
      committeeSize: 5,
      votingEnabled: true,
      votingType: 'Approve / Reject',
      votingVisibility: 'Public',
      requireAllVote: true,
      lockDecisionAfterSubmit: true,
    },
    
    status: meeting.isInstant ? 'active' : 'scheduled', // scheduled | active | completed | cancelled
    createdAt: new Date().toISOString(),
  };
  
  all.unshift(newMeeting);
  save(STORAGE_KEYS.MEETINGS, all);

  // Auto-create notification
  addNotification({
    type: 'meeting_scheduled',
    title: newMeeting.status === 'active' ? 'Instant Meeting Started' : 'Meeting Scheduled',
    message: `"${newMeeting.title}" (${newMeeting.id}) ${newMeeting.status === 'active' ? 'is live now' : 'scheduled for ' + newMeeting.date}`,
    meetingId: newMeeting.id,
  });

  // Audit log
  addAuditLog({ action: 'MEETING_CREATED', detail: `Meeting "${newMeeting.title}" (${newMeeting.id}) created with security level ${newMeeting.securityLevel}`, meetingId: newMeeting.id });

  notify();
  return newMeeting;
};


export const updateMeeting = (id, updates) => {
  const all = getMeetings().map(m => m.id === id ? { ...m, ...updates } : m);
  save(STORAGE_KEYS.MEETINGS, all);
  notify();
};

export const deleteMeeting = (id) => {
  const meeting = getMeeting(id);
  save(STORAGE_KEYS.MEETINGS, getMeetings().filter(m => m.id !== id));
  if (meeting) {
    addAuditLog({ action: 'MEETING_CANCELLED', detail: `Meeting "${meeting.title}" cancelled`, meetingId: id });
  }
  notify();
};

export const completeMeeting = (id) => {
  const meeting = getMeeting(id);
  updateMeeting(id, { status: 'ENDED' });

  if (meeting) {
    // Create recording entry
    addRecording({
      meetingId: id,
      meetingTitle: meeting.title,
      institute: meeting.institute,
      date: meeting.date,
      duration: calcDuration(meeting.startTime, meeting.endTime),
      status: 'processed',
    });

    addActivity({ type: 'meeting_completed', message: `Meeting "${meeting.title}" completed`, meetingId: id });
    addAuditLog({ action: 'MEETING_ENDED', detail: `Meeting "${meeting.title}" ended`, meetingId: id });
    addNotification({ type: 'meeting_completed', title: 'Meeting Completed', message: `"${meeting.title}" has ended.`, meetingId: id });
  }
};

export const joinMeeting = (id) => {
  updateMeeting(id, { status: 'active' });
  const meeting = getMeeting(id);
  addAuditLog({ action: 'MEETING_JOIN', detail: `Joined meeting "${meeting?.title || id}"`, meetingId: id });
  addActivity({ type: 'meeting_joined', message: `Joined meeting "${meeting?.title || id}"`, meetingId: id });
};

export const getTodayMeetings = () => {
  const today = new Date().toISOString().split('T')[0];
  return getMeetings().filter(m => m.date === today && m.status !== 'cancelled');
};

export const getUpcomingMeetings = () => {
  const today = new Date().toISOString().split('T')[0];
  return getMeetings().filter(m => m.date >= today && m.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
};

export const getCompletedMeetings = () => getMeetings().filter(m => m.status === 'completed' || m.status === 'ENDED');
export const getCancelledMeetings = () => getMeetings().filter(m => m.status === 'cancelled');

// =========================
// NOTES
// =========================
export const getNotes = () => load(STORAGE_KEYS.NOTES);
export const getNote = (id) => getNotes().find(n => n.id === id);

export const createNote = (note) => {
  const all = getNotes();
  const newNote = {
    id: 'note-' + Date.now(),
    title: note.title || 'Untitled',
    content: note.content || '',
    meetingId: note.meetingId || null,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.unshift(newNote);
  save(STORAGE_KEYS.NOTES, all);
  addActivity({ type: 'note_created', message: `Note "${newNote.title}" created` });
  notify();
  return newNote;
};

export const updateNote = (id, updates) => {
  const all = getNotes().map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
  save(STORAGE_KEYS.NOTES, all);
  notify();
};

export const deleteNote = (id) => {
  save(STORAGE_KEYS.NOTES, getNotes().filter(n => n.id !== id));
  notify();
};

export const togglePinNote = (id) => {
  const note = getNote(id);
  if (note) updateNote(id, { pinned: !note.pinned });
};

// =========================
// NOTIFICATIONS
// =========================
export const getNotifications = () => load(STORAGE_KEYS.NOTIFICATIONS);

export const addNotification = (notif) => {
  const all = getNotifications();
  all.unshift({
    id: 'notif-' + Date.now() + Math.random().toString(36).slice(2, 5),
    type: notif.type || 'info',
    title: notif.title || '',
    message: notif.message || '',
    meetingId: notif.meetingId || null,
    read: false,
    createdAt: new Date().toISOString(),
  });
  save(STORAGE_KEYS.NOTIFICATIONS, all);
  notify();
};

export const markNotificationRead = (id) => {
  const all = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  save(STORAGE_KEYS.NOTIFICATIONS, all);
  notify();
};

export const markAllNotificationsRead = () => {
  const all = getNotifications().map(n => ({ ...n, read: true }));
  save(STORAGE_KEYS.NOTIFICATIONS, all);
  notify();
};

export const clearNotification = (id) => {
  save(STORAGE_KEYS.NOTIFICATIONS, getNotifications().filter(n => n.id !== id));
  notify();
};

export const getUnreadCount = () => getNotifications().filter(n => !n.read).length;

// =========================
// AUDIT LOGS
// =========================
export const getAuditLogs = () => load(STORAGE_KEYS.AUDIT_LOGS);

export const addAuditLog = (log) => {
  const all = getAuditLogs();
  all.unshift({
    id: 'audit-' + Date.now(),
    action: log.action || 'UNKNOWN',
    detail: log.detail || '',
    meetingId: log.meetingId || null,
    timestamp: new Date().toISOString(),
    ip: '192.168.1.' + Math.floor(Math.random() * 255),
  });
  save(STORAGE_KEYS.AUDIT_LOGS, all);
  // Don't notify here to avoid recursive loops
};

// =========================
// RECORDINGS
// =========================
export const getRecordings = () => load(STORAGE_KEYS.RECORDINGS);

export const addRecording = (rec) => {
  const all = getRecordings();
  all.unshift({
    id: 'rec-' + Date.now(),
    meetingId: rec.meetingId,
    meetingTitle: rec.meetingTitle || 'Meeting',
    institute: rec.institute || '',
    date: rec.date || new Date().toISOString().split('T')[0],
    duration: rec.duration || '00:30',
    status: rec.status || 'processing',
    integrityVerified: true,
    hash: genHash(),
    createdAt: new Date().toISOString(),
  });
  save(STORAGE_KEYS.RECORDINGS, all);
  addAuditLog({ action: 'RECORDING_HASHED', detail: `Recording for "${rec.meetingTitle}" hashed and verified`, meetingId: rec.meetingId });
};

// =========================
// DOCUMENTS
// =========================
export const getDocuments = () => load(STORAGE_KEYS.DOCUMENTS);

export const addDocument = (doc) => {
  const all = getDocuments();
  const newDoc = {
    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
    fileName: doc.fileName || 'Untitled.pdf',
    type: doc.type || 'PDF',
    size: doc.size || '1.2 MB',
    institute: doc.institute || '',
    uploadDate: doc.uploadDate || new Date().toISOString().split('T')[0],
    uploadedBy: doc.uploadedBy || 'AICTE Officer',
    verified: doc.verified ?? true,
    hash: genHash(),
  };
  all.unshift(newDoc);
  save(STORAGE_KEYS.DOCUMENTS, all);
  addActivity({ type: 'document_uploaded', message: `Document "${newDoc.fileName}" uploaded for ${newDoc.institute || 'AICTE'}` });
  addAuditLog({ action: 'DOCUMENT_UPLOAD', detail: `Document "${newDoc.fileName}" uploaded` });
  notify();
  return newDoc;
};

export const toggleDocumentVerification = (id) => {
  const all = getDocuments().map(d => {
    if (d.id === id) {
      const updated = { ...d, verified: !d.verified };
      addAuditLog({
        action: updated.verified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_UNVERIFIED',
        detail: `Document "${d.fileName}" marked as ${updated.verified ? 'verified' : 'unverified'}`
      });
      return updated;
    }
    return d;
  });
  save(STORAGE_KEYS.DOCUMENTS, all);
  notify();
};

export const deleteDocument = (id) => {
  const doc = getDocuments().find(d => d.id === id);
  save(STORAGE_KEYS.DOCUMENTS, getDocuments().filter(d => d.id !== id));
  if (doc) {
    addAuditLog({ action: 'DOCUMENT_DELETED', detail: `Document "${doc.fileName}" deleted` });
  }
  notify();
};

// =========================
// DECISIONS
// =========================
export const getDecisions = () => load(STORAGE_KEYS.DECISIONS);

export const addDecision = (dec) => {
  const all = getDecisions();
  const newDec = {
    id: 'dec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
    meetingId: dec.meetingId || null,
    meetingTitle: dec.meetingTitle || 'AICTE Committee Evaluation',
    institute: dec.institute || '',
    decision: dec.decision || 'Under Review',
    remarks: dec.remarks || 'Committee reviewed compliance documents and infrastructure report.',
    date: dec.date || new Date().toISOString().split('T')[0],
    committee: Array.isArray(dec.committee) ? dec.committee : (dec.committee ? [dec.committee] : ['Dr. Rajesh Kumar', 'Dr. Priya Sharma']),
    verified: true,
    hash: genHash(),
  };
  all.unshift(newDec);
  save(STORAGE_KEYS.DECISIONS, all);
  addAuditLog({ action: 'VOTE_CAST', detail: `Decision "${newDec.decision}" for ${newDec.institute}`, meetingId: newDec.meetingId });
  addActivity({ type: 'decision_recorded', message: `Decision recorded for "${newDec.institute}": ${newDec.decision}` });
  notify();
  return newDec;
};

export const deleteDecision = (id) => {
  const dec = getDecisions().find(d => d.id === id);
  save(STORAGE_KEYS.DECISIONS, getDecisions().filter(d => d.id !== id));
  if (dec) {
    addAuditLog({ action: 'DECISION_DELETED', detail: `Decision for ${dec.institute} removed` });
  }
  notify();
};

// =========================
// RECENT ACTIVITY
// =========================
export const getRecentActivity = () => load(STORAGE_KEYS.RECENT_ACTIVITY);

export const addActivity = (act) => {
  const all = getRecentActivity();
  all.unshift({
    id: 'act-' + Date.now(),
    type: act.type || 'info',
    message: act.message || '',
    meetingId: act.meetingId || null,
    timestamp: new Date().toISOString(),
  });
  // Keep last 50
  save(STORAGE_KEYS.RECENT_ACTIVITY, all.slice(0, 50));
};

// =========================
// INSTITUTES (Persistent CRUD Data)
// =========================
export const DEFAULT_INSTITUTES = [
  {
    id: 'inst-1',
    name: 'ABC Institute of Technology',
    location: 'Bengaluru, Karnataka',
    application: 'New B.Tech AI & Data Science Program',
    applicationId: 'AICTE-APP-2026-1042',
    status: 'Under Review',
    facultyCompliance: 82,
    infrastructure: 91,
    nirfRank: 42,
    type: 'Engineering',
    established: 2005,
    contactEmail: 'contact@abctech.edu.in',
    contactPhone: '+91 80 2345 6789',
    principalName: 'Dr. S. K. Narayanan',
  },
  {
    id: 'inst-2',
    name: 'Global Institute of Technology',
    location: 'Jaipur, Rajasthan',
    application: 'Extension of Approval — M.Tech Structural Engineering',
    applicationId: 'AICTE-APP-2026-2189',
    status: 'Approved',
    facultyCompliance: 95,
    infrastructure: 88,
    nirfRank: 67,
    type: 'Engineering',
    established: 1998,
    contactEmail: 'info@globaltech.ac.in',
    contactPhone: '+91 141 2987 654',
    principalName: 'Dr. Ramesh Choudhary',
  },
  {
    id: 'inst-3',
    name: 'National Pharmacy College',
    location: 'Hyderabad, Telangana',
    application: 'New D.Pharm Program Approval',
    applicationId: 'AICTE-APP-2026-3401',
    status: 'Pending Review',
    facultyCompliance: 74,
    infrastructure: 80,
    nirfRank: null,
    type: 'Pharmacy',
    established: 2012,
    contactEmail: 'admin@nationalpharmacy.edu.in',
    contactPhone: '+91 40 2765 4321',
    principalName: 'Dr. K. V. Rao',
  },
  {
    id: 'inst-4',
    name: 'Rajiv Gandhi Engineering College',
    location: 'Bhopal, Madhya Pradesh',
    application: 'Increase in Intake — B.Tech CSE',
    applicationId: 'AICTE-APP-2026-4912',
    status: 'Under Review',
    facultyCompliance: 88,
    infrastructure: 93,
    nirfRank: 35,
    type: 'Engineering',
    established: 2001,
    contactEmail: 'registrar@rgec.ac.in',
    contactPhone: '+91 755 2456 789',
    principalName: 'Dr. Sunita Saxena',
  },
  {
    id: 'inst-5',
    name: 'Delhi School of Management',
    location: 'New Delhi',
    application: 'New MBA Program — FinTech Specialization',
    applicationId: 'AICTE-APP-2026-5820',
    status: 'Approved',
    facultyCompliance: 97,
    infrastructure: 96,
    nirfRank: 12,
    type: 'Management',
    established: 1995,
    contactEmail: 'admissions@dsm.delhi.gov.in',
    contactPhone: '+91 11 2654 3210',
    principalName: 'Prof. Arvind Mathur',
  },
  {
    id: 'inst-6',
    name: 'Eastern Institute of Architecture',
    location: 'Kolkata, West Bengal',
    application: 'B.Arch Program — New Campus',
    applicationId: 'AICTE-APP-2026-6114',
    status: 'Rejected',
    facultyCompliance: 58,
    infrastructure: 62,
    nirfRank: null,
    type: 'Architecture',
    established: 2015,
    contactEmail: 'dean@easternarch.edu.in',
    contactPhone: '+91 33 2456 1234',
    principalName: 'Dr. Debabrata Roy',
  },
];

export const getInstitutes = () => {
  const stored = load(STORAGE_KEYS.INSTITUTES);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  // Initialize storage with defaults if empty
  save(STORAGE_KEYS.INSTITUTES, DEFAULT_INSTITUTES);
  return DEFAULT_INSTITUTES;
};

export const getInstitute = (id) => {
  if (!id) return null;
  const clean = id.trim().toLowerCase();
  return getInstitutes().find(i => i.id?.toLowerCase() === clean || i.name?.toLowerCase() === clean);
};

export const createInstitute = (data) => {
  const all = getInstitutes();
  const newInst = {
    id: 'inst-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase(),
    name: data.name?.trim() || 'New Institute of Technology',
    location: data.location?.trim() || 'India',
    application: data.application?.trim() || 'Approval Application',
    applicationId: data.applicationId?.trim() || ('AICTE-APP-2026-' + Math.floor(1000 + Math.random() * 9000)),
    status: data.status || 'Under Review',
    facultyCompliance: Number(data.facultyCompliance) >= 0 ? Number(data.facultyCompliance) : 80,
    infrastructure: Number(data.infrastructure) >= 0 ? Number(data.infrastructure) : 85,
    nirfRank: data.nirfRank ? Number(data.nirfRank) : null,
    type: data.type || 'Engineering',
    established: Number(data.established) || new Date().getFullYear(),
    contactEmail: data.contactEmail?.trim() || '',
    contactPhone: data.contactPhone?.trim() || '',
    principalName: data.principalName?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  const updated = [newInst, ...all];
  save(STORAGE_KEYS.INSTITUTES, updated);
  addAuditLog({ action: 'INSTITUTE_CREATED', detail: `Registered institute "${newInst.name}"` });
  addActivity({ type: 'info', message: `Institute "${newInst.name}" registered in Hub` });
  notify();
  return newInst;
};

export const updateInstitute = (id, updates) => {
  const all = getInstitutes().map(inst => {
    if (inst.id === id) {
      const updated = {
        ...inst,
        ...updates,
        facultyCompliance: updates.facultyCompliance !== undefined ? Number(updates.facultyCompliance) : inst.facultyCompliance,
        infrastructure: updates.infrastructure !== undefined ? Number(updates.infrastructure) : inst.infrastructure,
        nirfRank: updates.nirfRank !== undefined ? (updates.nirfRank ? Number(updates.nirfRank) : null) : inst.nirfRank,
        established: updates.established !== undefined ? Number(updates.established) : inst.established,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    }
    return inst;
  });
  save(STORAGE_KEYS.INSTITUTES, all);
  addAuditLog({ action: 'INSTITUTE_UPDATED', detail: `Updated institute record "${updates.name || id}"` });
  notify();
};

export const deleteInstitute = (id) => {
  const inst = getInstitutes().find(i => i.id === id);
  const remaining = getInstitutes().filter(i => i.id !== id);
  save(STORAGE_KEYS.INSTITUTES, remaining);
  if (inst) {
    addAuditLog({ action: 'INSTITUTE_DELETED', detail: `Deleted institute "${inst.name}"` });
    addActivity({ type: 'info', message: `Institute "${inst.name}" deleted from Hub` });
  }
  notify();
};

// =========================
// SEARCH
// =========================
export const search = (query) => {
  if (!query || query.length < 2) return { meetings: [], institutes: [], notes: [] };
  const q = query.toLowerCase();
  return {
    meetings: getMeetings().filter(m => m.title.toLowerCase().includes(q) || m.institute.toLowerCase().includes(q)),
    institutes: getInstitutes().filter(i => i.name.toLowerCase().includes(q) || i.application.toLowerCase().includes(q)),
    notes: getNotes().filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
  };
};

// =========================
// SEED DATA (runs once)
// =========================
export const seedIfNeeded = () => {
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) return;

  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const meetings = [
    { id: 'AICTE-SEED-001', title: 'ABC Institute Approval Hearing', institute: 'ABC Institute of Technology', date: fmt(today), startTime: '10:30', endTime: '12:00', type: 'Hearing', participants: 'Dr. Rajesh Kumar, Dr. Priya Sharma, Dr. Amit Verma', description: 'Review application for new B.Tech AI & Data Science program.', securityLevel: 'Standard', recording: true, status: 'scheduled', createdAt: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'AICTE-SEED-002', title: 'Global Institute Extension Review', institute: 'Global Institute of Technology', date: fmt(today), startTime: '14:00', endTime: '15:30', type: 'Review', participants: 'Dr. Priya Sharma, Dr. Sanjay Reddy', description: 'M.Tech Structural Engineering extension of approval.', securityLevel: 'Standard', recording: true, status: 'scheduled', createdAt: new Date(today.getTime() - 172800000).toISOString() },
    { id: 'AICTE-SEED-003', title: 'National Pharmacy Preliminary Review', institute: 'National Pharmacy College', date: fmt(tomorrow), startTime: '11:00', endTime: '12:30', type: 'Preliminary', participants: 'Dr. Amit Verma, Dr. Meena Gupta', description: 'Preliminary review of D.Pharm program application.', securityLevel: 'Standard', recording: true, status: 'scheduled', createdAt: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'AICTE-SEED-004', title: 'Rajiv Gandhi CSE Intake Committee', institute: 'Rajiv Gandhi Engineering College', date: fmt(dayAfter), startTime: '09:30', endTime: '11:00', type: 'Committee', participants: 'Dr. Rajesh Kumar, Dr. Sanjay Reddy, Dr. Priya Sharma', description: 'Committee decision on B.Tech CSE intake increase.', securityLevel: 'Standard', recording: true, status: 'scheduled', createdAt: new Date(today.getTime() - 259200000).toISOString() },
    { id: 'AICTE-SEED-005', title: 'Delhi School MBA Final Decision', institute: 'Delhi School of Management', date: fmt(nextWeek), startTime: '15:00', endTime: '16:30', type: 'Decision', participants: 'Full Committee', description: 'Final vote on new MBA FinTech specialization.', securityLevel: 'Standard', recording: true, status: 'scheduled', createdAt: new Date(today.getTime() - 345600000).toISOString() },
    { id: 'AICTE-SEED-006', title: 'Eastern Architecture Review (Completed)', institute: 'Eastern Institute of Architecture', date: fmt(yesterday), startTime: '10:00', endTime: '11:30', type: 'Review', participants: 'Dr. Meena Gupta, Dr. Amit Verma', description: 'B.Arch new campus application review.', securityLevel: 'Standard', recording: true, status: 'completed', createdAt: new Date(today.getTime() - 604800000).toISOString() },
  ];

  const notifications = [
    { id: 'notif-seed-1', type: 'upcoming_meeting', title: 'Upcoming Meeting', message: 'ABC Institute Approval Hearing starts at 10:30 AM today.', meetingId: 'AICTE-SEED-001', read: false, createdAt: new Date(today.getTime() - 3600000).toISOString() },
    { id: 'notif-seed-2', type: 'upcoming_meeting', title: 'Upcoming Meeting', message: 'Global Institute Extension Review at 2:00 PM today.', meetingId: 'AICTE-SEED-002', read: false, createdAt: new Date(today.getTime() - 7200000).toISOString() },
    { id: 'notif-seed-3', type: 'document_uploaded', title: 'Document Uploaded', message: 'National Pharmacy College uploaded "Faculty Setup Report.pdf".', read: false, createdAt: new Date(today.getTime() - 14400000).toISOString() },
    { id: 'notif-seed-4', type: 'decision_pending', title: 'Decision Pending', message: 'Committee decision required for Rajiv Gandhi CSE Intake.', meetingId: 'AICTE-SEED-004', read: true, createdAt: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'notif-seed-5', type: 'meeting_completed', title: 'Meeting Completed', message: 'Eastern Architecture Review has been completed.', meetingId: 'AICTE-SEED-006', read: true, createdAt: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'notif-seed-6', type: 'security_alert', title: 'Security Alert', message: 'New login detected from IP 192.168.1.45.', read: true, createdAt: new Date(today.getTime() - 172800000).toISOString() },
    { id: 'notif-seed-7', type: 'recording_processed', title: 'Recording Ready', message: 'Recording for "Eastern Architecture Review" is now available.', meetingId: 'AICTE-SEED-006', read: true, createdAt: new Date(today.getTime() - 86400000).toISOString() },
  ];

  const recordings = [
    { id: 'rec-seed-1', meetingId: 'AICTE-SEED-006', meetingTitle: 'Eastern Architecture Review', institute: 'Eastern Institute of Architecture', date: fmt(yesterday), duration: '01:30', status: 'processed', integrityVerified: true, hash: genHash(), createdAt: new Date(today.getTime() - 86400000).toISOString() },
  ];

  const documents = [
    { id: 'doc-seed-1', fileName: 'Faculty Setup Report.pdf', type: 'PDF', institute: 'National Pharmacy College', uploadDate: fmt(today), verified: true, hash: genHash() },
    { id: 'doc-seed-2', fileName: 'Land & Infrastructure Proof.pdf', type: 'PDF', institute: 'ABC Institute of Technology', uploadDate: fmt(yesterday), verified: true, hash: genHash() },
    { id: 'doc-seed-3', fileName: 'Financial Audit 2025.pdf', type: 'PDF', institute: 'ABC Institute of Technology', uploadDate: fmt(yesterday), verified: true, hash: genHash() },
    { id: 'doc-seed-4', fileName: 'NIRF Data Sheet.xlsx', type: 'Excel', institute: 'Global Institute of Technology', uploadDate: fmt(yesterday), verified: true, hash: genHash() },
    { id: 'doc-seed-5', fileName: 'Accreditation Certificate.pdf', type: 'PDF', institute: 'Delhi School of Management', uploadDate: fmt(new Date(today.getTime() - 259200000)), verified: true, hash: genHash() },
    { id: 'doc-seed-6', fileName: 'Building Completion Certificate.pdf', type: 'PDF', institute: 'Eastern Institute of Architecture', uploadDate: fmt(new Date(today.getTime() - 604800000)), verified: false, hash: genHash() },
  ];

  const decisions = [
    { id: 'dec-seed-1', meetingId: 'AICTE-SEED-006', meetingTitle: 'Eastern Architecture Review', institute: 'Eastern Institute of Architecture', decision: 'Rejected', date: fmt(yesterday), committee: ['Dr. Meena Gupta', 'Dr. Amit Verma'], verified: true, hash: genHash() },
    { id: 'dec-seed-2', meetingId: null, meetingTitle: 'Delhi School MBA Review', institute: 'Delhi School of Management', decision: 'Approved', date: fmt(new Date(today.getTime() - 604800000)), committee: ['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Sanjay Reddy'], verified: true, hash: genHash() },
  ];

  const auditLogs = [
    { id: 'audit-seed-1', action: 'LOGIN', detail: 'User logged in', timestamp: new Date(today.getTime() - 3600000).toISOString(), ip: '192.168.1.45' },
    { id: 'audit-seed-2', action: 'DOCUMENT_VIEW', detail: 'Viewed "Faculty Setup Report.pdf"', timestamp: new Date(today.getTime() - 7200000).toISOString(), ip: '192.168.1.45' },
    { id: 'audit-seed-3', action: 'MEETING_SCHEDULED', detail: 'Meeting "ABC Institute Approval Hearing" created', meetingId: 'AICTE-SEED-001', timestamp: new Date(today.getTime() - 86400000).toISOString(), ip: '192.168.1.45' },
    { id: 'audit-seed-4', action: 'MEETING_JOIN', detail: 'Joined meeting "Eastern Architecture Review"', meetingId: 'AICTE-SEED-006', timestamp: new Date(today.getTime() - 86400000).toISOString(), ip: '192.168.1.102' },
    { id: 'audit-seed-5', action: 'VOTE_CAST', detail: 'Decision "Rejected" for Eastern Institute of Architecture', meetingId: 'AICTE-SEED-006', timestamp: new Date(today.getTime() - 86400000).toISOString(), ip: '192.168.1.102' },
    { id: 'audit-seed-6', action: 'MEETING_ENDED', detail: 'Meeting "Eastern Architecture Review" ended', meetingId: 'AICTE-SEED-006', timestamp: new Date(today.getTime() - 86400000).toISOString(), ip: '192.168.1.102' },
    { id: 'audit-seed-7', action: 'RECORDING_HASHED', detail: 'Recording hashed and verified', meetingId: 'AICTE-SEED-006', timestamp: new Date(today.getTime() - 82800000).toISOString(), ip: '192.168.1.1' },
    { id: 'audit-seed-8', action: 'BLOCKCHAIN_ANCHORED', detail: 'Attendance proof anchored on Polygon Mumbai Testnet', timestamp: new Date(today.getTime() - 82800000).toISOString(), ip: '192.168.1.1' },
  ];

  const activity = [
    { id: 'act-seed-1', type: 'meeting_completed', message: 'Meeting "Eastern Architecture Review" completed', meetingId: 'AICTE-SEED-006', timestamp: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'act-seed-2', type: 'document_uploaded', message: 'Document "Faculty Setup Report.pdf" uploaded', timestamp: new Date(today.getTime() - 14400000).toISOString() },
    { id: 'act-seed-3', type: 'decision_recorded', message: 'Decision recorded for "Eastern Institute of Architecture"', timestamp: new Date(today.getTime() - 86400000).toISOString() },
    { id: 'act-seed-4', type: 'recording_verified', message: 'Recording for "Eastern Architecture Review" verified', timestamp: new Date(today.getTime() - 82800000).toISOString() },
  ];

  const notes = [
    { id: 'note-seed-1', title: 'ABC Institute Hearing', content: 'Committee requested revised faculty documentation. Need to verify student-faculty ratio compliance before approval.', meetingId: 'AICTE-SEED-001', pinned: true, createdAt: new Date(today.getTime() - 172800000).toISOString(), updatedAt: new Date(today.getTime() - 172800000).toISOString() },
    { id: 'note-seed-2', title: 'Architecture Review Notes', content: 'Infrastructure compliance below threshold. Building completion certificate not verified. Recommend rejection pending improvements.', meetingId: 'AICTE-SEED-006', pinned: false, createdAt: new Date(today.getTime() - 86400000).toISOString(), updatedAt: new Date(today.getTime() - 86400000).toISOString() },
  ];

  save(STORAGE_KEYS.MEETINGS, meetings);
  save(STORAGE_KEYS.NOTIFICATIONS, notifications);
  save(STORAGE_KEYS.RECORDINGS, recordings);
  save(STORAGE_KEYS.DOCUMENTS, documents);
  save(STORAGE_KEYS.DECISIONS, decisions);
  save(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  save(STORAGE_KEYS.RECENT_ACTIVITY, activity);
  save(STORAGE_KEYS.NOTES, notes);
  save(STORAGE_KEYS.INSTITUTES, DEFAULT_INSTITUTES);

  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
};

// Utility
function calcDuration(start, end) {
  if (!start || !end) return '00:30';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
