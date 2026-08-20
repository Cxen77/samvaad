/**
 * useEvidenceApi — Custom hook for all evidence/integrity API calls.
 * 
 * Provides methods for recordings, documents, decisions, audit logs,
 * security status, meeting sealing, and integrity verification.
 */
import { useState, useCallback } from 'react';
import api from '../api/axios';

const useEvidenceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = (err) => {
    const msg = err.response?.data?.message || err.message || 'API Error';
    setError(msg);
    console.warn('[Evidence API]', msg);
    return null;
  };

  // ================================================================
  // RECORDINGS
  // ================================================================

  const fetchRecordings = useCallback(async (meetingId) => {
    try {
      setLoading(true);
      const params = meetingId ? { meetingId } : {};
      const res = await api.get('/evidence/recordings', { params });
      return res.data?.recordings || [];
    } catch (err) { return handleError(err) || []; }
    finally { setLoading(false); }
  }, []);

  const uploadRecording = useCallback(async (blob, metadata) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('recording', blob, `recording-${Date.now()}.webm`);
      Object.entries(metadata).forEach(([key, val]) => {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      });
      const res = await api.post('/evidence/recordings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min timeout for large uploads
      });
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const verifyRecording = useCallback(async (recordingId) => {
    try {
      setLoading(true);
      const res = await api.post(`/evidence/recordings/${recordingId}/verify`);
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const getRecordingStreamUrl = useCallback((recordingId) => {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/evidence/recordings/${recordingId}/stream`;
  }, []);

  // ================================================================
  // DOCUMENTS
  // ================================================================

  const fetchDocuments = useCallback(async (filters) => {
    try {
      setLoading(true);
      const res = await api.get('/evidence/documents', { params: filters || {} });
      return res.data?.documents || [];
    } catch (err) { return handleError(err) || []; }
    finally { setLoading(false); }
  }, []);

  const uploadDocument = useCallback(async (file, metadata) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('document', file);
      if (metadata) {
        Object.entries(metadata).forEach(([key, val]) => formData.append(key, String(val)));
      }
      const res = await api.post('/evidence/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const verifyDocument = useCallback(async (documentId) => {
    try {
      setLoading(true);
      const res = await api.post(`/evidence/documents/${documentId}/verify`);
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const downloadDocument = useCallback((documentId) => {
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/evidence/documents/${documentId}/download`, '_blank');
  }, []);

  // ================================================================
  // DECISIONS
  // ================================================================

  const fetchDecisions = useCallback(async (meetingId) => {
    try {
      setLoading(true);
      const params = meetingId ? { meetingId } : {};
      const res = await api.get('/evidence/decisions', { params });
      return res.data?.decisions || [];
    } catch (err) { return handleError(err) || []; }
    finally { setLoading(false); }
  }, []);

  const verifyDecision = useCallback(async (decisionId) => {
    try {
      setLoading(true);
      const res = await api.post(`/evidence/decisions/${decisionId}/verify`);
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  // ================================================================
  // AUDIT LOGS
  // ================================================================

  const fetchAuditLogs = useCallback(async (filters) => {
    try {
      setLoading(true);
      const res = await api.get('/evidence/audit', { params: filters || {} });
      return res.data?.logs || [];
    } catch (err) { return handleError(err) || []; }
    finally { setLoading(false); }
  }, []);

  const verifyAuditChain = useCallback(async (meetingId) => {
    try {
      setLoading(true);
      const res = await api.post('/evidence/audit/verify', null, { params: { meetingId } });
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  // ================================================================
  // SECURITY & EVIDENCE
  // ================================================================

  const fetchSecurityStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/evidence/security/status');
      return res.data?.security || null;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const sealMeeting = useCallback(async (meetingId, metadata) => {
    try {
      setLoading(true);
      const res = await api.post(`/evidence/meetings/${meetingId}/seal`, metadata || {});
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const verifyMeetingEvidence = useCallback(async (meetingId) => {
    try {
      setLoading(true);
      const res = await api.post(`/evidence/meetings/${meetingId}/verify`);
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  const fetchEvidenceChain = useCallback(async (meetingId) => {
    try {
      setLoading(true);
      const res = await api.get(`/evidence/chain/${meetingId}`);
      return res.data?.chain || [];
    } catch (err) { return handleError(err) || []; }
    finally { setLoading(false); }
  }, []);

  const verifyPublicAnchor = useCallback(async (evidenceId) => {
    try {
      setLoading(true);
      const res = await api.get(`/evidence/public-anchor/${evidenceId}/verify`);
      return res.data;
    } catch (err) { return handleError(err); }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error,
    // Recordings
    fetchRecordings, uploadRecording, verifyRecording, getRecordingStreamUrl,
    // Documents
    fetchDocuments, uploadDocument, verifyDocument, downloadDocument,
    // Decisions
    fetchDecisions, verifyDecision,
    // Audit
    fetchAuditLogs, verifyAuditChain,
    // Security & Evidence
    fetchSecurityStatus, sealMeeting, verifyMeetingEvidence, fetchEvidenceChain, verifyPublicAnchor,
  };
};

export default useEvidenceApi;
