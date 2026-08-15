import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaGithub, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';
import api, { getAccessToken } from '../../api/axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const GithubImportModal = ({ isOpen, onClose, onImport }) => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRepos, setSelectedRepos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [importing, setImporting] = useState(false);
    const [token, setToken] = useState('');
    const { currentUser } = useAuth(); // We need auth context to get token

    useEffect(() => {
        if (currentUser) {
            const t = getAccessToken();
            setToken(t);
        }
    }, [currentUser]);

    useEffect(() => {
        if (isOpen) {
            fetchRepos();
        }
    }, [isOpen]);

    const fetchRepos = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/users/github/repos');
            setRepos(data);
        } catch (err) {
            console.error("Failed to fetch repos", err);
            setError("Failed to fetch repositories. Please make sure your GitHub account is connected.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRepo = (repo) => {
        if (selectedRepos.find(r => r.id === repo.id)) {
            setSelectedRepos(selectedRepos.filter(r => r.id !== repo.id));
        } else {
            setSelectedRepos([...selectedRepos, repo]);
        }
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            // Transform GitHub repos to Project format
            const projectsToImport = selectedRepos.map(repo => ({
                title: repo.name,
                desc: repo.description || 'No description provided.',
                image: '', // GitHub doesn't give a cover image easily, maybe use a default or allow user to edit later
                status: 'Completed', // Default
                role: 'Owner',
                tags: [repo.language].filter(Boolean), // Use primary language as tag
                github: repo.html_url,
                liveDemo: repo.homepage || ''
            }));

            // We need to append these to the user's existing projects.
            // Option 1: Call a specific "add projects" endpoint.
            // Option 2: Fetch current profile, append, and update.
            // Let's assume we pass the new projects back to the parent to handle the update/save 
            // OR we do it here. Parent handling is safer if we want to refresh the UI.
            await onImport(projectsToImport);
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to import projects.");
        } finally {
            setImporting(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <FaGithub className="text-2xl" />
                        <h2 className="text-xl font-bold text-gray-900">Import from GitHub</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search repositories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <p className="text-red-500 mb-4">{error}</p>
                            {!token ? (
                                <div className="text-gray-500">Preparing connection...</div>
                            ) : (
                                <a
                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github?token=${token}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition"
                                >
                                    <FaGithub /> Connect GitHub
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredRepos.length > 0 ? (
                                filteredRepos.map(repo => {
                                    const isSelected = selectedRepos.find(r => r.id === repo.id);
                                    return (
                                        <div
                                            key={repo.id}
                                            onClick={() => toggleRepo(repo)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${isSelected
                                                ? 'border-sky-500 bg-sky-50/50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300 bg-white'
                                                }`}>
                                                {isSelected && <FaCheck className="text-xs" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 truncate">{repo.name}</h3>
                                                    {repo.language && (
                                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {repo.language}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                                                    {repo.description || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>No public repositories found.</p>
                                    <p className="text-sm mt-2">Make sure your repositories are Public.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="text-sm text-gray-500 font-medium">
                        {selectedRepos.length} repositories selected
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedRepos.length === 0 || importing}
                            className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {importing ? 'Importing...' : 'Import Projects'}
                        </button>
                    </div>
                </div>
                {/* Private Repo Tip */}
                <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 text-center">
                    <span className="text-xs text-gray-500">
                        Don't see your private repos? {' '}
                        {token && (
                            <a
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github?token=${token}`}
                                className="text-sky-600 hover:underline font-medium cursor-pointer"
                            >
                                Grant Private Access
                            </a>
                        )}
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GithubImportModal;
