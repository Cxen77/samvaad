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
    <div className="space-y-4">
      <div className="pb-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">Review and verify committee compliance documents</p>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
        {documents.map(doc => (
          <div key={doc.id || doc.fileName} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <FiFileText size={20} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate block">{doc.fileName}</span>
                  {doc.verified && (
                    <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-0.5 shrink-0" title="Cryptographically Verified">
                      <FiCheckCircle size={12} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {doc.type} • {doc.size}
                </p>
                {doc.uploadedBy && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    Uploaded by: {doc.uploadedBy}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleViewDoc(doc)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Download Document"
            >
              <FiDownload size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPanel;
