import React, { useState, useRef, useEffect } from "react";
import { HiPhotograph, HiX } from "react-icons/hi";
import { Users, Calendar, ChevronDown, X as LucideX } from "lucide-react";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import AttachedTeamCard from "./AttachedTeamCard";
import AttachedEventCard from "./AttachedEventCard";

export default function CreatePost({ user, onPostCreated }) {
    const [text, setText] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openTeams, setOpenTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);

    const [openEvents, setOpenEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const dropdownRef = useRef(null);

    const displayUser = user || {};

    // Fetch the user's own open public active teams once on mount
    useEffect(() => {
        const fetchOpenTeams = async () => {
            try {
                const { data } = await api.get('/teams');
                const eligible = (data || []).filter(
                    t =>
                        t.isLookingForMembers &&
                        t.visibility === 'public' &&
                        t.teamStatus === 'active'
                );
                setOpenTeams(eligible);
            } catch (err) {
                // Silently fail — attaching a team is optional
                console.error("Could not load open teams", err);
            }
        };

        const fetchOpenEvents = async () => {
             if (!displayUser._id) return;
             try {
                 const { data } = await api.get(`/events?organizerId=${displayUser._id}`);
                 // Show all non-deleted events the user organizes (no approval requirement)
                 const eligible = (data.events || []).filter(e => !e.isDeleted);
                 setOpenEvents(eligible);
             } catch (err) {
                 console.error("Could not load open events", err);
             }
        };

        fetchOpenTeams();
        fetchOpenEvents();
    }, [displayUser._id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowTeamDropdown(false);
                setShowEventDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    async function submitPost() {
        if (!text.trim() && !imageFile) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', text);
            if (imageFile) {
                formData.append('image', imageFile);
            }
            if (selectedTeam) {
                formData.append('attachedTeamId', selectedTeam._id);
            }
            if (selectedEvent) {
                formData.append('attachedEventId', selectedEvent._id);
            }

            const { data } = await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const newPost = {
                ...data,
                user: user || { name: displayUser.name, profilePic: displayUser.profilePic, course: displayUser.course },
                attachedTeam: selectedTeam ? {
                    _id: selectedTeam._id,
                    name: selectedTeam.name,
                    category: selectedTeam.category,
                    isLookingForMembers: selectedTeam.isLookingForMembers,
                    openRoles: (selectedTeam.openRoles || []).filter(r => r.isOpen).slice(0, 5).map(r => ({ _id: r._id, title: r.title })),
                    membersCount: selectedTeam.members?.length || 0,
                } : null,
                hasAttachedTeam: !!selectedTeam,
                attachedEvent: selectedEvent ? {
                    _id: selectedEvent._id,
                    title: selectedEvent.title,
                    category: selectedEvent.category,
                    date: selectedEvent.date,
                    location: selectedEvent.location,
                    imageUrl: selectedEvent.imageUrl
                } : null,
                hasAttachedEvent: !!selectedEvent,
            };

            if (onPostCreated) {
                onPostCreated(newPost);
            }

            setText("");
            removeImage();
            setSelectedTeam(null);
            setSelectedEvent(null);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error("Failed to create post", err);
            alert("Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const openRoles = selectedTeam?.openRoles?.filter(r => r.isOpen) || [];    return (
        <div className="p-4 md:p-5">
            {/* Top row: Avatar + Textarea */}
            <div className="flex gap-3 md:gap-4">
                <div className="hidden sm:block pt-1">
                    <Avatar
                        src={displayUser.profilePic}
                        alt="me"
                        size="md"
                        className="ring-2 ring-white shadow-sm object-cover"
                    />
                </div>
                <div className="block sm:hidden pt-1">
                    <Avatar
                        src={displayUser.profilePic}
                        alt="me"
                        size="sm"
                        className="ring-2 ring-white shadow-sm object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder="What's happening?"
                            value={text}
                            onChange={handleTextChange}
                            className="w-full resize-none bg-transparent border-none p-0 py-2 text-base md:text-lg placeholder-gray-400 focus:ring-0 outline-none text-gray-900 min-h-[50px] md:min-h-[60px]"
                        />
                    </div>
                </div>
            </div>

            {/* Content Previews (Full Width) */}
            <div className="-mx-4 md:-mx-5 space-y-3">
                {/* Image Preview */}
                <div className="px-4 md:px-5">
                    {imagePreview && (
                        <div className="relative group inline-block mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-80 w-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                            </div>
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full backdrop-blur-sm transition-all shadow-sm"
                            >
                                <HiX size={14} className="stroke-2" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Selected Team Preview */}
                {selectedTeam && (
                    <div className="relative group">
                        <div className="opacity-95 group-hover:opacity-100 transition-opacity">
                            <AttachedTeamCard team={selectedTeam} />
                        </div>
                        <button
                            onClick={() => setSelectedTeam(null)}
                            className="absolute top-1.5 right-8 z-10 w-7 h-7 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                            title="Remove team"
                        >
                            <LucideX size={14} />
                        </button>
                    </div>
                )}

                {/* Selected Event Preview */}
                {selectedEvent && (
                    <div className="relative group">
                        <div className="opacity-95 group-hover:opacity-100 transition-opacity">
                            <AttachedEventCard event={selectedEvent} />
                        </div>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-1.5 right-8 z-10 w-7 h-7 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                            title="Remove event"
                        >
                            <LucideX size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-3 pt-3 flex items-center justify-between border-t border-gray-50">
                <div className="flex items-center gap-0.5 md:gap-2 -ml-2" ref={dropdownRef}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors relative group"
                        title="Add Photo"
                    >
                        <HiPhotograph size={20} className="md:w-6 md:h-6" />
                    </button>

                    {/* Attach Team Button */}
                    {openTeams.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowTeamDropdown(prev => !prev);
                                    setShowEventDropdown(false);
                                }}
                                title="Attach Open Team"
                                className={`p-2 rounded-full transition-colors flex items-center gap-1 text-sm font-medium ${selectedTeam
                                    ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                            >
                                <Users size={18} className="md:w-5 md:h-5" />
                                <ChevronDown size={12} className={`hidden sm:block transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showTeamDropdown && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Your Open Teams</p>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {openTeams.map(team => (
                                            <button
                                                key={team._id}
                                                onClick={() => { setSelectedTeam(team); setShowTeamDropdown(false); }}
                                                className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors group/item"
                                            >
                                                <p className="text-sm font-bold text-gray-700 group-hover/item:text-sky-600 truncate">{team.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate">
                                                    {team.openRoles?.filter(r => r.isOpen).map(r => r.title).join(', ') || 'View details'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTeam && (
                                        <button
                                            onClick={() => { setSelectedTeam(null); setShowTeamDropdown(false); }}
                                            className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1"
                                        >
                                            Remove attachment
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attach Event Button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowEventDropdown(prev => !prev);
                                setShowTeamDropdown(false);
                            }}
                            title="Attach My Event"
                            className={`p-2 rounded-full transition-colors flex items-center gap-1 text-sm font-medium ${selectedEvent
                                ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                        >
                            <Calendar size={18} className="md:w-5 md:h-5" />
                            <ChevronDown size={12} className={`hidden sm:block transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showEventDropdown && (
                            <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Your Events</p>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {openEvents.map(event => (
                                        <button
                                            key={event._id}
                                            onClick={() => { setSelectedEvent(event); setShowEventDropdown(false); }}
                                            className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors group/item"
                                        >
                                            <p className="text-sm font-bold text-gray-700 group-hover/item:text-sky-600 truncate">{event.title}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {event.category} • {event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                {selectedEvent && (
                                    <button
                                        onClick={() => { setSelectedEvent(null); setShowEventDropdown(false); }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1"
                                    >
                                        Remove attachment
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={submitPost}
                    disabled={(!text.trim() && !imageFile) || isSubmitting}
                    className="bg-[#3B82F6] text-white px-5 py-1.5 md:px-6 md:py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:cursor-not-allowed shadow-sm hover:shadow-md transform active:scale-95"
                >
                    {isSubmitting ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
}
