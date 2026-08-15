import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaFilter, FaCalendarCheck, FaSearch } from "react-icons/fa";
import Cards from "./cards";
import Slider from "./Slider";
import CreateEventModal from "./CreateEventModal";
import MobileFilterModal from "./MobileFilterModal";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useEvents } from "../../hooks/useEvents";

function Events() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const isRegistrationsView = filterParam === 'registrations';

  const { events, loading, refetch, error } = useEvents(
    isRegistrationsView ? { joined: true } : {}
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [eventToEdit, setEventToEdit] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };


  const handleEventCreated = (newEvent, isEdit) => {
    // Optimistic / Instant Update
    if (!isEdit && newEvent) {
      queryClient.setQueryData(['events'], (oldEvents) => {
        return oldEvents ? [newEvent, ...oldEvents] : [newEvent];
      });
    } else {
      // For edits, it's safer to refetch or find-and-replace
      refetch();
    }
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = activeCategory ? event.category === activeCategory : true;

    // Helper to normalize date to YYYY-MM-DD
    const getDateStr = (d) => {
      if (!d) return null;
      try {
        return new Date(d).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    const eventDate = getDateStr(event.date);

    let matchesDate = true;
    if (selectedDate) {
      matchesDate = eventDate === selectedDate;
    }

    let matchesType = true;
    const today = new Date().toISOString().split('T')[0];

    if (filterType !== "All") {
      if (!eventDate) matchesType = false;
      else if (filterType === "Upcoming") matchesType = eventDate > today;
      else if (filterType === "Ongoing") matchesType = eventDate >= today;
    }

    return matchesSearch && matchesCategory && matchesDate && matchesType;
  });

  const categories = [...new Set(filteredEvents.map((e) => e.category || "Upcoming Events"))];

  return (
    <div className="flex pt-0 gap-8 px-4 lg:px-8 min-h-screen bg-gray-50/50 pb-28 lg:pb-20">
      {/* Left Slider (Sidebar) */}
      <div className="hidden lg:block flex-shrink-0 w-80">
        <div className="fixed top-[74px] left-8 w-80 bottom-[10px] z-40 overflow-hidden">
          <Slider
            onSearch={setSearchText}
            onCategory={setActiveCategory}
            onDateSelect={setSelectedDate}
            onToggle={setFilterType}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0 pt-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-900 border border-gray-800 shadow-xl mb-6 sm:mb-10">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-56 sm:w-72 h-56 sm:h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-56 sm:w-72 h-56 sm:h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-56 sm:w-72 h-56 sm:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center z-10 gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                {isRegistrationsView ? 'My Registrations' : 'Explore Events'}
              </h1>
              <p className="text-gray-300 max-w-lg text-sm sm:text-lg">
                {isRegistrationsView
                  ? 'All the events you have registered for. See you there!'
                  : 'Join hackathons, workshops, and meetups. Connect with the best minds in the community.'}
              </p>
              {isRegistrationsView && (
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-4 text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  Back to All Events
                </button>
              )}
            </div>

            <div className="flex flex-row sm:flex-col gap-3 min-w-[140px] w-full sm:w-auto mt-2 sm:mt-0">
              {['organizer', 'admin', 'moderator'].includes(currentUser?.role) && (
                <button
                  onClick={handleCreateEvent}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-gray-900 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-gray-100 transition hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
                >
                  <FaPlus className="text-sky-600 w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Host Event</span>
                </button>
              )}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-700 transition border border-gray-700 text-sm sm:text-base"
              >
                <FaFilter className="w-3 h-3 sm:w-4 sm:h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white h-96 rounded-2xl shadow-sm animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-red-100">
            <div className="text-red-500 mb-2">Failed to load events</div>
            <button onClick={() => refetch()} className="text-sky-600 hover:underline">Retry</button>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              const eventsOfCategory = filteredEvents.filter(
                (e) => (e.category || "Upcoming Events") === category
              );
              if (!eventsOfCategory.length) return null;

              return (
                <div key={category} className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                      {category}
                      <span className="text-sm font-normal text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                        {eventsOfCategory.length}
                      </span>
                    </h2>
                    {eventsOfCategory.length > 2 && (
                      <button
                        onClick={() => toggleCategory(category)}
                        className="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
                      >
                        {expandedCategories.has(category) ? 'Show Less' : 'View All'}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${expandedCategories.has(category) ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    )}
                  </div>

                  {expandedCategories.has(category) ? (
                    /* Expanded Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-4">
                      {eventsOfCategory.map((event) => (
                        <div key={event._id}>
                          <Cards
                            eventData={{
                              ...event,
                              organizerName: event.organizer?.name || "Unknown",
                              organizerTitle: "Organizer",
                              organizerAvatar: event.organizer?.profilePic,
                              eventImageUrl: event.imageUrl || "",
                              eventName: event.title,
                              eventPrize: event.prize || "No Prize",
                              eventDescription: event.description,
                              location: event.location,
                              date: event.date
                            }}
                            onEdit={handleEditEvent}
                            currentUserId={currentUser?.uid}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Collapsed Horizontal Scroll View */
                    <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar scroll-smooth">
                      {eventsOfCategory.map((event) => (
                        <div key={event._id} className="flex-shrink-0 w-[280px] sm:w-[350px]">
                          <Cards
                            eventData={{
                              ...event,
                              organizerName: event.organizer?.name || "Unknown",
                              organizerTitle: "Organizer",
                              organizerAvatar: event.organizer?.profilePic,
                              eventImageUrl: event.imageUrl || "",
                              eventName: event.title,
                              eventPrize: event.prize || "No Prize",
                              eventDescription: event.description,
                              location: event.location,
                              date: event.date
                            }}
                            onEdit={handleEditEvent}
                            currentUserId={currentUser?.uid}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendarCheck className="text-gray-300 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No events found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={handleEventCreated}
        eventToEdit={eventToEdit}
      />

      <MobileFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onSearch={setSearchText}
        onCategory={setActiveCategory}
        onDateSelect={setSelectedDate}
        onToggle={setFilterType}
      />
    </div>
  );
}

export default Events;


