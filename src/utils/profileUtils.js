export const calculateProfileScore = (user) => {
    if (!user) return { score: 0, completed: [], pending: [] };

    const checks = [
        { label: "Profile Picture", isComplete: !!user.profilePic },
        { label: "Banner Image", isComplete: !!user.bannerPic },
        { label: "Bio", isComplete: !!user.bio },
        { label: "Skills", isComplete: user.skills && user.skills.length > 0 },
        { label: "Projects", isComplete: user.projects && user.projects.length > 0 },
        { label: "Teams", isComplete: user.teams && user.teams.length > 0 },
        { label: "Social Links", isComplete: user.socials && Object.values(user.socials).some(link => !!link) }
    ];

    const completedItems = checks.filter(c => c.isComplete);
    const pendingItems = checks.filter(c => !c.isComplete);
    const calculatedScore = Math.round((completedItems.length / checks.length) * 100);

    return {
        score: calculatedScore,
        completed: completedItems.map(c => c.label),
        pending: pendingItems.map(c => c.label)
    };
};
