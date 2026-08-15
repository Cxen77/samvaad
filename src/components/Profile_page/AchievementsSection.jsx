import React from 'react';
import userData from '../userdata';
import { Trophy, Award, Rocket, Users, Target, Palette, Medal, Star, Crown, Zap } from 'lucide-react';

const AchievementsSection = ({ user }) => {
    const achievements = user?.achievements || [];

    const getAchievementIcon = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('hackathon')) return <Trophy className="w-6 h-6" />;
        if (lowerTitle.includes('certificate')) return <Award className="w-6 h-6" />;
        if (lowerTitle.includes('project')) return <Rocket className="w-6 h-6" />;
        if (lowerTitle.includes('team')) return <Users className="w-6 h-6" />;
        if (lowerTitle.includes('follower')) return <Target className="w-6 h-6" />;
        if (lowerTitle.includes('ui/ux') || lowerTitle.includes('design')) return <Palette className="w-6 h-6" />;
        if (lowerTitle.includes('winner') || lowerTitle.includes('won')) return <Crown className="w-6 h-6" />;
        return <Star className="w-6 h-6" />;
    };

    const getGradient = (index) => {
        const gradients = [
            'from-yellow-500/20 to-orange-500/20 text-yellow-600',
            'from-sky-500/20 to-cyan-500/20 text-sky-600',
            'from-green-500/20 to-emerald-500/20 text-green-600',
            'from-sky-500/20 to-pink-500/20 text-sky-600',
            'from-rose-500/20 to-red-500/20 text-rose-600',
            'from-sky-500/20 to-violet-500/20 text-sky-600',
        ];
        return gradients[index % gradients.length];
    };

    if (achievements.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                        Achievements
                    </h3>
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-bold border border-gray-200">
                        {achievements.length}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
                    {achievements.map((achievement, index) => (
                        <div
                            key={achievement.id || index}
                            className="flex-shrink-0 w-64 flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group border border-transparent hover:border-gray-100 bg-white shadow-sm border-gray-100"
                        >
                            {/* Icon Box */}
                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${getGradient(index)} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                {getAchievementIcon(achievement.title)}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-sky-600 transition-colors">
                                    {achievement.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {achievement.date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AchievementsSection;
