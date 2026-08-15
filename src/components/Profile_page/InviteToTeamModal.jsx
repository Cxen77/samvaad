import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes, FaUsers, FaCheck } from 'react-icons/fa';
import api from '../../api/axios';

const InviteToTeamModal = ({ isOpen, onClose, userToInvite }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(null); // Team ID being invited to
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchMyTeams();
        }
    }, [isOpen]);

    const fetchMyTeams = async () => {
        setLoading(true);
        try {
            // Get current user to check admin status
            const meRes = await api.get('/users/profile');
            setCurrentUser(meRes.data);

            const { data } = await api.get('/teams');
            // Filter teams where I am an admin
            const adminTeams = data.filter(team =>
                team.admins.some(admin =>
                    (typeof admin === 'string' ? admin : admin._id) === meRes.data._id
                )
            );
            setTeams(adminTeams);
        } catch (err) {
            console.error("Failed to fetch teams", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (teamId) => {
        setInviting(teamId);
        try {
            await api.put(`/teams/${teamId}/invite`, { userId: userToInvite._id });
            // Show success state briefly
            setTimeout(() => {
                setInviting(null);
                // Optional: Close modal or show persistent success
            }, 1000);
            alert(`Invited ${userToInvite.name} successfully!`);
        } catch (err) {
            console.error("Failed to invite user", err);
            alert(err.response?.data?.message || "Failed to invite user");
            setInviting(null);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-xl overflow-hidden pointer-events-auto relative animate-slide-up sm:animate-in sm:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                {/* Drag Handle for Mobile */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
                </div>

                <div className="flex justify-between items-center px-6 pt-2 pb-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Invite to Team</h3>
                        <p className="text-sm text-gray-500">
                            Invite <span className="font-bold text-gray-900">{userToInvite?.name}</span> to collaborate
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading your teams...</span>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                <FaUsers className="text-xl" />
                            </div>
                            <p className="font-medium text-gray-900">No teams available</p>
                            <p className="text-sm mt-1 mb-4">You need to lead a team to invite members.</p>
                            <button onClick={onClose} className="text-sky-600 font-bold hover:underline">
                                Go create one!
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teams.map(team => {
                                // Check if userToInvite is already in the team
                                const isMember = team.members?.some(m =>
                                    String(m._id || m) === String(userToInvite?._id)
                                );
                                // Check if there's already a pending invite
                                const pendingInvite = team.invites?.some(i =>
                                    String(i.userId?._id || i.userId) === String(userToInvite?._id) && i.status === 'pending'
                                );
                                // Check if the user has requested to join
                                const pendingRequest = team.joinRequests?.some(r =>
                                    String(r.userId?._id || r.userId) === String(userToInvite?._id) && r.status === 'pending'
                                );

                                const isAlreadyLinked = isMember || pendingInvite || pendingRequest;
                                let buttonText = "Invite";
                                if (isMember) buttonText = "Member";
                                else if (pendingInvite) buttonText = "Invited";
                                else if (pendingRequest) buttonText = "Requested";
                                else if (inviting === team._id) buttonText = "Sent";

                                return (
                                    <div key={team._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-sky-300 hover:shadow-md transition group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                                <FaUsers />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{team.name}</h4>
                                                <p className="text-xs text-gray-500 font-medium">{team.members.length} members</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleInvite(team._id)}
                                            disabled={inviting === team._id || isAlreadyLinked}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${isAlreadyLinked || inviting === team._id
                                                    ? "bg-gray-100 text-gray-500 cursor-default shadow-none"
                                                    : "bg-sky-600 text-white hover:bg-sky-700 hover:shadow-md active:scale-95"
                                                }`}
                                        >
                                            {inviting === team._id ? (
                                                <span className="flex items-center gap-2"><FaCheck /> Sent</span>
                                            ) : isAlreadyLinked ? (
                                                <span className="flex items-center gap-2 text-xs uppercase tracking-wide">{buttonText}</span>
                                            ) : (
                                                buttonText
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

InviteToTeamModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userToInvite: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string
    })
};

export default InviteToTeamModal;
