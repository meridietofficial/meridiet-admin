# MeriDiet Admin Panel

Admin portal for the MeriDiet platform — manage users, dietitians, and platform settings.

## Tech Stack

- **Framework:** Vite + React 18 (SPA, React Router)
- **UI:** React Bootstrap, Framer Motion, React Icons
- **State:** Redux
- **Auth:** JWT (stored in localStorage)
- **Storage:** AWS S3 (via the small Express upload server)
- **Notifications:** React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev      # Vite dev server  → http://localhost:3000
npm run server   # Express upload server (only needed for profile-image uploads)
```

The Vite dev server proxies `POST /api/upload-image` to the Express server
(`http://localhost:5050`), which performs the server-side S3 upload that can't
run in the browser. All other API calls go directly to the backend configured
in `src/helpers/api/instance.js`.

### Production Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

Serve the `dist/` folder with any static host. Run `npm run server` alongside it
(or deploy it separately) so image uploads keep working.

## Environment Variables

Create a `.env` file in the root (read by the Express upload server):

```env
AWS_REVEAL_SECRET=your_aws_reveal_secret
```

## API Configuration

Base URL is set in `src/helpers/api/instance.js`. All API keys/endpoints are centrally managed in `src/helpers/api/apiKeys.js`.

## Pages

| Route | Description |
|---|---|
| `/` | Login |
| `/forgot-password` | Forgot / reset password |
| `/dashboard` | Overview with stats |
| `/dashboard/user-management` | View, block, delete users |
| `/dashboard/dietitian-requests` | Review & verify pending dietitian applications |
| `/dashboard/dietitian-management` | Manage approved dietitians |
| `/dashboard/setting` | Profile settings & change password |

## Project Structure

```
├── index.html                    # Vite entry HTML
├── vite.config.js                # Vite config (React plugin + /api proxy)
├── server/
│   └── index.js                  # Express server for S3 image uploads
├── src/
│   ├── main.jsx                  # App entry (mounts React + BrowserRouter)
│   ├── App.jsx                   # Providers + React Router routes
│   ├── pages/                    # Route components
│   │   ├── Home.jsx              # Login page  (/)
│   │   ├── ForgotPasswordPage.jsx
│   │   └── dashboard/            # Dashboard, UserManagement, DietPlan, ...
│   ├── components/
│   │   ├── auth/                 # Login, ForgotPassword
│   │   ├── common/               # Header, Footer, Loader
│   │   ├── layout/               # Sidebar, Layout wrapper
│   │   ├── user/                 # User management table
│   │   ├── dietitian/            # Dietitian table (shared)
│   │   └── profile/              # Settings, ChangePassword
│   ├── helpers/
│   │   ├── api/                  # Axios instance, API class, apiKeys
│   │   └── auth.js               # Token helpers
│   ├── services/
│   │   └── profileService.js
│   ├── store/                    # Redux store
│   ├── constants/                # Loader context, toast helpers
│   └── stylesheets/              # SCSS modules
└── public/
    └── images/                   # Logos, icons
```
