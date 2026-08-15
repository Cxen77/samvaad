import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as store from '../services/samvaadStore';

const SamvaadContext = createContext();

export const useSamvaad = () => useContext(SamvaadContext);

export const SamvaadProvider = ({ children }) => {
  // Trigger re-renders when store changes
  const [, setTick] = useState(0);

  useEffect(() => {
    store.seedIfNeeded();
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const value = {
    // Meetings
    getMeetings: store.getMeetings,
    getMeeting: store.getMeeting,
    createMeeting: store.createMeeting,
    updateMeeting: store.updateMeeting,
    deleteMeeting: store.deleteMeeting,
    completeMeeting: store.completeMeeting,
    joinMeeting: store.joinMeeting,
    getTodayMeetings: store.getTodayMeetings,
    getUpcomingMeetings: store.getUpcomingMeetings,
    getCompletedMeetings: store.getCompletedMeetings,
    getCancelledMeetings: store.getCancelledMeetings,
    // Notes
    getNotes: store.getNotes,
    getNote: store.getNote,
    createNote: store.createNote,
    updateNote: store.updateNote,
    deleteNote: store.deleteNote,
    togglePinNote: store.togglePinNote,
    // Notifications
    getNotifications: store.getNotifications,
    addNotification: store.addNotification,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    clearNotification: store.clearNotification,
    getUnreadCount: store.getUnreadCount,
    // Audit
    getAuditLogs: store.getAuditLogs,
    addAuditLog: store.addAuditLog,
    // Recordings
    getRecordings: store.getRecordings,
    // Documents
    getDocuments: store.getDocuments,
    addDocument: store.addDocument,
    toggleDocumentVerification: store.toggleDocumentVerification,
    deleteDocument: store.deleteDocument,
    // Decisions
    getDecisions: store.getDecisions,
    addDecision: store.addDecision,
    deleteDecision: store.deleteDecision,
    // Activity
    getRecentActivity: store.getRecentActivity,
    // Institutes
    getInstitutes: store.getInstitutes,
    getInstitute: store.getInstitute,
    createInstitute: store.createInstitute,
    updateInstitute: store.updateInstitute,
    deleteInstitute: store.deleteInstitute,
    // Search
    search: store.search,
  };

  return (
    <SamvaadContext.Provider value={value}>
      {children}
    </SamvaadContext.Provider>
  );
};
