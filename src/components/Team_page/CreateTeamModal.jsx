import React, { useState } from "react";
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes, FaUsers, FaLock, FaGlobe } from "react-icons/fa";
import api from "../../api/axios";

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "Development",
        visibility: "public"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data } = await api.post("/teams", formData);
            onTeamCreated(data);
            onClose();
            setFormData({
                name: "",
                description: "",
                category: "Development",
                visibility: "public"
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-xl overflow-hidden pointer-events-auto relative animate-slide-up sm:animate-in sm:zoom-in-95 duration-200">
                {/* Drag Handle for Mobile */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
                </div>

                <div className="flex justify-between items-center px-6 pt-4 pb-2 sm:p-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Create New Team</h3>
                        <p className="text-sm text-gray-500">Collaborate and build together</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Team Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition font-medium"
                            placeholder="e.g. Mobile App Squad"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-none text-sm"
                            placeholder="What is this team about?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-sm font-medium"
                            >
                                <option value="Development">Development</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Research">Research</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Visibility</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, visibility: "public" })}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${formData.visibility === "public" ? "bg-white text-sky-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <FaGlobe size={12} /> Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, visibility: "private" })}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${formData.visibility === "private" ? "bg-white text-sky-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <FaLock size={12} /> Private
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-2 safe-area-pb">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <FaUsers className="text-gray-400" />
                                    <span>Create Team</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

CreateTeamModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onTeamCreated: PropTypes.func.isRequired
};
