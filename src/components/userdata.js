// src/data/userData.js

const userData = {
  name: "Alex Rivera",
  username: "@alexrivera",
  course: "AIML",
  year: "1st Year",
  profession: "AI/ML Student & Developer",
  bio: "Passionate about AI/ML and building impactful products.",
  profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
  coverImage: "https://png.pngtree.com/background/20210709/original/pngtree-full-aesthetic-nebula-starry-sky-banner-background-picture-image_916071.jpg",
  location: "Bangalore, India",
  portfolio: "alexrivera.dev",
  stats: {
    followers: 234,
    following: 156,
    teams: 5,
    projects: 12,
    posts: 24
  },
  about:
    "I'm a first-year AIML student who loves building intelligent systems and clean UI. I enjoy collaborating on innovative projects and participating in hackathons. My goal is to create AI solutions that make a real-world impact.",

  education: [
    {
      id: 1,
      institution: "XYZ University",
      degree: "B.Tech in AI & ML",
      year: "2024 - 2028",
      location: "Bangalore, India"
    }
  ],

  experience: [
    {
      id: 1,
      company: "Tech Startup",
      role: "Frontend Intern",
      duration: "Jun 2024 - Aug 2024",
      description: "Built responsive web interfaces using React and Tailwind CSS"
    }
  ],

  interests: ["Artificial Intelligence", "Web Development", "Hackathons", "UI/UX Design", "Gaming", "Open Source"],

  tools: ["React", "Figma", "Python", "TensorFlow", "Tailwind", "Git", "VS Code"],

  skills: [
    { name: "Frontend Development", level: 75 },
    { name: "UI/UX Design", level: 60 },
    { name: "Machine Learning", level: 45 },
    { name: "Python", level: 70 },
    { name: "React", level: 80 },
  ],

  teams: [
    {
      id: 1,
      name: "AI Innovators",
      role: "Frontend Lead",
      avatar: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop",
      members: 8,
      tag: "Hackathon Team",
      description: "Building AI-powered solutions for real-world problems"
    },
    {
      id: 2,
      name: "Design Squad",
      role: "Member",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
      members: 12,
      tag: "Project Team",
      description: "Creating beautiful and functional user interfaces"
    },
  ],

  projects: [
    {
      id: 1,
      title: "AI Study Buddy",
      desc: "ML-powered study assistant that helps students learn more efficiently",
      tags: ["ML", "React", "Python", "TensorFlow"],
      status: "In Progress",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      role: "Full Stack Developer",
      teamMembers: [
        { name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" },
        { name: "Sarah Chen", avatar: "https://picsum.photos/seed/sarah/100/100" },
        { name: "Mike Johnson", avatar: "https://picsum.photos/seed/mike/100/100" }
      ],
      github: "https://github.com/alexrivera/ai-study-buddy",
      liveDemo: null
    },
    {
      id: 2,
      title: "Portfolio Site",
      desc: "Personal portfolio with dark mode and smooth animations",
      tags: ["React", "Tailwind", "Framer Motion"],
      status: "Completed",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
      role: "Solo Developer",
      teamMembers: [
        { name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" }
      ],
      github: "https://github.com/alexrivera/portfolio",
      liveDemo: "https://alexrivera.dev"
    },
    {
      id: 3,
      title: "Team Collaboration App",
      desc: "Real-time collaboration platform for remote teams",
      tags: ["React", "Node.js", "Socket.io", "MongoDB"],
      status: "Completed",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
      role: "Frontend Lead",
      teamMembers: [
        { name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" },
        { name: "John Doe", avatar: "https://picsum.photos/seed/john/100/100" },
        { name: "Jane Smith", avatar: "https://picsum.photos/seed/jane/100/100" },
        { name: "Tom Brown", avatar: "https://picsum.photos/seed/tom/100/100" }
      ],
      github: "https://github.com/team/collab-app",
      liveDemo: "https://teamcollab.app"
    }
  ],

  posts: [
    {
      id: 1,
      type: "update",
      text: "Just completed my first ML model! 🎉",
      time: "2h ago",
      image: null
    },
    {
      id: 2,
      type: "project",
      text: "Launched AI Study Buddy beta version",
      time: "1d ago",
      image: null
    },
    {
      id: 3,
      type: "team",
      text: "Joined AI Innovators team as Frontend Lead!",
      time: "3d ago",
      image: null
    },
    {
      id: 4,
      type: "achievement",
      text: "Won Best UI/UX Award at TechHack 2024! 🏆",
      time: "1w ago",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop"
    },
  ],

  achievements: [
    { id: 1, title: "First Hackathon", icon: "🏆", date: "Nov 2024", color: "from-yellow-50 to-white" },
    { id: 2, title: "React Certificate", icon: "⚛️", date: "Oct 2024", color: "from-sky-50 to-white" },
    { id: 3, title: "Completed 3 Projects", icon: "🚀", date: "Nov 2024", color: "from-green-50 to-white" },
    { id: 4, title: "Joined 5 Teams", icon: "👥", date: "Oct 2024", color: "from-sky-50 to-white" },
    { id: 5, title: "100 Followers", icon: "🎯", date: "Sep 2024", color: "from-pink-50 to-white" },
    { id: 6, title: "Best UI/UX Award", icon: "🎨", date: "Nov 2024", color: "from-orange-50 to-white" },
  ],

  events: [
    {
      id: 1,
      name: "TechHack 2024",
      type: "Hackathon",
      date: "Nov 15-17, 2024",
      status: "Participated",
      achievement: "Best UI/UX Award",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"
    },
    {
      id: 2,
      name: "AI Summit 2024",
      type: "Conference",
      date: "Dec 10, 2024",
      status: "Upcoming",
      achievement: null,
      image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop"
    },
    {
      id: 3,
      name: "React Workshop",
      type: "Workshop",
      date: "Oct 20, 2024",
      status: "Completed",
      achievement: "Certificate",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
    }
  ],

  social: {
    github: "alexrivera",
    linkedin: "alex-rivera",
    instagram: "alex.codes",
    twitter: "alexcodes",
    portfolio: "alexrivera.dev"
  },

  profileScore: {
    percentage: 85,
    completed: [
      "Profile picture added",
      "Cover image added",
      "Bio completed",
      "Skills added",
      "Projects uploaded",
      "Social links added"
    ],
    pending: [
      "Add more projects",
      "Join more teams",
      "Complete profile description"
    ]
  },

  invites: [
    {
      name: "David Kim",
      skill: "Backend Developer",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    },
    {
      name: "Emma Wilson",
      skill: "UI Designer",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    }
  ],

  availability: "Open to join teams", // Options: "Not looking for teams", "Open to join teams", "Actively searching"

  suggestedConnections: [
    {
      id: 1,
      name: "Sarah Chen",
      username: "sarahchen",
      role: "AI Researcher",
      avatar: "https://picsum.photos/seed/sarah/100/100",
      mutual: 12
    },
    {
      id: 2,
      name: "Mike Johnson",
      username: "mikejohnson",
      role: "Full Stack Dev",
      avatar: "https://picsum.photos/seed/mike/100/100",
      mutual: 8
    },
    {
      id: 3,
      name: "Emily Davis",
      username: "emilydavis",
      role: "Product Designer",
      avatar: "https://picsum.photos/seed/emily/100/100",
      mutual: 5
    }
  ]
};

export default userData;
