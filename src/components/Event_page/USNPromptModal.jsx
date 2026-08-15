import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import api from '../../api/axios';

/**
 * USNPromptModal
 *
 * Shown when a user tries to join an event that requires a USN but has none on their profile.
 * On submit: saves the USN to their profile, then calls onConfirm() so the parent
 * can retry the join without a round-trip reload.
 */
const USNPromptModal = ({ onConfirm, onClose }) => {
    const [usn, setUsn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = usn.trim().toUpperCase();
        if (!trimmed) {
            setError('Please enter your USN.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.put('/users/profile', { usn: trimmed });
            onConfirm(trimmed);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save USN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start gap-3 mb-5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">USN Required</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            The organizer requires your University Serial Number to participate.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Your USN
                        </label>
                        <input
                            type="text"
                            value={usn}
                            onChange={(e) => { setUsn(e.target.value); setError(''); }}
                            placeholder="e.g. 1BM21CS001"
                            maxLength={20}
                            autoFocus
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/30 outline-none transition-all shadow-sm uppercase tracking-wider text-sm"
                        />
                        {error && (
                            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            This will also be saved to your profile settings.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Save & Join'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

USNPromptModal.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default USNPromptModal;
