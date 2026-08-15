import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaCheck, FaUniversity, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const RequestCollegeModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        country: 'India',
        state: '',
        city: '',
        type: 'College'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validate = () => {
        const { name, country, type } = formData;
        if (!name || name.trim().length < 3) return "Name must be at least 3 characters.";
        if (/^\d+$/.test(name)) return "Name cannot be just numbers.";
        if (name.length > 120) return "Name is too long.";
        if (!country) return "Please select a country.";
        if (!type) return "Please select an institution type.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/colleges/request', formData);
            toast.success(data.message || 'Request submitted successfully!');
            if (onSuccess) onSuccess(data.college);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit request.';
            setError(msg);
            // If it already exists, we might still want to close or show details
            if (msg.includes("already exists")) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden pointer-events-auto">
                {/* Decorative header background */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-sky-600 to-sky-600 opacity-10 pointer-events-none"></div>

                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                            <FaUniversity className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Add Missing Institution</h3>
                            <p className="text-sm text-gray-500">Submit details for verification</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
                                <span className="mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                Institution Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                                placeholder="e.g. St. Xavier's College"
                                autoFocus
                            />
                        </div>

                        {/* Type & Country Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Type</label>
                                <div className="relative">
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none appearance-none"
                                    >
                                        <option value="College">College</option>
                                        <option value="University">University</option>
                                        <option value="School">School</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Country</label>
                                <div className="relative">
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none appearance-none"
                                    >
                                        <option value="India">India 🇮🇳</option>
                                        <option value="Nepal">Nepal 🇳🇵</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <FaGlobe />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* State & City Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">State <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                                    placeholder="e.g. Maharashtra"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">City <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                                    placeholder="e.g. Mumbai"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 rounded-xl font-medium shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheck />
                                        <span>Submit to Admins</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );

};

export default RequestCollegeModal;
