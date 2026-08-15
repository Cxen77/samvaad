import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes, FaGithub, FaLinkedin, FaTwitter, FaInstagram, FaGlobe, FaCheck } from 'react-icons/fa';
import api from '../../api/axios';
import RequestCollegeModal from './RequestCollegeModal';

const ProfileEditModal = ({ user, onClose, onUpdate }) => {
    const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
    const [collegeResults, setCollegeResults] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [formData, setFormData] = useState({
        name: user.name || '',
        bio: user.bio || '',
        course: user.course || '',
        college: user.college || '',
        year: user.year || '',
        section: user.section || '',
        className: user.className || '',
        location: user.location || '',
        skills: user.skills?.join(', ') || '',
        socials: {
            github: user.socials?.github || '',
            linkedin: user.socials?.linkedin || '',
            twitter: user.socials?.twitter || '',
            instagram: user.socials?.instagram || '',
            portfolio: user.socials?.portfolio || ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('socials.')) {
            const socialKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                socials: {
                    ...prev.socials,
                    [socialKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Debounced Search for Colleges
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.college && formData.college.length > 2) {
                try {
                    const { data } = await api.get(`/colleges/search?q=${encodeURIComponent(formData.college)}`);
                    setCollegeResults(data);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setCollegeResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.college]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Convert skills string to array
            const skillsArray = formData.skills.toString()
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const updateData = {
                name: formData.name,
                bio: formData.bio,
                course: formData.course,
                college: formData.college,
                collegeId: formData.collegeId,
                year: formData.year,
                section: formData.section,
                className: formData.className,
                location: formData.location,
                skills: skillsArray,
                socials: formData.socials
            };

            const { data } = await api.put('/users/profile', updateData);
            setSuccess(true);

            // Wait a moment to show success state before closing
            setTimeout(() => {
                onUpdate(data);
                onClose();
            }, 1000);
        } catch (err) {
            console.error('Profile update error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile';
            setError(errorMsg);
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

            <div className="bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-2xl shadow-xl overflow-hidden pointer-events-auto relative animate-slide-up sm:animate-in sm:zoom-in-95 duration-200 flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">

                {/* Drag Handle for Mobile */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1 flex-shrink-0" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Form Content - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <FaTimes className="flex-shrink-0" /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <FaCheck className="flex-shrink-0" /> Profile updated successfully!
                        </div>
                    )}

                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <div className="pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Basic Details</h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Bio
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Tell us about yourself..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-none"
                            />
                        </div>
                    </div>

                    {/* Education Group */}
                    <div className="space-y-4">
                        <div className="pb-2 border-b border-gray-100 pt-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Education & Location</h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                College / University
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="college"
                                    value={formData.college}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setShowCollegeDropdown(true);
                                    }}
                                    onFocus={() => setShowCollegeDropdown(true)}
                                    // Delay blur to allow click on dropdown items
                                    onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 200)}
                                    placeholder="Search your college..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                    autoComplete="off"
                                />
                                {showCollegeDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                        {collegeResults.map((college) => (
                                            <div
                                                key={college._id}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        college: college.name,
                                                        collegeId: college._id
                                                    }));
                                                    setShowCollegeDropdown(false);
                                                }}
                                            >
                                                <div className="font-bold text-gray-900 text-sm">{college.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{college.city}, {college.state}</div>
                                            </div>
                                        ))}

                                        {collegeResults.length === 0 && formData.college.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowRequestModal(true)}
                                                className="w-full text-left px-4 py-3 text-sm text-sky-600 hover:bg-sky-50 font-medium transition-colors"
                                            >
                                                + Can't find it? Add "{formData.college}"
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Course
                                </label>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    placeholder="e.g. Computer Science"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Semester
                                </label>
                                <input
                                    type="text"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    placeholder="e.g. 6th"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Academic Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Section <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    placeholder="e.g. A, B, C"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Class Name <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="className"
                                    value={formData.className}
                                    onChange={handleChange}
                                    placeholder="e.g. CSE-A, B.Tech-II"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, Country"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Skills
                            </label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="React, Node.js, Design..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                            />
                            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                        </div>
                    </div>

                    {/* Socials Group */}
                    <div className="space-y-4">
                        <div className="pb-2 border-b border-gray-100 pt-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Social Presence</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <FaGithub /> GitHub
                                </label>
                                <input
                                    type="url"
                                    name="socials.github"
                                    value={formData.socials.github}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <FaLinkedin /> LinkedIn
                                </label>
                                <input
                                    type="url"
                                    name="socials.linkedin"
                                    value={formData.socials.linkedin}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <FaTwitter /> Twitter
                                </label>
                                <input
                                    type="url"
                                    name="socials.twitter"
                                    value={formData.socials.twitter}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <FaInstagram /> Instagram
                                </label>
                                <input
                                    type="url"
                                    name="socials.instagram"
                                    value={formData.socials.instagram}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                <FaGlobe /> Portfolio URL
                            </label>
                            <input
                                type="url"
                                name="socials.portfolio"
                                value={formData.socials.portfolio}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-white">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || success}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Saving Changes...</span>
                            </>
                        ) : success ? (
                            <>
                                <FaCheck /> <span>Saved!</span>
                            </>
                        ) : (
                            <span>Save Profile</span>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {showRequestModal && (
                <RequestCollegeModal
                    onClose={() => setShowRequestModal(false)}
                    onSuccess={(newCollege) => {
                        setFormData(prev => ({
                            ...prev,
                            college: newCollege.name,
                            collegeId: newCollege._id
                        }));
                        setCollegeResults([]);
                        setShowCollegeDropdown(false);
                    }}
                />
            )}
        </div>,
        document.body
    );
};

ProfileEditModal.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        bio: PropTypes.string,
        course: PropTypes.string,
        college: PropTypes.string,
        year: PropTypes.string,
        location: PropTypes.string,
        skills: PropTypes.arrayOf(PropTypes.string),
        socials: PropTypes.shape({
            github: PropTypes.string,
            linkedin: PropTypes.string,
            twitter: PropTypes.string,
            instagram: PropTypes.string,
            portfolio: PropTypes.string
        })
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
};

export default ProfileEditModal;
