import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useSamvaad } from './context/SamvaadContext';
import DirectCallOverlay from './components/Call/DirectCallOverlay';

// Lazy Load Components
const Chat = lazy(() => import('./components/Chat_page/Chat.jsx'));
const Profile = lazy(() => import('./components/Profile_page/Profile.jsx'));
const Login = lazy(() => import('./components/Login.jsx'));
const Signup = lazy(() => import('./components/Signup.jsx'));
const Settings = lazy(() => import('./components/Settings_page/Settings.jsx'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./components/ResetPassword.jsx'));
const Unauthorized = lazy(() => import('./components/Unauthorized.jsx'));

// Samvaad Components
const SamvaadLayout = lazy(() => import('./components/Samvaad_page/SamvaadLayout.jsx'));
const SamvaadHome = lazy(() => import('./components/Samvaad_page/SamvaadHome.jsx'));
const SmartWaitingRoom = lazy(() => import('./components/Samvaad_page/SmartWaitingRoom.jsx'));
const SplitScreenRoom = lazy(() => import('./components/Samvaad_page/SplitScreenRoom.jsx'));
const CalendarPage = lazy(() => import('./components/Samvaad_page/CalendarPage.jsx'));
const SchedulerPage = lazy(() => import('./components/Samvaad_page/SchedulerPage.jsx'));
const NotesPage = lazy(() => import('./components/Samvaad_page/NotesPage.jsx'));
const HubPage = lazy(() => import('./components/Samvaad_page/HubPage.jsx'));
const MoreMenu = lazy(() => import('./components/Samvaad_page/MoreMenu.jsx'));

import Skeleton from './components/common/Skeleton';
import ProfileSkeleton from './components/Profile_page/ProfileSkeleton';
import InAppNotification from './components/common/InAppNotification';
import FeatureGate from './components/common/FeatureGate';

// Loading Fallback with Skeleton Layout
const PageLoader = () => (
  <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
    <div className="h-16 bg-white border-b border-gray-200 w-full fixed top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="rectangular" className="h-8 w-8 rounded-full" />
        <Skeleton variant="rectangular" className="h-10 w-64 rounded-xl hidden md:block" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-10 w-10" />
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
    </div>
    <main className="pt-24 pb-16 md:pb-0 px-4 max-w-7xl mx-auto w-full flex gap-6 justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton variant="rectangular" className="h-40 w-full rounded-2xl" />
        <Skeleton variant="rectangular" className="h-64 w-full rounded-2xl" />
        <Skeleton variant="rectangular" className="h-64 w-full rounded-2xl" />
      </div>
    </main>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!currentUser.isEmailVerified) return <Navigate to="/verify-email" replace />;
  return children;
};

import { useSocket } from './context/SocketContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { hasShownNotification, markNotificationShown } from './utils/notificationManager';
import usePushNotification from './hooks/usePushNotification';
import useNotifications from './hooks/useNotifications';

function App() {
  // Push Notifications (FCM)
  usePushNotification();
  useNotifications();

  const { socket } = useSocket();
  const { currentUser } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const currentPath = window.location.pathname;
      const msgChatId = newMessage.chatId._id || newMessage.chatId;
      const messageId = newMessage._id;
      const isChatActive = currentPath.startsWith(`/chat/${msgChatId}`);

      if (!isChatActive) {
        if (newMessage.senderId._id === currentUser._id || newMessage.senderId === currentUser._id) return;
        if (hasShownNotification(messageId)) return;
        markNotificationShown(messageId);

        setActiveNotification({
          id: messageId,
          senderName: newMessage.senderId.name,
          message: newMessage.text,
          profilePic: newMessage.senderId.profilePic,
          chatId: msgChatId
        });

        setTimeout(() => setActiveNotification(null), 4500);
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => { socket.off('message:new', handleNewMessage); };
  }, [socket, currentUser]);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} containerStyle={{ zIndex: 99999 }} />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Layout Routes */}
          <Route element={<ProtectedRoute><SamvaadLayout /></ProtectedRoute>}>
            <Route path="/" element={<SamvaadHome />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/hub" element={<HubPage />} />
            <Route path="/more" element={<MoreMenu />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/profile" element={<Suspense fallback={<ProfileSkeleton />}><Profile /></Suspense>} />
            <Route path="/profile/:username" element={<Suspense fallback={<ProfileSkeleton />}><Profile /></Suspense>} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Dedicated Fullscreen Meeting & Pre-Join Rooms (Zoom / Teams Style) */}
          <Route path="/samvaad/waiting-room/:roomId" element={<ProtectedRoute><SmartWaitingRoom /></ProtectedRoute>} />
          <Route path="/samvaad/room/:roomId" element={<ProtectedRoute><SplitScreenRoom /></ProtectedRoute>} />
        </Routes>
      </Suspense>

      {/* Direct Voice & Video Call Overlay */}
      <DirectCallOverlay />

      {/* In-app notification */}
      {activeNotification && (
        <InAppNotification
          notification={activeNotification}
          onDismiss={() => setActiveNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
