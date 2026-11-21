# Admin event participant navigation update

## Changes
- Removed the **View Participants** action from the Manage Events page and removed its standalone participants route/page.
- Manage Events is now focused on event management: the event card's **Edit event** action remains available, the admin can change the event status, and the Delete action remains available.
- The event status selector displays **Registration Open**, **Registration Closed**, **Draft**, **Cancelled**, and **Completed**.
- Moved event-specific participant viewing to **Manage Registrations**. Admins can select an event from the event filter, view participants for that event, and search by participant name, college PID, email, college, team, registration/payment status, or event.
- Added an event filter and search field to **Participant Entry Log**. Admins can filter scan records for one event and search participant, PID, event, scanner, volunteer ID, and entry status. The entry log continues refreshing every five seconds.
- Existing event participant API is reused; no database migration is required.

## Files updated
- `client/src/pages/admin/ManageEvents.jsx`
- `client/src/pages/admin/ManageRegistrations.jsx`
- `client/src/pages/admin/EntryLog.jsx`
- `client/src/App.jsx`
- Removed `client/src/pages/admin/EventParticipants.jsx`
