import React, { useState } from 'react';
import { FaGraduationCap, FaBriefcase, FaLightbulb } from 'react-icons/fa';
import VerificationModal from './VerificationModal';

const AboutSection = ({ user, isOwner, onProfileUpdate, className = "" }) => {
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    if (!user) return null;

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                    About
                </h3>
            </div>

            <div className="p-6 space-y-6">
                {/* Bio */}
                <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700 leading-relaxed">{user.bio || "No bio added yet."}</p>
                </div>

                {/* Education */}
                <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Education</h4>
                    {user.college || user.course ? (
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                                    <FaGraduationCap className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                {user.college && (
                                    <div className="flex items-center gap-3 mb-1">
                                        <h5 className="font-bold text-gray-900 text-[17px] leading-tight">{user.college}</h5>
                                        {isOwner && user.collegeVerified !== 'true' && (
                                            user.collegeVerified === 'pending' ? (
                                                <span className="text-sm font-medium text-amber-600 flex items-center gap-1.5 cursor-wait ml-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse block"></span>
                                                    Verification Pending
                                                </span>
                                            ) : user.collegeVerified === 'rejected' ? (
                                                <button
                                                    onClick={() => setShowVerifyModal(true)}
                                                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-all ml-2"
                                                    title="Your previous request was rejected. You can reapply."
                                                >
                                                    Reapply Verification
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowVerifyModal(true)}
                                                    className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline transition-all ml-2"
                                                >
                                                    Verify Student Status
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                                {user.course && <span className="text-gray-700 font-medium mb-0.5">{user.course}</span>}
                                {(user.year || user.section) && (
                                    <span className="text-gray-500 text-sm flex items-center gap-2 mt-0.5">
                                        {user.year ? `${user.year} Semester` : ''}
                                        {user.year && user.section && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
                                        {user.section ? `Section ${user.section}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No education details added.</p>
                    )}
                </div>

                {/* Skills */}
                <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Skills</h4>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        {user.skills && user.skills.length > 0 ? (
                            <>
                                {user.skills.slice(0, 50).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="whitespace-nowrap flex-shrink-0 px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {user.skills.length > 50 && (
                                    <span className="whitespace-nowrap flex-shrink-0 px-4 py-2 bg-sky-50 border border-sky-100 text-sky-600 rounded-full text-sm font-medium">
                                        + {user.skills.length - 50} more
                                    </span>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm">No skills added yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Verification Modal */}
            {showVerifyModal && (
                <VerificationModal
                    user={user}
                    onClose={() => setShowVerifyModal(false)}
                    onVerified={(updatedUser) => {
                        if (onProfileUpdate) onProfileUpdate(updatedUser);
                        setShowVerifyModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default AboutSection;
