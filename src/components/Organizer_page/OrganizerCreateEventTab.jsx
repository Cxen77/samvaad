import React from 'react';
import CreateEventModal from '../Event_page/CreateEventModal';

/**
 * OrganizerCreateEventTab
 * Uses the shared CreateEventModal component in inline mode so there's
 * a single source-of-truth for the event creation form.
 */
export default function OrganizerCreateEventTab() {
    const handleEventCreated = () => {
        // Modal already shows a toast on success; nothing else needed at tab level.
    };

    return (
        <CreateEventModal
            isInline
            isOpen
            onClose={() => {}}
            onEventCreated={handleEventCreated}
        />
    );
}
