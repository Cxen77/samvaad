import React from 'react';
import { FiFileText, FiDownload, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DocumentsPanel = ({ meeting }) => {
  const documents = meeting.documents || [
    { id: 'doc-1', fileName: 'AICTE_Application_2026.pdf', type: 'Application PDF', size: '2.4 MB', uploadedBy: 'Institute Principal', verified: true },
    { id: 'doc-2', fileName: 'Faculty_Details_Compliance.pdf', type: 'Faculty Documents', size: '1.8 MB', uploadedBy: 'Institute Principal', verified: true },
    { id: 'doc-3', fileName: 'Infrastructure_Inspection_Report.pdf', type: 'Inspection Report', size: '4.1 MB', uploadedBy: 'Expert Committee', verified: true },
  ];

  const handleViewDoc = (doc) => {
    toast.success(`Opening ${doc.fileName}`);
  };

  return (
    <div className="panel-documents">
      <div className="panel-documents__header">
        <h3 className="panel-documents__title flex items-center gap-1.5">
          <FiFileText size={16} className="text-sky-400" />
          <span>Dossier Attachments</span>
        </h3>
        <p className="panel-documents__subtitle">Review committee compliance documents</p>
      </div>

      <div className="panel-documents__list">
        {documents.map(doc => (
          <div key={doc.id || doc.fileName} className="panel-documents__card">
            <div className="panel-documents__icon">
              <FiFileText size={18} />
            </div>
            <div className="panel-documents__details min-w-0 pr-2">
              <div className="panel-documents__filename-row flex items-center gap-1.5">
                <span className="panel-documents__filename truncate">{doc.fileName}</span>
                {doc.verified && (
                  <span className="panel-documents__verified-badge shrink-0" title="Verified Document">
                    <FiCheckCircle size={11} /> Verified
                  </span>
                )}
              </div>
              <p className="panel-documents__meta truncate">
                {doc.type} • {doc.size}
              </p>
              {doc.uploadedBy && (
                <p className="panel-documents__uploader truncate">
                  Uploaded by: {doc.uploadedBy}
                </p>
              )}
            </div>
            <button
              onClick={() => handleViewDoc(doc)}
              className="panel-documents__view-btn shrink-0"
              title="Download Document"
            >
              <FiDownload size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPanel;
