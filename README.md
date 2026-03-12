
# TMS-crackers — Online cracker shop (Demo)

**Quick start (development)**

Requirements: Node.js (>=16), npm

1. Clone or unzip the project.
2. `cd TMS-crackers`
3. Install dependencies for frontend and backend:
   - `cd frontend && npm install`
   - `cd ../backend && npm install`
4. Start servers (two terminals):
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && npm run dev`

The frontend is configured to proxy API requests to the backend during dev.

**What this repo contains**

- `frontend/` — Vite + React + Tailwind skeleton (UI demo).
- `backend/` — Node + Express + SQLite (orders, products, admin).
- `.env.example` — copy to `.env` and edit values (`UPI_VPA`, `ADMIN_PASS`).

**Payment flow (UPI)**

This demo uses a manual UPI flow:
- At checkout the site will show a UPI deeplink and instructions (placeholder `tsm@upi`).
- Customer clicks "I have paid" and submits a txn ref or screenshot link.
- Admin verifies payment from the admin dashboard and marks order as paid.

To enable fully automated verification you can integrate with a payment aggregator (Razorpay / Paytm) and add webhook handling (instructions included in README).

**Notes**: This is a demo scaffold. Replace placeholders and secure admin password before production.
