import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Moon, Sun, Monitor, Type, Calendar } from 'lucide-react';
import useSettings from '../../../hooks/useSettings';
import { useTheme } from '../../../context/ThemeContext';

const RadioCard = ({ name, value, label, icon: Icon, checked, onChange }) => (
    <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer hover:bg-gray-50 transition-all aspect-square ${checked ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md transform scale-[1.02]' : 'border-gray-200 text-gray-600 bg-white'}`}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            className="hidden"
        />
        <div className={`p-3 rounded-full mb-3 ${checked ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
            <Icon size={24} />
        </div>
        <span className="font-bold text-sm">{label}</span>
        {checked && <div className="mt-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />}
    </label>
);

RadioCard.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

const InterfaceSettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const { theme: activeTheme, setTheme } = useTheme();
    const [preferences, setPreferences] = useState({
        language: user.settings?.interface?.language || 'en',
        eventType: user.settings?.interface?.eventType || 'all'
    });

    const handleThemeChange = (value) => {
        setTheme(value); // Applies immediately via ThemeContext
    };

    const handleChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        updateSettings('/users/profile', {
            settings: { interface: { ...preferences, theme: activeTheme } }
        }, "Interface preferences updated!");
    };

    return (
        <div className="space-y-10 max-w-3xl pb-24 md:pb-0">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Appearance</h3>
                <div className="grid grid-cols-3 gap-4">
                    <RadioCard
                        name="theme"
                        value="light"
                        label="Light"
                        icon={Sun}
                        checked={activeTheme === 'light'}
                        onChange={(e) => handleThemeChange(e.target.value)}
                    />
                    <RadioCard
                        name="theme"
                        value="dark"
                        label="Dark"
                        icon={Moon}
                        checked={activeTheme === 'dark'}
                        onChange={(e) => handleThemeChange(e.target.value)}
                    />
                    <RadioCard
                        name="theme"
                        value="system"
                        label="System"
                        icon={Monitor}
                        checked={activeTheme === 'system'}
                        onChange={(e) => handleThemeChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Type size={16} />
                        Language & Region
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Language</label>
                            <select
                                value={preferences.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all appearance-none bg-white shadow-sm"
                            >
                                <option value="en">English (US)</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="zh">Chinese</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Timezone</label>
                            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all appearance-none bg-white shadow-sm">
                                <option>Pacific Time (PT) - UTC-8</option>
                                <option>Eastern Time (ET) - UTC-5</option>
                                <option>London (GMT) - UTC+0</option>
                                <option>India Standard Time (IST) - UTC+5:30</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        Preferred Event Types
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {['Hackathons', 'Seminars', 'Meetups', 'Workshops', 'Social'].map((type) => (
                            <button
                                key={type}
                                onClick={() => {
                                    // Simple toggle logic for demo - in real app would use array state
                                    handleChange('eventType', type);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${preferences.eventType === type ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
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
                        Save Preferences
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

InterfaceSettings.propTypes = {
    user: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired
};

export default InterfaceSettings;
