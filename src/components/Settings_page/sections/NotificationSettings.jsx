import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Bell } from 'lucide-react';
import useSettings from '../../../hooks/useSettings';

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${checked ? 'bg-sky-600' : 'bg-gray-200'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

ToggleSwitch.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

const NotificationRow = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
);

NotificationRow.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

const ToggleOption = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
);

ToggleOption.propTypes = {
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

const NotificationSettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const [notifSettings, setNotifSettings] = useState({
        emailNotifications: user.settings?.notifications?.emailNotifications ?? true,
        teamInvites: user.settings?.notifications?.teamInvites ?? true,
        newMessages: user.settings?.notifications?.newMessages ?? true,
        eventReminders: user.settings?.notifications?.eventReminders ?? true,
        mentions: user.settings?.notifications?.mentions ?? true,
        pushNotifications: user.settings?.notifications?.pushNotifications ?? true
    });

    const handleToggle = (key) => {
        setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        updateSettings('/users/profile', {
            settings: { notifications: notifSettings }
        }, "Notification preferences updated!");
    };

    return (
        <div className="space-y-8 max-w-3xl pb-24 md:pb-0">
            <div className="space-y-6">
                <div className="bg-sky-50 p-4 rounded-xl flex items-start gap-3 border border-sky-100">
                    <Mail className="text-sky-600 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-sky-900">Email Notifications</h4>
                        <p className="text-xs text-sky-700 mt-1">We'll send important emails to <span className="font-semibold">{user.email}</span></p>
                    </div>
                    <div className="ml-auto">
                        <ToggleSwitch
                            checked={notifSettings.emailNotifications}
                            onChange={() => handleToggle('emailNotifications')}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Bell size={16} className="text-gray-500" />
                        Activity Alerts
                    </h3>
                    <div className="space-y-2 bg-white rounded-xl divide-y divide-gray-50">
                        <NotificationRow
                            label="Team Invitations"
                            description="When someone invites you to join a team"
                            checked={notifSettings.teamInvites}
                            onChange={() => handleToggle('teamInvites')}
                        />
                        <NotificationRow
                            label="New Messages"
                            description="When you receive a direct message"
                            checked={notifSettings.newMessages}
                            onChange={() => handleToggle('newMessages')}
                        />
                        <NotificationRow
                            label="Event Reminders"
                            description="1 hour before an event starts"
                            checked={notifSettings.eventReminders}
                            onChange={() => handleToggle('eventReminders')}
                        />
                        <NotificationRow
                            label="Comments & Mentions"
                            description="When someone mentions you or comments on your post"
                            checked={notifSettings.mentions}
                            onChange={() => handleToggle('mentions')}
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">Push Notifications</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <ToggleOption
                            label="Enable push notifications"
                            checked={notifSettings.pushNotifications}
                            onChange={() => handleToggle('pushNotifications')}
                        />
                        <p className="text-xs text-gray-500 mt-2 pl-1">
                            Receive notifications on your device even when the app is closed.
                        </p>
                    </div>
                </div>

                {/* Sticky Save Button for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0 md:flex md:justify-end md:pt-4 z-50">
                    <button
                        onClick={handleSave}
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

NotificationSettings.propTypes = {
    user: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired
};

export default NotificationSettings;
