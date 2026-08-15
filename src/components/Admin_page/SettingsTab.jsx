import { useState, useEffect } from 'react';
import { FiSettings, FiToggleLeft, FiToggleRight, FiInfo, FiShield, FiAlertTriangle } from 'react-icons/fi';
import api from '../../api/axios';

const featureMeta = {
    maintenance: { label: 'Maintenance Mode', desc: 'Block all non-admin users from the platform', color: 'red', icon: '🔒', hasRoles: false },
    chat: { label: 'Chat System', desc: 'Real-time chat and messaging', color: 'blue', icon: '💬', hasRoles: true },
    textPost: { label: 'Text Posts', desc: 'Allow users to create text posts', color: 'violet', icon: '📝', hasRoles: true },
    imagePost: { label: 'Image Upload', desc: 'Allow users to upload images', color: 'pink', icon: '🖼️', hasRoles: true },
    forum: { label: 'Forum System', desc: 'Forum post creation and replies', color: 'cyan', icon: '🗂️', hasRoles: true },
    events: { label: 'Event Creation', desc: 'Allow users to create events', color: 'blue', icon: '📅', hasRoles: true },
    autoJoin: { label: 'Auto-Join Teams', desc: 'Auto team-matching for events', color: 'amber', icon: '🤝', hasRoles: true },
};

const ALL_ROLES = ['user', 'moderator', 'organizer', 'admin'];

export default function SettingsTab() {
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await api.get('/admin/settings');
                setFeatures(data.features || {});
            } catch (err) {
                console.error('Failed to load settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const toggleEnabled = async (name) => {
        setSaving(name);
        try {
            const current = features[name];
            const { data } = await api.patch('/admin/settings', {
                features: { [name]: { enabled: !current.enabled } }
            });
            setFeatures(data.features);
        } catch (err) {
            console.error('Toggle failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const toggleKilled = async (name) => {
        setSaving(name);
        try {
            const current = features[name];
            const { data } = await api.patch('/admin/settings', {
                features: { [name]: { isKilled: !current.isKilled } }
            });
            setFeatures(data.features);
        } catch (err) {
            console.error('Kill switch toggle failed:', err);
        } finally {
            setSaving(null);
        }
    };

    const toggleRole = async (name, role) => {
        setSaving(name);
        try {
            const current = features[name];
            const roles = current.rolesAllowed || [];
            const newRoles = roles.includes(role)
                ? roles.filter(r => r !== role)
                : [...roles, role];
            const { data } = await api.patch('/admin/settings', {
                features: { [name]: { rolesAllowed: newRoles } }
            });
            setFeatures(data.features);
        } catch (err) {
            console.error('Role toggle failed:', err);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="admin-glass rounded-2xl p-5 h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    const featureKeys = Object.keys(featureMeta);

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <FiSettings className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-bold text-gray-900">Feature Control Engine</h2>
            </div>

            <div className="space-y-3">
                {featureKeys.map(name => {
                    const meta = featureMeta[name];
                    const feature = features[name];
                    if (!feature) return null;

                    const isOn = feature.enabled;
                    const isKilled = feature.isKilled;
                    const isMaint = name === 'maintenance';

                    return (
                        <div
                            key={name}
                            className={`admin-glass rounded-2xl p-5 transition-all duration-300
                                ${isMaint && isOn ? 'border-red-500/30 bg-red-500/5' : ''}
                                ${isKilled ? 'border-red-500/50 bg-red-500/10 opacity-75' : ''}`}
                        >
                            {/* Header row: label + toggle */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{meta.icon}</span>
                                        <h3 className="text-sm font-semibold text-gray-900">{meta.label}</h3>
                                        <span className={`admin-badge ${isOn
                                            ? (isMaint ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700')
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {isOn ? (isMaint ? 'ACTIVE' : 'ON') : 'OFF'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <FiInfo className="w-3 h-3 flex-shrink-0" />
                                        {meta.desc}
                                    </p>
                                    {!isOn && !isKilled && (
                                        <p className="text-xs text-amber-400/80 mt-1 font-semibold flex items-center gap-1">
                                            <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                                            Disabled: Feature is visibly disabled but not completely erased.
                                        </p>
                                    )}
                                    {isKilled && (
                                        <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1 bg-red-500/10 p-1.5 rounded-lg border border-red-500/20 w-fit">
                                            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            KILL SWITCH ACTIVE: UI and APIs are globally removed.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                    {/* Enable Toggle */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                                        <button
                                            onClick={() => toggleEnabled(name)}
                                            disabled={saving === name}
                                            className={`transition-all duration-200 ${saving === name ? 'opacity-50' : 'hover:scale-110'}`}
                                        >
                                            {isOn ? (
                                                <FiToggleRight className={`w-8 h-8 ${isMaint ? 'text-red-400' : 'text-sky-400'}`} />
                                            ) : (
                                                <FiToggleLeft className="w-8 h-8 text-gray-300" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Kill Switch Toggle */}
                                    {!isMaint && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Kill Switch</span>
                                            <button
                                                onClick={() => toggleKilled(name)}
                                                disabled={saving === name}
                                                className={`transition-all duration-200 ${saving === name ? 'opacity-50' : 'hover:scale-110'}`}
                                            >
                                                {isKilled ? (
                                                    <FiToggleRight className="w-8 h-8 text-red-500" />
                                                ) : (
                                                    <FiToggleLeft className="w-8 h-8 text-gray-300" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Role checkboxes (only for features that support it, and only when enabled AND NOT KILLED) */}
                            {meta.hasRoles && isOn && !isKilled && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FiShield className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 font-medium">Allowed Roles</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {ALL_ROLES.map(role => {
                                            const checked = (feature.rolesAllowed || []).includes(role);
                                            return (
                                                <label
                                                    key={role}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 border
                                                        ${checked
                                                            ? 'bg-sky-50 border-sky-200 text-sky-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleRole(name, role)}
                                                        disabled={saving === name}
                                                        className="hidden"
                                                    />
                                                    <span className={`w-3 h-3 rounded border flex items-center justify-center text-[8px]
                                                        ${checked ? 'bg-sky-500 border-sky-500 text-gray-900' : 'border-gray-200'}`}>
                                                        {checked && '✓'}
                                                    </span>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Maintenance warning */}
            {features.maintenance?.enabled && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-300 flex items-center gap-2">
                        <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Maintenance mode is active — all non-admin users are blocked from the platform.
                    </p>
                </div>
            )}
        </div>
    );
}
