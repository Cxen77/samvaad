import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Users, CalendarDays, PlusCircle, ClipboardList, Search, QrCode, X } from "lucide-react";
import { FaGraduationCap } from "react-icons/fa";
import Avatar from "../common/Avatar";
import VerifiedBadge from "../common/VerifiedBadge";
import EventQRModal from "../Event_page/EventQRModal";
import api from "../../api/axios";

// ── helpers ─────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-24 bg-gray-200" />
        <div className="px-5 pb-5 -mt-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
          <div className="mt-3 h-5 w-32 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-24 bg-gray-200 rounded" />
          <div className="mt-4 w-full h-2 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-gray-200 rounded-lg" />)}
      </div>
    </div>
  );
}

// Compute a simple profile-completion percentage
function profileCompletion(user) {
  const fields = [
    user.name, user.bio, user.college, user.course,
    user.year, user.section, user.skills?.length, user.profilePic,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ── QR Event Picker (shown before QR modal) ─────────────────────
function QREventPicker({ onSelect, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events', { params: { limit: 50, joined: true } })
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 dark:bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
            <QrCode size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Select an event</p>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Show Event QR Code</h3>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">You haven’t joined any events yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {events.map(ev => (
              <li key={ev._id}>
                <button
                  onClick={() => onSelect(ev)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition group"
                >
                  <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-sky-600 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Main Component ───────────────────────────────
export default function ProfileCard({ user, loading }) {
  const navigate = useNavigate();
  const [qrState, setQrState] = useState(null); // null | 'picker' | { eventId, eventTitle }

  if (loading) return <SkeletonCard />;

  if (!user) {
    return (
      <aside className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
          <Users className="text-gray-400 w-7 h-7" />
        </div>
        <h3 className="font-bold text-gray-900">Welcome!</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">Sign in to see your profile</p>
        <Link to="/login" className="block w-full bg-sky-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-sky-700 transition text-center">
          Sign In
        </Link>
      </aside>
    );
  }

  const banner = user.bannerPic || user.coverImage;
  const subtitle = user.course ? `${user.course} Student` : "Student";
  const completion = profileCompletion(user);

  const quickActions = [
    { icon: <Search size={18} />, label: "Find Teammates", to: "/teams" },
    { icon: <PlusCircle size={18} />, label: "Create Event", to: "/events" },
    { icon: <ClipboardList size={18} />, label: "My Registrations", to: "/events?filter=registrations" },
    {
      icon: <QrCode size={18} />,
      label: "Show Event QR",
      onClick: () => setQrState('picker')
    }
  ];

  return (
    <div className="space-y-4">
      {/* ── Identity + Academic Card ── */}
      <aside className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gray-900 relative">
          {banner ? (
            <>
              <img src={banner} alt="cover" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
            </>
          ) : (
            <>
              {/* Static Theme Background instead of animated blobs */}
              <div className="absolute inset-0 bg-sky-600" />
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-sky-400 opacity-90" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            </>
          )}
          {/* Avatar anchored to bottom of banner */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <Link to="/profile">
              <Avatar
                src={user.profilePic}
                alt={user.name}
                size="custom"
                className="w-20 h-20 border-4 border-white shadow-md bg-white hover:opacity-90 transition object-cover"
              />
            </Link>
          </div>
        </div>

        <div className="px-5 pb-5 pt-12">
          {/* Name + subtitle */}
          <div className="flex flex-col items-center mb-3">
            <Link to="/profile" className="flex items-center justify-center gap-1.5 text-base font-bold text-gray-900 hover:text-sky-600 transition">
              <span>{user.name}</span>
              <VerifiedBadge verified={user.collegeVerified} />
            </Link>
            <p className="text-sm text-sky-600 font-semibold">{subtitle}</p>
            {user.college && (
              <p className="text-xs text-gray-500 text-center mt-0.5 truncate max-w-full px-2">{user.college}</p>
            )}
          </div>

          {/* Profile completion */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
              <span>Profile Completion</span>
              <span className="text-sky-600 font-bold">{completion}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Academic Info</p>
            <div className="space-y-2.5">
              {(user.course || user.college) && (
                <div className="flex items-center gap-2.5 text-sm">
                  <FaGraduationCap className="text-sky-500 flex-shrink-0 w-4 h-4" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user.course || user.college}</p>
                    {user.course && user.college && (
                      <p className="text-xs text-gray-500 truncate">{user.college}</p>
                    )}
                  </div>
                </div>
              )}
              {(user.year || user.section) && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <ClipboardList className="text-sky-400 flex-shrink-0 w-4 h-4" />
                  <span>
                    {[user.year && `${user.year} Semester`, user.section && `Section ${user.section}`]
                      .filter(Boolean).join(" · ")}
                  </span>
                </div>
              )}
              {!user.course && !user.year && !user.section && (
                <p className="text-xs text-gray-400 italic">No academic info added yet.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Quick Actions Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</p>
        </div>
        <ul className="px-3 pb-3 mt-1 space-y-0.5">
          {quickActions.map(({ icon, label, to, onClick }) => (
            <li key={label}>
              {onClick ? (
                <button
                  onClick={onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all group"
                >
                  <span className="text-gray-400 group-hover:text-sky-500 transition">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ) : (
                <Link
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-sky-600 hover:bg-sky-50 transition-all group"
                >
                  <span className="text-gray-400 group-hover:text-sky-500 transition">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── QR Event Picker Sheet ── */}
      {qrState === 'picker' && (
        <QREventPicker
          userId={user?._id}
          onSelect={(ev) => setQrState({ eventId: ev._id, eventTitle: ev.title })}
          onClose={() => setQrState(null)}
        />
      )}

      {/* ── QR Modal ── */}
      {qrState && qrState !== 'picker' && (
        <EventQRModal
          eventId={qrState.eventId}
          eventTitle={qrState.eventTitle}
          onClose={() => setQrState(null)}
        />
      )}
    </div>
  );
}