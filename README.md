# PATHWISE

PATHWISE is a student-first entrance-exam preparation companion for JEE, NEET, CET and CUET aspirants. It brings together a sustainable study planner, private wellbeing reflection, progress views, career exploration, a family view, and a definition of success beyond rank.

This project runs as a local full-stack app. The browser provides the React interface; a Node.js API uses SQLite for accounts and saved study/career preferences. The business-model page describes proposals and assumptions, not validated revenue or outcomes.

## Requirements

- Node.js 22.13 or newer (Node 24 LTS recommended)
- npm

Node 22.13+ is required for its built-in `node:sqlite` database module.

## Run in VS Code on Windows

1. Open the PATHWISE project folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the frontend and API together:

   ```powershell
   npm run dev
   ```

5. Open the Vite URL printed in the terminal, usually [http://localhost:5173](http://localhost:5173).

Keep that terminal open while using the app. Press **Ctrl+C** there to stop both services. The API health check is at [http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health).

## Accounts and data

- Create an account from **Sign in** on the landing page.
- Passwords are stored as salted scrypt hashes; the session is an HTTP-only cookie.
- Account study plan, planner preferences, career interests, and success-profile selections are stored in `data/pathwise.sqlite`.
- Wellbeing check-ins are deliberately excluded from account sync and remain in browser local storage.
- Each local database stays on the computer running the API. This does not create an online account service or sync data between computers.
- Sample student information is fictional.

## Build and run the production bundle locally

```powershell
npm run build
npm start
```

Then open [http://127.0.0.1:8787](http://127.0.0.1:8787).

## Checks

```powershell
npm test
npm run build
```

## Business perspective

The app includes a business-model canvas covering target users, value, channels, partnerships, costs, impact measures, and possible revenue. A free student tier, optional family features, institution licences, and sponsored access are presented as hypotheses to validate with students and families.

## Deployment note

The included SQLite backend is suitable for a local submission/demo on one computer. Hosting this as a public multi-user service requires a production host, persistent database storage, HTTPS, backups, and operational/security review. No cloud service or paid plan is assumed here. Career and exam-pathway content is illustrative; verify admissions routes with the relevant institutions.
