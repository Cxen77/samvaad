import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaTrophy, FaImage, FaUsers, FaTag, FaIdCard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Hackathon', 'Workshop', 'Seminar', 'Tournament', 'Meetup', 'Project', 'Game', 'Sport'];

/**
 * CreateEventModal
 * Unified event creation/editing component used both in Events page (as a modal)
 * and in the Organizer panel (inline, pass isInline=true).
 *
 * Props:
 *  - isOpen        : boolean  — controls visibility (ignored when isInline=true)
 *  - onClose       : fn       — called when modal is closed
 *  - onEventCreated: fn(data, isEdit) — called after successful submit
 *  - eventToEdit   : object   — if set, the form pre-fills for editing
 *  - isInline      : boolean  — if true, renders without the modal overlay/backdrop
 */
const CreateEventModal = ({ isOpen, onClose, onEventCreated, eventToEdit = null, isInline = false }) => {
    const defaultForm = {
        title: '',
        description: '',
        date: '',
        location: '',
        category: 'Hackathon',
        prize: '',
        imageUrl: '',
        maxTeamSize: 4,
        isMultiCollege: true,
        allowTeamRegistration: false,
        requireUSN: false,
    };

    const [formData, setFormData] = useState(defaultForm);
    const [imageFile, setImageFile] = useState(null);
    const [imageFilePreview, setImageFilePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title || '',
                description: eventToEdit.description || '',
                date: eventToEdit.date ? new Date(eventToEdit.date).toISOString().split('T')[0] : '',
                location: eventToEdit.location || '',
                category: eventToEdit.category || 'Hackathon',
                prize: eventToEdit.prize || '',
                imageUrl: eventToEdit.imageUrl || '',
                maxTeamSize: eventToEdit.maxTeamSize || 4,
                isMultiCollege: eventToEdit.isMultiCollege !== undefined ? eventToEdit.isMultiCollege : true,
                allowTeamRegistration: eventToEdit.allowTeamRegistration || false,
                requireUSN: eventToEdit.requireUSN || false,
            });
        } else {
            setFormData(defaultForm);
        }
        setImageFile(null);
        setImageFilePreview(null);
        setError(null);
    }, [eventToEdit, isOpen]);

    // When not inline, skip rendering if closed
    if (!isInline && !isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImageFilePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImageFilePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let payload;
            let reqConfig = {};

            if (imageFile) {
                payload = new FormData();
                for (const key in formData) {
                    payload.append(key, formData[key]);
                }
                payload.append('imageFile', imageFile);
                reqConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
            } else {
                payload = formData;
            }

            let data;
            if (eventToEdit) {
                const res = await api.put(`/events/${eventToEdit._id}`, payload, reqConfig);
                data = res.data;
            } else {
                const res = await api.post('/events', payload, reqConfig);
                data = res.data;
            }
            toast.success(eventToEdit ? 'Event updated!' : 'Event created successfully!');
            onEventCreated?.(data, !!eventToEdit);
            if (!isInline) onClose?.();
            else {
                setFormData(defaultForm);
                setImageFile(null);
                setImageFilePreview(null);
            }
        } catch (err) {
            console.error('Failed to save event', err);
            const msg = err.response?.data?.message || 'Failed to save event';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800">
                    {error}
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Event Title</label>
                <input
                    type="text" name="title" value={formData.title} onChange={handleChange} required
                    className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition"
                    placeholder="e.g., AI Hackathon 2025"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea
                    name="description" value={formData.description} onChange={handleChange} required rows="3"
                    className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition resize-none"
                    placeholder="What is this event about?"
                />
            </div>

            {/* Date & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
                    <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date" name="date" value={formData.date} onChange={handleChange} required
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white [color-scheme:dark] focus:ring-2 focus:ring-sky-500 outline-none transition"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Location</label>
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text" name="location" value={formData.location} onChange={handleChange} required
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition"
                            placeholder="e.g., Online / Auditorium"
                        />
                    </div>
                </div>
            </div>

            {/* Category & Prize */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
                    <div className="relative">
                        <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                        <select
                            name="category" value={formData.category} onChange={handleChange}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition appearance-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Prize Pool <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                        <FaTrophy className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text" name="prize" value={formData.prize} onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition"
                            placeholder="e.g., ₹10,000"
                        />
                    </div>
                </div>
            </div>

            {/* Cover Image */}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cover Image <span className="text-gray-400 font-normal">(optional)</span></label>
                
                <div className="space-y-4">
                    {/* Custom File Upload */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            id="event-image-upload"
                            className="hidden"
                            disabled={!!formData.imageUrl}
                        />
                        <label 
                            htmlFor="event-image-upload" 
                            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                formData.imageUrl 
                                    ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed' 
                                    : 'border-sky-300 dark:border-sky-800/50 bg-sky-50/50 dark:bg-sky-900/20 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-500'
                            }`}
                        >
                            <FaImage size={24} className="mb-2 opacity-80" />
                            <span className="text-sm font-medium">Click to upload an image file</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">OR PASTE LINK</span>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                    </div>

                    <div className="relative">
                        <FaImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border  text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition ${
                                imageFile ? 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed border-transparent' : 'bg-white dark:bg-[#262626] border-gray-200 dark:border-gray-800'
                            }`}
                            placeholder="https://example.com/banner.jpg"
                            disabled={!!imageFile}
                        />
                    </div>

                    {/* Preview Area */}
                    {(imageFilePreview || formData.imageUrl) && (
                        <div className="relative rounded-xl overflow-hidden h-36 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <img 
                                src={imageFilePreview || formData.imageUrl} 
                                alt="Event Banner Preview" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-sm text-gray-400 font-medium">Invalid URL / Preview unavailable</span>';
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Event Configuration */}
            <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-xl space-y-4">
                <h3 className="font-semibold text-sky-500 dark:text-sky-400 text-sm uppercase tracking-wide">Event Configuration</h3>

                {/* Multi-college */}
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox" name="isMultiCollege" checked={formData.isMultiCollege} onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 bg-gray-100 dark:bg-gray-800 shrink-0"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Allow Cross-College Participation</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-500 mt-0.5">Students from any college can join this event</span>
                    </span>
                </label>

                {/* Team Registration */}
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox" name="allowTeamRegistration" checked={formData.allowTeamRegistration} onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 bg-gray-100 dark:bg-gray-800 shrink-0"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Enable Team Registration</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-500 mt-0.5">Participants can join as a team instead of individually</span>
                    </span>
                </label>

                {/* Max Team Size — shown when team registration is enabled */}
                <AnimatePresence>
                    {formData.allowTeamRegistration && (
                        <motion.div
                            key="teamsize"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pl-7 pt-1">
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Max Team Size</label>
                                <div className="relative w-full sm:w-1/2">
                                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="number" name="maxTeamSize" value={formData.maxTeamSize} onChange={handleChange}
                                        min="2" max="15" required
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Require USN */}
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox" name="requireUSN" checked={formData.requireUSN} onChange={handleChange}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 bg-gray-100 dark:bg-gray-800 shrink-0"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Require USN from Participants</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-500 mt-0.5">Participants will be asked to provide their University Serial Number (USN) when registering</span>
                    </span>
                </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3">
                {!isInline && (
                    <button
                        type="button" onClick={onClose} disabled={loading}
                        className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit" disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700 transition shadow-lg shadow-sky-600/20 disabled:opacity-70 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        eventToEdit ? 'Update Event' : 'Create Event'
                    )}
                </button>
            </div>
        </form>
    );

    // Inline mode — just render the form directly (used in OrganizerCreateEventTab)
    if (isInline) {
        return (
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {eventToEdit ? 'Edit Event' : 'Create New Event'}
                </h2>
                {formContent}
            </div>
        );
    }

    // Modal mode — full overlay
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 custom-scrollbar border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#121212] z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {eventToEdit ? 'Edit Event' : 'Create New Event'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <FaTimes size={18} />
                    </button>
                </div>
                <div className="p-6">
                    {formContent}
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
