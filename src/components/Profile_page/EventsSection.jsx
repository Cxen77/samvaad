import React from 'react';
import userData from '../userdata';
import { FaCalendar, FaTrophy, FaCertificate } from 'react-icons/fa';

const EventsSection = ({ className = "" }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Upcoming':
                return 'bg-sky-100 text-sky-700';
            case 'Participated':
                return 'bg-green-100 text-green-700';
            case 'Completed':
                return 'bg-sky-100 text-sky-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Hackathon':
                return <FaTrophy className="text-yellow-500" />;
            case 'Workshop':
                return <FaCertificate className="text-sky-500" />;
            case 'Conference':
                return <FaCalendar className="text-sky-500" />;
            default:
                return <FaCalendar className="text-gray-500" />;
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                        Events & Hackathons
                    </h3>
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-bold border border-gray-200">
                        {userData.events.length}
                    </span>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {userData.events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-sky-200 transition-all duration-200 flex flex-col group"
                        >
                            {/* Top Header Map */}
                            <div className="flex items-start justify-between mb-3 gap-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="text-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        {getTypeIcon(event.type)}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-sky-600 transition-colors truncate" title={event.name}>
                                        {event.name}
                                    </h4>
                                </div>
                                <span className={`shrink-0 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(event.status)}`}>
                                    {event.status}
                                </span>
                            </div>

                            {/* Details Container */}
                            <div className="flex flex-col flex-1 justify-center space-y-3 mt-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <FaCalendar className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{event.date}</span>
                                    </div>
                                    <span className="hidden sm:inline text-gray-300">•</span>
                                    <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                        {event.type}
                                    </span>
                                </div>

                                {event.achievement && (
                                    <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-100 mt-auto">
                                        <FaTrophy className="text-yellow-500 w-4 h-4 shrink-0" />
                                        <span className="text-xs font-bold leading-tight line-clamp-2">{event.achievement}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventsSection;
