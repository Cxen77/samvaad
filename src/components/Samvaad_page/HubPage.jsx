import React, { useState, useMemo } from 'react';
import { 
  FiSearch, FiFileText, FiUsers, FiCalendar, FiCheckCircle, FiAlertCircle, 
  FiTrendingUp, FiShield, FiPlus, FiEdit2, FiTrash2, FiVideo, FiMapPin, 
  FiAward, FiHash, FiCheck, FiX, FiClock, FiUpload, FiLock, FiExternalLink,
  FiChevronRight, FiBriefcase, FiMail, FiPhone, FiInfo, FiCheckSquare, FiAlertTriangle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSamvaad } from '../../context/SamvaadContext';
import toast from 'react-hot-toast';

const HubPage = () => {
  const navigate = useNavigate();
  const { 
    getInstitutes, 
    createInstitute, 
    updateInstitute, 
    deleteInstitute,
    getMeetings, 
    createMeeting,
    getDocuments, 
    addDocument, 
    toggleDocumentVerification, 
    deleteDocument,
    getDecisions, 
    addDecision, 
    deleteDecision 
  } = useSamvaad();

  const institutes = getInstitutes();
  const meetings = getMeetings();
  const documents = getDocuments();
  const decisions = getDecisions();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInstituteId, setSelectedInstituteId] = useState(institutes[0]?.id || null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hearings' | 'documents' | 'decisions'

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState(null);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Selected institute object
  const selectedInstitute = useMemo(() => {
    return institutes.find(i => i.id === selectedInstituteId) || institutes[0] || null;
  }, [institutes, selectedInstituteId]);

  // Filtered institutes list
  const filteredInstitutes = useMemo(() => {
    return institutes.filter(inst => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        inst.name.toLowerCase().includes(q) || 
        inst.application?.toLowerCase().includes(q) ||
        inst.location?.toLowerCase().includes(q) ||
        inst.applicationId?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
      const matchesType = typeFilter === 'all' || inst.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [institutes, searchQuery, statusFilter, typeFilter]);

  // Related data for selected institute
  const instMeetings = useMemo(() => {
    if (!selectedInstitute) return [];
    const name = selectedInstitute.name.toLowerCase();
    return meetings.filter(m => m.institute && m.institute.toLowerCase().includes(name));
  }, [selectedInstitute, meetings]);

  const instDocs = useMemo(() => {
    if (!selectedInstitute) return [];
    const name = selectedInstitute.name.toLowerCase();
    return documents.filter(d => d.institute && d.institute.toLowerCase().includes(name));
  }, [selectedInstitute, documents]);

  const instDecisions = useMemo(() => {
    if (!selectedInstitute) return [];
    const name = selectedInstitute.name.toLowerCase();
    return decisions.filter(d => d.institute && d.institute.toLowerCase().includes(name));
  }, [selectedInstitute, decisions]);

  // Status badge styling (minimal site theme)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Approved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Under Review
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const handleDeleteInstitute = (inst) => {
    if (!inst) return;
    if (window.confirm(`Are you sure you want to remove "${inst.name}" from the AICTE Hub?`)) {
      deleteInstitute(inst.id);
      toast.success(`"${inst.name}" removed`);
      if (selectedInstituteId === inst.id) {
        const remaining = institutes.filter(i => i.id !== inst.id);
        setSelectedInstituteId(remaining[0]?.id || null);
      }
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      {/* LEFT PANEL: Directory & Search */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0 h-full bg-slate-50/50 dark:bg-[#080d1a]">
        
        {/* Header & New Institute Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiBriefcase className="text-sky-600 dark:text-sky-400" size={18} />
              <span>Institute Hub</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              AICTE Compliance & Dossier Vault
            </p>
          </div>
          <button
            onClick={() => {
              setEditingInstitute(null);
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
          >
            <FiPlus size={14} />
            <span>Add Institute</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by institute name, code, city..."
              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-full pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'Under Review', label: 'Under Review' },
              { id: 'Approved', label: 'Approved' },
              { id: 'Pending Review', label: 'Pending' },
              { id: 'Rejected', label: 'Rejected' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  statusFilter === f.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white dark:bg-black border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Summary Counters */}
        <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-black/40 text-center">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{institutes.length}</p>
            <p className="text-[10px] text-slate-400">Institutes</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{documents.length}</p>
            <p className="text-[10px] text-slate-400">Documents</p>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{decisions.length}</p>
            <p className="text-[10px] text-slate-400">Decisions</p>
          </div>
        </div>

        {/* Institute Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredInstitutes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No institutes matching your criteria.
            </div>
          ) : (
            filteredInstitutes.map(inst => {
              const isSelected = selectedInstitute?.id === inst.id;
              const relatedMeetingsCount = meetings.filter(m => m.institute && m.institute.toLowerCase().includes(inst.name.toLowerCase())).length;
              const relatedDocsCount = documents.filter(d => d.institute && d.institute.toLowerCase().includes(inst.name.toLowerCase())).length;

              return (
                <div
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstituteId(inst.id);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500/40 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">
                      {inst.name}
                    </h3>
                    <div className="shrink-0 scale-90 origin-top-right">
                      {getStatusBadge(inst.status)}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                    {inst.application}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      <FiMapPin size={11} className="shrink-0" />
                      <span className="truncate">{inst.location}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span title="Documents Attached">{relatedDocsCount} docs</span>
                      <span>•</span>
                      <span title="Hearings">{relatedMeetingsCount} hearings</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Comprehensive Dossier & Actions */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-black">
        {selectedInstitute ? (
          <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            
            {/* Header Action Bar */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {selectedInstitute.name}
                    </h2>
                    {getStatusBadge(selectedInstitute.status)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiMapPin size={13} className="text-slate-400" />
                      {selectedInstitute.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar size={13} className="text-slate-400" />
                      Est. {selectedInstitute.established}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiHash size={13} className="text-slate-400" />
                      {selectedInstitute.applicationId || 'AICTE-APP-2026-GEN'}
                    </span>
                    {selectedInstitute.nirfRank && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <FiAward size={13} className="text-amber-500" />
                        NIRF #{selectedInstitute.nirfRank}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <FiVideo size={14} />
                    <span>Schedule Hearing</span>
                  </button>
                  <button
                    onClick={() => setShowUploadDocModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FiUpload size={14} />
                    <span>Upload Doc</span>
                  </button>
                  <button
                    onClick={() => setShowDecisionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FiCheckSquare size={14} />
                    <span>Record Decision</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingInstitute(selectedInstitute);
                      setShowAddEditModal(true);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Institute Profile"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteInstitute(selectedInstitute)}
                    className="p-2 text-red-500 hover:text-red-700 rounded-lg border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Institute"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dossier Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label: 'Overview & Readiness', icon: FiTrendingUp },
                { id: 'hearings', label: 'Hearings & Meetings', icon: FiCalendar, count: instMeetings.length },
                { id: 'documents', label: 'Documents & Vault', icon: FiFileText, count: instDocs.length },
                { id: 'decisions', label: 'Committee Decisions', icon: FiShield, count: instDecisions.length },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive 
                          ? 'bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Compliance Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ComplianceGauge
                    title="Faculty Compliance"
                    value={selectedInstitute.facultyCompliance || 80}
                    description="AICTE norms adherence for Teacher-Student ratio"
                  />
                  <ComplianceGauge
                    title="Infrastructure Score"
                    value={selectedInstitute.infrastructure || 85}
                    description="Labs, Classrooms, Safety & Land Verification"
                  />
                  <ComplianceGauge
                    title="AICTE Readiness Index"
                    value={Math.round(((selectedInstitute.facultyCompliance || 80) + (selectedInstitute.infrastructure || 85) + (instDocs.filter(d => d.verified).length * 10)) / 2.3)}
                    description="Composite readiness score across all parameters"
                  />
                </div>

                {/* Institute Profile & Contact Card */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Institutional Record & Application Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 text-[11px]">Primary Application Type</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedInstitute.application}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Institution Program Type</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedInstitute.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Principal / Head of Institute</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedInstitute.principalName || 'Dr. Principal / Director'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Official Email</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <FiMail size={12} className="text-slate-400" />
                        {selectedInstitute.contactEmail || 'office@institution.edu.in'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Telephone / Contact</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <FiPhone size={12} className="text-slate-400" />
                        {selectedInstitute.contactPhone || '+91 11 2345 6789'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Application Reference Code</p>
                      <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{selectedInstitute.applicationId || 'AICTE-APP-2026-9042'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Dossier Snapshot Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{instMeetings.length}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Recorded Hearings</p>
                    </div>
                    <FiCalendar className="text-sky-500" size={24} />
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{instDocs.length}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Compliance Documents</p>
                    </div>
                    <FiFileText className="text-sky-500" size={24} />
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{instDecisions.length}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Committee Decisions</p>
                    </div>
                    <FiShield className="text-sky-500" size={24} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: HEARINGS & MEETINGS */}
            {activeTab === 'hearings' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Official AICTE Hearings for {selectedInstitute.name}
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FiPlus size={13} />
                    <span>Schedule Hearing</span>
                  </button>
                </div>

                {instMeetings.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <FiCalendar size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      No hearings scheduled yet for this institute.
                    </p>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      Schedule first hearing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {instMeetings.map(m => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080d1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'completed' || m.status === 'ENDED'
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                            }`}>
                              {m.status || 'Scheduled'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{m.date}</span>
                            <span>•</span>
                            <span>{m.startTime} - {m.endTime || '11:30'}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">{m.id}</span>
                          </p>
                          {m.participants && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-lg">
                              Committee: {m.participants}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/waiting-room/${m.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FiVideo size={12} />
                            <span>Join Hearing</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: DOCUMENTS & VAULT */}
            {activeTab === 'documents' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Uploaded Compliance Documents & Proofs
                  </h3>
                  <button
                    onClick={() => setShowUploadDocModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FiUpload size={13} />
                    <span>Upload Document</span>
                  </button>
                </div>

                {instDocs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <FiFileText size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      No documents uploaded yet for this institute.
                    </p>
                    <button
                      onClick={() => setShowUploadDocModal(true)}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      Upload application document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {instDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080d1a] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                            <FiFileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{doc.fileName}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {doc.type || 'PDF Document'} • {doc.size || '1.8 MB'} • Uploaded {doc.uploadDate}
                            </p>
                            {doc.hash && (
                              <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-sm mt-0.5">
                                SHA-256: {doc.hash.slice(0, 24)}...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              toggleDocumentVerification(doc.id);
                              toast.success(doc.verified ? 'Marked as Unverified' : 'Document Verified & Signed');
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                              doc.verified
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                            title={doc.verified ? 'Click to unverify' : 'Click to verify document integrity'}
                          >
                            {doc.verified ? <FiCheck size={12} className="text-sky-500" /> : <FiAlertTriangle size={12} />}
                            <span>{doc.verified ? 'Verified' : 'Verify'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete document "${doc.fileName}"?`)) {
                                deleteDocument(doc.id);
                                toast.success('Document deleted');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                            title="Delete Document"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: COMMITTEE DECISIONS */}
            {activeTab === 'decisions' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Official AICTE Committee Decisions & Blockchain Audit
                  </h3>
                  <button
                    onClick={() => setShowDecisionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FiPlus size={13} />
                    <span>Record Decision</span>
                  </button>
                </div>

                {instDecisions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <FiShield size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      No decisions recorded yet for this institute.
                    </p>
                    <button
                      onClick={() => setShowDecisionModal(true)}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      Record formal decision
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instDecisions.map(d => (
                      <div
                        key={d.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080d1a] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              {d.decision}
                            </span>
                            <span className="text-xs text-slate-400">Dated {d.date}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <FiShield size={11} className="text-sky-500" />
                              Cryptographically Stamped
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this decision record?')) {
                                  deleteDecision(d.id);
                                  toast.success('Decision record deleted');
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500"
                              title="Delete Record"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {d.remarks && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-black p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {d.remarks}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                          <p>
                            Committee Signatures: <span className="font-semibold text-slate-600 dark:text-slate-300">{Array.isArray(d.committee) ? d.committee.join(', ') : d.committee}</span>
                          </p>
                          {d.hash && (
                            <p className="font-mono text-[9px] text-slate-400">
                              Hash: {d.hash.slice(0, 20)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiBriefcase size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Select or Register an Institute
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Choose an institution from the left directory to view its AICTE compliance dossier, verified documents, and committee records.
            </p>
            <button
              onClick={() => {
                setEditingInstitute(null);
                setShowAddEditModal(true);
              }}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-full shadow-sm"
            >
              + Register New Institute
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT INSTITUTE MODAL */}
      {/* ========================================================================= */}
      {showAddEditModal && (
        <AddEditInstituteModal
          institute={editingInstitute}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingInstitute(null);
          }}
          onSave={(instData) => {
            if (editingInstitute) {
              updateInstitute(editingInstitute.id, instData);
              toast.success('Institute details updated');
            } else {
              const created = createInstitute(instData);
              setSelectedInstituteId(created.id);
              toast.success('New institute registered in Hub');
            }
            setShowAddEditModal(false);
            setEditingInstitute(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD DOCUMENT MODAL */}
      {/* ========================================================================= */}
      {showUploadDocModal && selectedInstitute && (
        <UploadDocModal
          instituteName={selectedInstitute.name}
          onClose={() => setShowUploadDocModal(false)}
          onUpload={(docData) => {
            addDocument({
              ...docData,
              institute: selectedInstitute.name,
            });
            toast.success(`"${docData.fileName}" uploaded to ${selectedInstitute.name}`);
            setShowUploadDocModal(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD DECISION MODAL */}
      {/* ========================================================================= */}
      {showDecisionModal && selectedInstitute && (
        <RecordDecisionModal
          instituteName={selectedInstitute.name}
          onClose={() => setShowDecisionModal(false)}
          onSave={(decData) => {
            addDecision({
              ...decData,
              institute: selectedInstitute.name,
            });
            toast.success('Committee decision recorded & verified');
            setShowDecisionModal(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SCHEDULE HEARING MODAL */}
      {/* ========================================================================= */}
      {showScheduleModal && selectedInstitute && (
        <ScheduleHearingModal
          institute={selectedInstitute}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(meetingData) => {
            const meeting = createMeeting({
              ...meetingData,
              institute: selectedInstitute.name,
            });
            toast.success(`Hearing scheduled for ${selectedInstitute.name}`);
            setShowScheduleModal(false);
            setActiveTab('hearings');
          }}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: Compliance Gauge Bar
// =========================================================================
const ComplianceGauge = ({ title, value, description }) => {
  const safeValue = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</span>
        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{safeValue}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-sky-500 transition-all duration-300 rounded-full"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {description && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
          {description}
        </p>
      )}
    </div>
  );
};

// =========================================================================
// MODAL COMPONENT 1: Add / Edit Institute Modal
// =========================================================================
const AddEditInstituteModal = ({ institute, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: institute?.name || '',
    location: institute?.location || '',
    application: institute?.application || '',
    applicationId: institute?.applicationId || '',
    type: institute?.type || 'Engineering',
    status: institute?.status || 'Under Review',
    facultyCompliance: institute?.facultyCompliance ?? 85,
    infrastructure: institute?.infrastructure ?? 88,
    nirfRank: institute?.nirfRank || '',
    established: institute?.established || 2010,
    contactEmail: institute?.contactEmail || '',
    contactPhone: institute?.contactPhone || '',
    principalName: institute?.principalName || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Institute name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn my-8">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiBriefcase className="text-sky-500" />
            <span>{institute ? 'Edit Institute Profile' : 'Register New Institute'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institution Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Indian Institute of Information Technology"
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Program Type
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              >
                <option value="Engineering">Engineering & Tech</option>
                <option value="Management">Management (MBA/PGDM)</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Architecture">Architecture & Planning</option>
                <option value="Applied Arts">Applied Arts & Crafts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Application Scope / Program
            </label>
            <input
              type="text"
              value={formData.application}
              onChange={e => setFormData({ ...formData, application: e.target.value })}
              placeholder="e.g. New B.Tech AI & Data Science Program"
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              >
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Established Year
              </label>
              <input
                type="number"
                value={formData.established}
                onChange={e => setFormData({ ...formData, established: e.target.value })}
                placeholder="2010"
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Compliance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.facultyCompliance}
                onChange={e => setFormData({ ...formData, facultyCompliance: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Infrastructure Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.infrastructure}
                onChange={e => setFormData({ ...formData, infrastructure: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIRF Rank (Optional)
              </label>
              <input
                type="number"
                value={formData.nirfRank}
                onChange={e => setFormData({ ...formData, nirfRank: e.target.value })}
                placeholder="e.g. 42"
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="office@college.edu"
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm transition-colors"
            >
              {institute ? 'Save Changes' : 'Register Institute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL COMPONENT 2: Upload Document Modal
// =========================================================================
const UploadDocModal = ({ instituteName, onClose, onUpload }) => {
  const [docData, setDocData] = useState({
    fileName: '',
    type: 'Application PDF',
    size: '2.4 MB',
    uploadedBy: 'AICTE Officer',
    verified: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!docData.fileName.trim()) {
      toast.error('Document title/file name is required');
      return;
    }
    onUpload(docData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiUpload className="text-sky-500" />
            <span>Upload Document to Vault</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <p className="text-[11px] text-slate-400">Attaching to:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{instituteName}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title / File Name *
            </label>
            <input
              type="text"
              required
              value={docData.fileName}
              onChange={e => setDocData({ ...docData, fileName: e.target.value })}
              placeholder="e.g. Land_and_Building_Compliance_2026.pdf"
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={docData.type}
              onChange={e => setDocData({ ...docData, type: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            >
              <option value="Application PDF">AICTE Approval Application</option>
              <option value="Faculty Details">Faculty Compliance & Biometrics</option>
              <option value="Inspection Report">Expert Committee Inspection Report</option>
              <option value="Financial Audit">Financial Audit & Balance Sheet</option>
              <option value="Accreditation Certificate">NBA / NAAC Accreditation Proof</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                File Size
              </label>
              <input
                type="text"
                value={docData.size}
                onChange={e => setDocData({ ...docData, size: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Uploaded By
              </label>
              <input
                type="text"
                value={docData.uploadedBy}
                onChange={e => setDocData({ ...docData, uploadedBy: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold"
            >
              Upload & Generate Hash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL COMPONENT 3: Record Committee Decision Modal
// =========================================================================
const RecordDecisionModal = ({ instituteName, onClose, onSave }) => {
  const [decData, setDecData] = useState({
    decision: 'Approved',
    remarks: 'Approved post verification of faculty list, laboratory infrastructure, and compliance report.',
    committee: 'Dr. Rajesh Kumar, Dr. Priya Sharma, Dr. Amit Verma',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(decData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiCheckSquare className="text-sky-500" />
            <span>Record Official Committee Decision</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <p className="text-[11px] text-slate-400">Target Institute:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{instituteName}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Decision Outcome *
            </label>
            <select
              value={decData.decision}
              onChange={e => setDecData({ ...decData, decision: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            >
              <option value="Approved">Approved (Full Approval)</option>
              <option value="Conditional Approval">Conditional Approval</option>
              <option value="Under Review">Under Review (Further Proof Requested)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Committee Signatories (Comma-separated)
            </label>
            <input
              type="text"
              value={decData.committee}
              onChange={e => setDecData({ ...decData, committee: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Evaluation Remarks / Stipulations
            </label>
            <textarea
              rows={3}
              value={decData.remarks}
              onChange={e => setDecData({ ...decData, remarks: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm"
            >
              Record & Stamp on Blockchain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL COMPONENT 4: Schedule Hearing Modal
// =========================================================================
const ScheduleHearingModal = ({ institute, onClose, onSchedule }) => {
  const [hearingData, setHearingData] = useState({
    title: `${institute.name} — AICTE Approval Hearing`,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:30',
    endTime: '12:00',
    type: 'Hearing',
    securityLevel: 'Confidential',
    description: `Formal review hearing for ${institute.application}`,
    participants: 'Dr. Rajesh Kumar, Dr. Priya Sharma, Institute Director',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hearingData.title.trim()) {
      toast.error('Hearing title is required');
      return;
    }
    onSchedule(hearingData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiVideo className="text-sky-500" />
            <span>Schedule Hearing Session</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hearing Title *
            </label>
            <input
              type="text"
              required
              value={hearingData.title}
              onChange={e => setHearingData({ ...hearingData, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={hearingData.date}
                onChange={e => setHearingData({ ...hearingData, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={hearingData.startTime}
                onChange={e => setHearingData({ ...hearingData, startTime: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={hearingData.endTime}
                onChange={e => setHearingData({ ...hearingData, endTime: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Committee Members & Attendees
            </label>
            <input
              type="text"
              value={hearingData.participants}
              onChange={e => setHearingData({ ...hearingData, participants: e.target.value })}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm"
            >
              Create Hearing Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HubPage;
