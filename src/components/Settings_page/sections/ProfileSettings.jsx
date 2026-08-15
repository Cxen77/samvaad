import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Camera, Github, Linkedin, Twitter, Instagram, Globe } from 'lucide-react';
import useSettings from '../../../hooks/useSettings';
import Avatar from '../../common/Avatar';
import api from '../../../api/axios';
import { useToast } from '../../common/Toast';

const SocialInput = ({ icon: Icon, name, placeholder, value, onChange }) => (
    <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors">
            <Icon size={18} />
        </div>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all shadow-sm"
        />
    </div>
);

SocialInput.propTypes = {
    icon: PropTypes.elementType.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

const ProfileSettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const { addToast } = useToast();
    const profilePicInputRef = useRef(null);
    const bannerPicInputRef = useRef(null);
    const [profilePicLoading, setProfilePicLoading] = useState(false);
    const [bannerPicLoading, setBannerPicLoading] = useState(false);

    const [formData, setFormData] = useState({
        bio: user.bio || '',
        course: user.course || '',
        usn: user.usn || '',
        year: user.year || '',
        skills: user.skills || [],
        socials: {
            github: user.socials?.github || '',
            linkedin: user.socials?.linkedin || '',
            twitter: user.socials?.twitter || '',
            instagram: user.socials?.instagram || '',
            portfolio: user.socials?.portfolio || ''
        }
    });
    const [newSkill, setNewSkill] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSocialChange = (e) => {
        setFormData({
            ...formData,
            socials: { ...formData.socials, [e.target.name]: e.target.value }
        });
    };

    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!formData.skills.includes(newSkill.trim())) {
                setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
            }
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(skill => skill !== skillToRemove)
        });
    };

    const handleUpdate = () => {
        updateSettings('/users/profile', formData, "Profile updated successfully!");
    };

    const handleProfilePicChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePicLoading(true);
        try {
            const fd = new FormData();
            fd.append('profilePic', file);
            const { data } = await api.put('/users/profile-pic', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(data);
            addToast('Profile picture updated!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to update profile picture.', 'error');
        } finally {
            setProfilePicLoading(false);
        }
    };

    const handleBannerPicChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerPicLoading(true);
        try {
            const fd = new FormData();
            fd.append('bannerPic', file);
            const { data } = await api.put('/users/banner-pic', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(data);
            addToast('Banner picture updated!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to update banner picture.', 'error');
        } finally {
            setBannerPicLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl pb-24 md:pb-0">
            {/* Hidden file inputs */}
            <input
                ref={profilePicInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
            />
            <input
                ref={bannerPicInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerPicChange}
            />

            {/* Banner & Avatar */}
            <div className="relative mb-16 group">
                <div
                    className="h-40 w-full bg-gradient-to-r from-sky-400 via-sky-400 to-pink-400 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
                    onClick={() => !bannerPicLoading && bannerPicInputRef.current?.click()}
                >
                    {user.bannerPic && (
                        <img src={user.bannerPic} alt="Banner" className="w-full h-full object-cover" />
                    )}
                    <button
                        type="button"
                        disabled={bannerPicLoading}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        onClick={(e) => { e.stopPropagation(); bannerPicInputRef.current?.click(); }}
                    >
                        {bannerPicLoading ? (
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Camera size={20} />
                        )}
                    </button>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
                <div className="absolute -bottom-10 left-6 sm:left-10">
                    <div className="relative group/avatar">
                        <Avatar
                            src={user.profilePic}
                            alt="Profile"
                            size="custom"
                            className="w-28 h-28 border-[4px] border-white shadow-lg bg-white relative z-10"
                        />
                        <button
                            type="button"
                            disabled={profilePicLoading}
                            onClick={() => profilePicInputRef.current?.click()}
                            className="absolute bottom-1 right-1 z-20 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-700 transition-transform hover:scale-105 border-2 border-white shadow-md disabled:opacity-50"
                        >
                            {profilePicLoading ? (
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Camera size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        rows="4"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        maxLength={300}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all resize-none shadow-sm"
                    />
                    <p className="text-xs text-gray-400 text-right">{formData.bio.length}/300 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Course / Major</label>
                        <input
                            type="text"
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            placeholder="e.g. Computer Science"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            USN
                            <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Univ. Serial No.</span>
                        </label>
                        <input
                            type="text"
                            name="usn"
                            value={formData.usn}
                            onChange={handleChange}
                            placeholder="e.g. 1BM21CS001"
                            maxLength={20}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all shadow-sm uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Year</label>
                        <div className="relative">
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all bg-white appearance-none shadow-sm cursor-pointer"
                            >
                                <option value="">Select year</option>
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                                <option>Graduate</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Skills</label>
                    <div className="min-h-[3rem] p-2 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-wrap gap-2 mb-2 focus-within:ring-2 focus-within:ring-sky-100 focus-within:border-sky-400 transition-all">
                        {formData.skills.map((skill) => (
                            <span key={skill} className="px-3 py-1 bg-white text-sky-600 rounded-lg shadow-sm font-medium text-sm flex items-center gap-1.5 border border-gray-100">
                                {skill}
                                <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-gray-50">×</button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={addSkill}
                            placeholder={formData.skills.length === 0 ? "Type a skill and press Enter" : ""}
                            className="bg-transparent border-none outline-none flex-1 min-w-[120px] text-sm py-1 px-1"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Press Enter after typing a skill to add it.</p>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        Social Links
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SocialInput icon={Github} name="github" placeholder="GitHub Username" value={formData.socials.github} onChange={handleSocialChange} />
                        <SocialInput icon={Linkedin} name="linkedin" placeholder="LinkedIn URL" value={formData.socials.linkedin} onChange={handleSocialChange} />
                        <SocialInput icon={Twitter} name="twitter" placeholder="Twitter Handle" value={formData.socials.twitter} onChange={handleSocialChange} />
                        <SocialInput icon={Instagram} name="instagram" placeholder="Instagram Username" value={formData.socials.instagram} onChange={handleSocialChange} />
                        <SocialInput icon={Globe} name="portfolio" placeholder="Portfolio Website" value={formData.socials.portfolio} onChange={handleSocialChange} />
                    </div>
                </div>

                {/* Sticky Save Button for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0 md:flex md:justify-end md:pt-4 z-50">
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-2.5 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 relative overflow-hidden"
                    >
                        <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                            Save Changes
                        </span>
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

ProfileSettings.propTypes = {
    user: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired
};

export default ProfileSettings;
