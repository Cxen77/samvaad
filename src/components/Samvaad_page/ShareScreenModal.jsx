import React, { useState } from 'react';
import { FiX, FiMonitor, FiSquare, FiGlobe, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ShareScreenModal = ({ isOpen, onClose }) => {
  const [sharing, setSharing] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  const startSharing = async (type) => {
    setError(null);
    try {
      const constraints = { video: true, audio: type === 'tab' };
      const mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      setStream(mediaStream);
      setSharing(true);
      toast.success('Screen sharing started');

      mediaStream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please allow screen sharing in your browser settings.');
      } else {
        setError('Screen sharing is not supported in this browser or was cancelled.');
      }
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setSharing(false);
    toast.success('Screen sharing stopped');
  };

  const handleClose = () => {
    stopSharing();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Share Screen</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><FiX size={20} className="text-slate-500" /></button>
        </div>

        <div className="p-6">
          {!sharing ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">Choose what you'd like to share:</p>

              <button onClick={() => startSharing('screen')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                  <FiMonitor size={24} className="text-sky-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Entire Screen</p>
                  <p className="text-xs text-slate-400">Share everything on your display</p>
                </div>
              </button>

              <button onClick={() => startSharing('window')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <FiSquare size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Window</p>
                  <p className="text-xs text-slate-400">Share a specific application window</p>
                </div>
              </button>

              <button onClick={() => startSharing('tab')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <FiGlobe size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Browser Tab</p>
                  <p className="text-xs text-slate-400">Share a single browser tab with audio</p>
                </div>
              </button>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <FiMonitor size={32} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">Sharing Your Screen</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>
              <button onClick={stopSharing} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">
                Stop Sharing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareScreenModal;
