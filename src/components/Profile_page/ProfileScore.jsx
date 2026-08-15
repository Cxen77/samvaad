import React, { useMemo } from 'react';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';
import { calculateProfileScore } from '../../utils/profileUtils';

const ProfileScore = ({ user }) => {
    const { score, completed, pending } = useMemo(() => calculateProfileScore(user), [user]);

    if (score === 100) return null;

    const getProgressColor = (percent) => {
        if (percent < 40) return 'bg-red-500';
        if (percent < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const progressColor = getProgressColor(score);
    const textColor = progressColor.replace('bg-', 'text-');

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                    Profile Strength
                </h3>
                <span className={`text-lg font-bold ${textColor}`}>{score}%</span>
            </div>

            <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-6 relative pt-1">
                    <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                            style={{ width: `${score}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor} transition-all duration-1000 ease-out`}
                        ></div>
                    </div>
                </div>

                {/* Pending Items (Priority) */}
                {pending.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <FaCircle className="text-orange-500 w-3 h-3" />
                            Action Items
                        </h4>
                        <div className="flex flex-col gap-3 min-h-[104px] max-h-[104px] overflow-y-auto custom-scrollbar pr-1">
                            {pending.map((item, index) => (
                                <div key={index} className="flex-1 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 group hover:border-sky-200 dark:hover:border-sky-700 transition-colors">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                    <button className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Call to Action */}
                <div className="mt-2 p-2.5 bg-gradient-to-r from-sky-50 to-sky-50 dark:from-sky-900/20 dark:to-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/30 flex items-center justify-center">
                    <p className="text-xs text-sky-900 dark:text-sky-200 font-medium leading-relaxed text-center">
                        Complete your profile to increase visibility by <span className="font-bold text-sky-700 dark:text-sky-400">3x</span>!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfileScore;
