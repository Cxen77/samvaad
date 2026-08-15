import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Users, RefreshCw, MapPin, Zap } from 'lucide-react';
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

const AutoTeamSettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const [teamSettings, setTeamSettings] = useState({
        enableAutoMatch: user.settings?.autoTeam?.enableAutoMatch ?? true,
        matchLocation: user.settings?.autoTeam?.matchLocation || 'remote', // remote, local, hybrid
        minTeamSize: user.settings?.autoTeam?.minTeamSize || 2,
        maxTeamSize: user.settings?.autoTeam?.maxTeamSize || 4,
        autoRematch: user.settings?.autoTeam?.autoRematch ?? false
    });

    const handleToggle = (key) => {
        setTeamSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRadioChange = (e) => {
        setTeamSettings(prev => ({ ...prev, matchLocation: e.target.value }));
    };

    const handleSliderChange = (e) => {
        setTeamSettings(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
    };

    const handleSave = () => {
        updateSettings('/users/profile', {
            settings: { autoTeam: teamSettings }
        }, "Auto-Team preferences updated!");
    };

    return (
        <div className="space-y-8 max-w-3xl pb-24 md:pb-0">
            <div className="bg-sky-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Zap size={24} className="text-yellow-300" />
                            Auto-Match Status
                        </h3>
                        <ToggleSwitch
                            checked={teamSettings.enableAutoMatch}
                            onChange={() => handleToggle('enableAutoMatch')}
                        />
                    </div>
                    <p className="text-sky-100 max-w-lg">
                        {teamSettings.enableAutoMatch
                            ? "You are currently visible in the matchmaking pool. We'll utilize your skills and preferences to find the perfect team."
                            : "Auto-matching is paused. You won't receive automatic team invitations."
                        }
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className={`space-y-8 transition-opacity duration-300 ${!teamSettings.enableAutoMatch ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <MapPin size={16} />
                        Location Preference
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['remote', 'local', 'hybrid'].map((loc) => (
                            <label key={loc} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer hover:bg-gray-50 transition-all ${teamSettings.matchLocation === loc ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold shadow-sm' : 'border-gray-200 text-gray-600'}`}>
                                <input
                                    type="radio"
                                    name="matchLocation"
                                    value={loc}
                                    checked={teamSettings.matchLocation === loc}
                                    onChange={handleRadioChange}
                                    className="hidden"
                                />
                                <span className="capitalize">{loc} Only</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users size={16} />
                        Team Size Preference
                    </h3>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-6">
                            <span>Min: {teamSettings.minTeamSize} Members</span>
                            <span>Max: {teamSettings.maxTeamSize} Members</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full">
                            {/* Simple Slider UI - Ideally create a dual-slider component, but standard range inputs work for MVP */}
                            <input
                                type="range"
                                name="maxTeamSize"
                                min="2"
                                max="10"
                                value={teamSettings.maxTeamSize}
                                onChange={handleSliderChange}
                                className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute h-full bg-sky-500 rounded-full transition-all"
                                style={{ width: `${(teamSettings.maxTeamSize / 10) * 100}%` }}
                            />
                            <div
                                className="absolute h-4 w-4 bg-white border-2 border-sky-500 rounded-full shadow top-1/2 -translate-y-1/2 transition-all pointer-events-none"
                                style={{ left: `${(teamSettings.maxTeamSize / 10) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">Drag to adjust desired maximum team size</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <RefreshCw size={14} className="text-gray-500" />
                            Auto Re-match
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Automatically find a new team if my current one disbands.</p>
                    </div>
                    <ToggleSwitch
                        checked={teamSettings.autoRematch}
                        onChange={() => handleToggle('autoRematch')}
                    />
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

AutoTeamSettings.propTypes = {
    user: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired
};

export default AutoTeamSettings;
