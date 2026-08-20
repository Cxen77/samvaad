import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Key, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import useSettings from '../../../hooks/useSettings';
import api, { getAccessToken } from '../../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../common/Toast';

const AccountSettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [githubConnected, setGithubConnected] = useState(!!user.githubId);
    const [connectLoading, setConnectLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        setGithubConnected(!!user.githubId);
    }, [user]);

    const handleGithubConnect = async () => {
        if (githubConnected) {
            try {
                setConnectLoading(true);
                await api.delete('/users/github');
                setGithubConnected(false);
                setUser(prev => ({ ...prev, githubId: undefined }));
                addToast('GitHub disconnected.', 'success');
            } catch (err) {
                console.error("Failed to disconnect GitHub", err);
                addToast('Failed to disconnect GitHub.', 'error');
            } finally {
                setConnectLoading(false);
            }
        } else {
            const token = getAccessToken();
            const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
            window.location.href = `${backendUrl}/api/auth/github?token=${token}`;
        }
    };

    const [formData, setFormData] = useState({
        name: user.name || '',
        username: user.username || '',
        email: user.email || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = () => {
        const { email, ...updatePayload } = formData; // Email changes are not supported via this form
        updateSettings('/users/profile', updatePayload, "Account updated successfully!");
    };

    const handlePasswordChange = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword || !newPassword || !confirmPassword) {
            addToast('Please fill in all password fields.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            addToast('New passwords do not match.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            addToast('New password must be at least 6 characters.', 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/users/profile', {
                currentPassword,
                password: newPassword
            });
            addToast('Password changed successfully!', 'success');
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to change password.';
            addToast(msg, 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="space-y-8 max-w-3xl pb-24 md:pb-0">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="flex gap-4">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none shadow-sm cursor-not-allowed"
                        />
                        <div className="flex items-center gap-1.5 px-3 text-sm text-gray-500">
                            {user.collegeVerified ? (
                                <><CheckCircle size={16} className="text-green-500" /><span className="text-green-600 font-medium">Verified</span></>
                            ) : (
                                <><XCircle size={16} className="text-gray-400" /><span>Unverified</span></>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
                </div>

                {/* Save Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0 md:flex md:justify-end md:pt-2 z-50">
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

                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Password & Authentication</h3>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
                    >
                        <Key size={16} />
                        Change Password
                    </button>

                    {/* Change Password Inline Modal */}
                    {showPasswordModal && (
                        <div className="mt-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm">Change Password</h4>
                            {/* Current password */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                        placeholder="Enter current password"
                                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
                                    />
                                    <button type="button" onClick={() => toggleShowPassword('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {/* New password */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                        placeholder="At least 6 characters"
                                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
                                    />
                                    <button type="button" onClick={() => toggleShowPassword('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {/* Confirm password */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                        placeholder="Re-enter new password"
                                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
                                    />
                                    <button type="button" onClick={() => toggleShowPassword('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {/* Mismatch indicator */}
                            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Passwords do not match</p>
                            )}
                            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword && (
                                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Passwords match</p>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={passwordLoading}
                                    className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 relative"
                                >
                                    {passwordLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : 'Update Password'}
                                </button>
                                <button
                                    onClick={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Connected Accounts</h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <FaGithub className="text-2xl text-gray-900" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">GitHub</h4>
                                    <p className="text-xs text-gray-500">
                                        {githubConnected ? 'Account connected' : 'Link your GitHub account'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGithubConnect}
                                disabled={connectLoading}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${githubConnected
                                    ? 'bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200'
                                    : 'bg-gray-900 text-white hover:bg-black'
                                    }`}
                            >
                                {connectLoading ? 'Processing...' : (githubConnected ? 'Disconnect' : 'Connect')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

AccountSettings.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
        email: PropTypes.string
    }).isRequired,
    setUser: PropTypes.func.isRequired
};

export default AccountSettings;
