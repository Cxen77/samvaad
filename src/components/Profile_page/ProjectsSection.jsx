import React from 'react';
import { Github, ExternalLink, FolderGit } from 'lucide-react';

const ProjectsSection = ({ user, onImportClick, className = "" }) => {
    const projects = user?.projects || [];

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                        Projects
                    </h3>
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-bold border border-gray-200">
                        {projects.length}
                    </span>
                </div>
                {/* GitHub Import Button */}
                {onImportClick && (
                    <button
                        onClick={onImportClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition border border-gray-200"
                    >
                        <Github className="w-4 h-4" />
                        <span className="hidden sm:inline">Import from GitHub</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                {projects.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 m-auto flex-1 flex flex-col items-center justify-center h-full">
                        <FolderGit className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">No projects added yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-sky-200 transition-all duration-200 flex flex-col group"
                            >
                                {/* Top Header Map */}
                                <div className="flex items-start justify-between mb-3 gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FolderGit className="w-4 h-4 text-gray-400 group-hover:text-sky-500 transition-colors shrink-0" />
                                        <h4 className="text-base font-bold text-gray-900 group-hover:text-sky-600 transition-colors truncate" title={project.title}>
                                            {project.title}
                                        </h4>
                                    </div>
                                    <span
                                        className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project.status === 'Completed'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                    >
                                        {project.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{project.desc}</p>

                                {/* Tech Stack Tags */}
                                {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {project.tags.slice(0, 4).map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[11px] font-medium border border-gray-100"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {project.tags.length > 4 && (
                                            <span className="text-[11px] text-gray-400 font-medium self-center ml-1">
                                                +{project.tags.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Footer: Role & Links */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded text-[10px] font-bold border border-sky-100 uppercase tracking-wide">
                                        {project.role || 'Contributor'}
                                    </span>

                                    <div className="flex gap-3">
                                        {project.github && (
                                            <a
                                                href={project.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-gray-900 transition"
                                                title="View Source"
                                            >
                                                <Github className="w-[18px] h-[18px]" />
                                            </a>
                                        )}
                                        {project.liveDemo && (
                                            <a
                                                href={project.liveDemo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-sky-600 transition"
                                                title="Live Demo"
                                            >
                                                <ExternalLink className="w-[18px] h-[18px]" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsSection;
