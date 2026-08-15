import React, { useState, useEffect, Suspense } from "react";
import ProfileCard from "./ProfileCard";
import Feed from "./Feed";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import useStickySidebar from "../../hooks/useStickySidebar";

const Recommendations = React.lazy(() => import("./Recommendations"));

export default function Home() {
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { sidebarRef, style: stickyStyle } = useStickySidebar(96, 24); // 96px top, 24px bottom padding

  useEffect(() => {
    const fetchHomeData = async () => {
      if (!currentUser) return; // Wait for Firebase user

      try {
        const isMobile = window.innerWidth < 1024;
        const url = isMobile ? '/home?device=mobile' : '/home';
        const { data } = await api.get(url);

        if (data.profile) setUser(data.profile);
        setHomeData(data);

        // Seed React Query cache for the Feed so usePosts doesn't fetch again initially
        if (data.feed) {
          queryClient.setQueryData(['posts', 'For You'], {
            pages: [data.feed],
            pageParams: [1]
          });
        }
      } catch (err) {
        console.error("Failed to fetch home data", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchHomeData();
    }
  }, [currentUser, queryClient]);

  // Use backend user if available, otherwise fallback to Firebase currentUser
  const displayUser = user || (currentUser ? {
    name: currentUser.displayName,
    email: currentUser.email,
    profilePic: currentUser.photoURL,
    username: currentUser.email?.split('@')[0],
    profession: "Member"
  } : null);

  const isMobile = window.innerWidth < 1024;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* top padding if you have a fixed navbar */}
      <div className="px-6 pt-[8px]">
        <div className="max-w-[1300px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
            {/* Left Sidebar */}
            <div className="hidden lg:block sticky top-24 h-fit">
              <ProfileCard user={displayUser} loading={loading} />
            </div>

            {/* Middle Feed */}
            <div>
              <Feed user={displayUser} />
            </div>

            {/* Right Sidebar */}
            <div
              ref={sidebarRef}
              className="hidden lg:block h-fit"
              style={stickyStyle}
            >
              {!isMobile && (
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                    <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                  </div>
                }>
                  <Recommendations initialData={homeData} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
