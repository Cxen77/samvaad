import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, Lock, Globe } from 'lucide-react';
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

const ToggleOption = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-3">
        <div className="pr-4">
            <span className="text-sm font-medium text-gray-900 block">{label}</span>
            {description && <span className="text-xs text-gray-500 block mt-0.5">{description}</span>}
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
);

const RadioOption = ({ name, value, label, description, checked, onChange }) => (
    <label className={`flex items-start gap-3 cursor-pointer group p-3 rounded-xl border transition-all ${checked ? 'bg-sky-50 border-sky-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
        <div className="relative flex items-center mt-0.5">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-sky-600 checked:bg-sky-600 transition-all"
            />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
        </div>
        <div>
            <span className={`text-sm font-bold transition-colors ${checked ? 'text-sky-900' : 'text-gray-900'}`}>{label}</span>
            <p className={`text-xs mt-1 ${checked ? 'text-sky-700' : 'text-gray-500'}`}>{description}</p>
        </div>
    </label>
);


const PrivacySettings = ({ user, setUser }) => {
    const { updateSettings, loading } = useSettings(user, setUser);
    const [privacySettings, setPrivacySettings] = useState({
        profileVisibility: user.settings?.privacy?.profileVisibility || 'public',
        allowMessages: user.settings?.privacy?.allowMessages ?? true,
        allowTeamInvites: user.settings?.privacy?.allowTeamInvites ?? true,
        showOnlineStatus: user.settings?.privacy?.showOnlineStatus ?? true,
        showLastActive: user.settings?.privacy?.showLastActive ?? true
    });

    const handleToggle = (key) => {
        setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRadioChange = (e) => {
        setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }));
    };

    const handleSave = () => {
        updateSettings('/users/profile', {
            settings: { privacy: privacySettings }
        }, "Privacy settings updated!");
    };

    return (
        <div className="space-y-8 max-w-3xl pb-24 md:pb-0">
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Globe size={16} />
                        Profile Visibility
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                        <RadioOption
                            name="visibility"
                            value="public"
                            label="Public"
                            description="Everyone can see your profile and posts."
                            checked={privacySettings.profileVisibility === 'public'}
                            onChange={handleRadioChange}
                        />
                        <RadioOption
                            name="visibility"
                            value="students"
                            label="Students Only"
                            description="Only verified students can see your profile."
                            checked={privacySettings.profileVisibility === 'students'}
                            onChange={handleRadioChange}
                        />
                        <RadioOption
                            name="visibility"
                            value="team"
                            label="Teammates Only"
                            description="Only people in your teams can see your profile."
                            checked={privacySettings.profileVisibility === 'team'}
                            onChange={handleRadioChange}
                        />
                        <RadioOption
                            name="visibility"
                            value="private"
                            label="Private"
                            description="No one can see your profile details."
                            checked={privacySettings.profileVisibility === 'private'}
                            onChange={handleRadioChange}
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Lock size={16} />
                        Interactions
                    </h3>
                    <div className="divide-y divide-gray-50 bg-white rounded-xl border border-gray-100 px-4">
                        <ToggleOption
                            label="Allow direct messages from everyone"
                            description="If disabled, only connections can message you."
                            checked={privacySettings.allowMessages}
                            onChange={() => handleToggle('allowMessages')}
                        />
                        <ToggleOption
                            label="Allow team invitations"
                            description="Let others invite you to their teams."
                            checked={privacySettings.allowTeamInvites}
                            onChange={() => handleToggle('allowTeamInvites')}
                        />
                        <ToggleOption
                            label="Show my online status"
                            checked={privacySettings.showOnlineStatus}
                            onChange={() => handleToggle('showOnlineStatus')}
                        />
                        <ToggleOption
                            label="Show last active time"
                            checked={privacySettings.showLastActive}
                            onChange={() => handleToggle('showLastActive')}
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

PrivacySettings.propTypes = {
    user: PropTypes.object.isRequired,
    setUser: PropTypes.func.isRequired
};

export default PrivacySettings;
