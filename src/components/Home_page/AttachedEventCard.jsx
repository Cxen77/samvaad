import React from 'react';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AttachedEventCard({ event }) {
  if (!event) return null;

  return (
    <div className="mx-4 mt-2 mb-3 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
      <Link to={`/events/${event._id}`} className="absolute inset-0 z-10" aria-label="View event details" />
      
      <div className="flex items-stretch">
        {/* Left Color Bar */}
        <div className="w-1.5 bg-gradient-to-b from-sky-500 to-sky-600" />
        
        {/* Image / Icon Area */}
        {event.imageUrl ? (
          <div className="w-24 md:w-32 flex-shrink-0 bg-gray-50 flex items-center justify-center p-2 relative overflow-hidden">
             <img 
               src={event.imageUrl} 
               alt={event.title} 
               className="h-full w-full object-cover rounded-lg"
             />
          </div>
        ) : (
          <div className="w-24 md:w-32 flex-shrink-0 bg-sky-50/50 flex flex-col items-center justify-center gap-1.5 border-r border-sky-50/30">
             <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
               <Calendar size={20} />
             </div>
             <p className="text-[10px] font-bold text-sky-600 tracking-wider uppercase text-center">{event.category || 'Event'}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="p-3 md:p-4 flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex justify-between items-start gap-2 mb-1">
             <div>
               <p className="text-[10px] font-bold text-sky-500 tracking-wider uppercase mb-1">Event Attached</p>
               <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight group-hover:text-sky-600 transition-colors line-clamp-1">
                 {event.title}
               </h3>
             </div>
             <div className="bg-sky-50 p-1.5 rounded-full text-sky-500 group-hover:bg-sky-600 group-hover:text-white transition-colors">
               <ArrowRight size={14} />
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
               <Calendar size={12} className="text-gray-400" />
               <span className="truncate">{event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}</span>
            </div>
            {event.location && (
               <div className="flex items-center gap-1 text-xs text-gray-500">
                 <MapPin size={12} className="text-gray-400" />
                 <span className="truncate max-w-[100px] md:max-w-[200px]">{event.location}</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
