import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import { FaTrophy, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AutoTeamModal from './AutoTeamModal';
import USNPromptModal from './USNPromptModal';
import { useAuth } from '../../context/AuthContext';

const Cards = ({ eventData, onEdit, currentUserId }) => {
  const { user: currentUserProfile } = useAuth(); // Get full profile for matching
  const {
    _id,
    organizerName,
    organizerTitle,
    organizerAvatar,
    eventImageUrl,
    eventName,
    eventPrize,
    eventDescription,
    organizer,
    attendees = [],
    date, // Assuming date is passed
    location // Assuming location is passed
  } = eventData;

  const [isJoined, setIsJoined] = useState(() => {
    return attendees.some(att => (att._id || att) === currentUserId);
  });
  const [loading, setLoading] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [showAutoTeamModal, setShowAutoTeamModal] = useState(false);
  const [showUSNModal, setShowUSNModal] = useState(false);

  const handleAutoTeamClick = (e) => {
    e.stopPropagation();
    if (isJoined || isQueued) return;
    setShowAutoTeamModal(true);
  };

  const handleQueueSuccess = () => {
    setIsQueued(true);
  };

  const organizerId = organizer?._id || organizer;
  const isOrganizer = currentUserId && organizerId === currentUserId;

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (isJoined) return;

    setLoading(true);
    try {
      await api.put(`/events/${_id}/join`);
      setIsJoined(true);
      toast.success('Joined event successfully!');
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || '';
      // Backend signals USN required via 422
      if (status === 422 && msg.toLowerCase().includes('usn')) {
        setShowUSNModal(true);
      } else {
        console.error('Failed to join event', error);
        toast.error(error?.response?.data?.message || 'Failed to join event');
      }
    } finally {
      setLoading(false);
    }
  };

  // Called by USNPromptModal after successfully saving the USN to the user profile
  const handleUSNConfirm = async () => {
    setShowUSNModal(false);
    setLoading(true);
    try {
      await api.put(`/events/${_id}/join`);
      setIsJoined(true);
      toast.success('Joined event successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/events/${_id}`;
    const shareData = {
      title: eventName,
      text: eventDescription || `Check out this event: ${eventName}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          copyToClipboard(shareUrl);
        }
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Clipboard failed:', err);
      toast.error('Failed to copy link');
    }
  };

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : null;

  const navigate = useNavigate();

  return (
    <>
      {showAutoTeamModal && (
        <AutoTeamModal
          eventId={_id}
          user={currentUserProfile || {}}
          onClose={() => setShowAutoTeamModal(false)}
          onJoined={handleQueueSuccess}
        />
      )}
      {showUSNModal && (
        <USNPromptModal
          onConfirm={handleUSNConfirm}
          onClose={() => setShowUSNModal(false)}
        />
      )}
      <div
        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-[380px] sm:h-[420px] hover:-translate-y-1 cursor-pointer"
        onClick={() => navigate(`/events/${_id}`)}
      >
        {/* Image Section */}
        <div className="relative h-36 sm:h-48 overflow-hidden bg-gray-100">
          {eventImageUrl ? (
            <img
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              src={eventImageUrl.includes('cloudinary.com') ? eventImageUrl.replace('/upload/', '/upload/q_auto,f_auto/') : eventImageUrl}
              alt={eventName}
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-50">
              <FaCalendarAlt className="text-sky-200 text-4xl" />
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

          {/* Date Badge */}
          {formattedDate && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-gray-900 shadow-sm">
              {formattedDate}
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleShare}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:text-sky-600 shadow-sm transition-colors"
              title="Share Event"
            >
              <FiShare2 className="w-4 h-4" />
            </button>
            {isOrganizer && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(eventData); }}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:text-sky-600 shadow-sm transition-colors"
                title="Edit Event"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* Organizer */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
            <Avatar src={organizerAvatar} alt={organizerName} size="custom" className="w-5 h-5 sm:w-6 sm:h-6 ring-2 ring-white" />
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">{organizerName}</span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2 leading-tight group-hover:text-sky-600 transition-colors">
            {eventName}
          </h3>

          {/* Prize / Info */}
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
            {eventPrize && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md">
                <FaTrophy className="text-[10px] sm:text-xs" />
                <span className="text-[11px] sm:text-[13px]">{eventPrize}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-[13px] sm:text-sm text-gray-500 line-clamp-2 mb-3 sm:mb-4 overflow-hidden">
            {eventDescription}
          </p>

          {/* Footer Action */}
          <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-gray-50">
            <div className="flex -space-x-2">
              {attendees.slice(0, 3).map((att, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={att.profilePic || `https://ui-avatars.com/api/?name=${att.name || 'U'}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {attendees.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                  +{attendees.length - 3}
                </div>
              )}
            </div>

            {/* Auto-Team Button with Tooltip */}
            <div className="flex gap-2">
              {/* Auto-Team Button */}
              {!isJoined && (
                <div className="relative group/tooltip">
                  <button
                    onClick={handleAutoTeamClick}
                    disabled={loading || isQueued}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm rounded-xl font-bold transition-all shadow-sm border ${isQueued
                      ? "bg-sky-50 text-sky-700 border-sky-200 cursor-default"
                      : "bg-white text-gray-700 border-gray-200 hover:border-sky-200 hover:text-sky-600 hover:-translate-y-0.5"
                      }`}
                  >
                    {isQueued ? "Queued" : "Auto-Team"}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-20">
                    Join solo and get automatically grouped with others.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={loading || isJoined || isQueued}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-sm rounded-xl font-semibold transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 ${isJoined
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-gray-900 text-white hover:bg-black hover:shadow-md hover:-translate-y-0.5"
                  }`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isJoined ? (
                  <><span>Joined</span><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></>
                ) : (
                  "Join Event"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Cards.propTypes = {
  eventData: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    organizerName: PropTypes.string,
    organizerTitle: PropTypes.string,
    organizerAvatar: PropTypes.string,
    eventImageUrl: PropTypes.string,
    eventName: PropTypes.string,
    eventPrize: PropTypes.string,
    eventDescription: PropTypes.string,
    organizer: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    attendees: PropTypes.array,
    date: PropTypes.string,
    location: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

export default Cards;