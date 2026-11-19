# Separate portals: Student, Admin and Volunteer

- Student login: `/login`; registration: `/signup`.
- Admin login: `/control-center`; admin dashboard: `/control-center/dashboard`.
- Volunteer login: `/volunteer-access`; volunteer scanner dashboard: `/volunteer/dashboard`.

Sign-in is checked by the server against the selected portal. Student credentials cannot create an admin session from `/login`; admin accounts must use `/control-center`. Admin accounts are not created by public signup. To seed the first admin, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in `server/.env`, then run `npm run seed:admin` from `server`. The seeder does not print credentials.

## Admin volunteer management

Open `/control-center/volunteers` to create volunteer accounts with name, department, mobile number, student ID and assigned event. The system generates a Login ID and temporary password. The password is displayed once after account creation, so copy it and share it securely with the volunteer. There is no email address field for volunteers in this workflow.

The volunteer signs in at `/volunteer-access`, sees only assigned event(s), and scans ticket QR codes. The backend verifies event assignment and atomically records the entry status, timestamp and `scannedBy` user. Admins can view the live entry log at `/control-center/entries`; it refreshes every five seconds and displays participant, event, entry time, volunteer name, volunteer ID and department.

Keep `protect`, `adminOnly`, and `staffOnly` middleware in place. A hidden URL alone is not an access-control boundary.
