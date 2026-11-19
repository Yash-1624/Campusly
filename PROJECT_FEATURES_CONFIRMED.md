# College Event Management System – Included Features

This package is prepared from the latest project ZIP supplied by the user.

## Portals and access
- Student portal: `/login` and `/signup`.
- Separate administrator portal: `/control-center`.
- Separate volunteer portal: `/volunteer-access`.
- Role-specific protected routes are configured for student, admin, and volunteer accounts.

## Volunteer management
- Admin can create volunteer accounts with name, department, mobile number, student ID, email, and one or more assigned events.
- Volunteer login ID and a generated temporary password are emailed to the volunteer.
- A separate event-allocation email is sent for each assigned event, with event information and the Volunteer Portal link.
- Volunteers can view their assigned events and select an event in their dashboard.
- Volunteer login accepts the generated Login ID.

## Event images
- Admin can upload an event image when creating an event.
- Admin can replace or remove the image when editing an event.
- Student event cards and event details display the saved image.
- Server validates JPG/JPEG, PNG, and WebP data images and enforces a 2 MB limit.

## Entry scanning and logs
- Volunteer QR scanning submits the selected event ID to the server.
- Server checks that the volunteer is assigned to the ticket's event and prevents duplicate entry.
- Admin entry log lists participant, student ID, event, entry status, entry time, scanner name, volunteer ID, and department.

## Setup notes
- Install dependencies separately in `client` and `server` with `npm install`.
- Keep local secrets in `server/.env`; this package intentionally excludes `.env` files.
- Configure `CLIENT_URL`, SMTP settings, MongoDB, and other existing environment variables as required by the deployment.
