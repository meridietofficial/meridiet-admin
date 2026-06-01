# MeriDiet Admin Panel

Admin portal for the MeriDiet platform — manage users, dietitians, and platform settings.

## Tech Stack

- **Framework:** Next.js 13 (Pages Router)
- **UI:** React Bootstrap, Framer Motion, React Icons
- **State:** Redux
- **Auth:** JWT (stored in localStorage)
- **Storage:** AWS S3
- **Notifications:** React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install --legacy-peer-deps
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## Environment Variables

Create a `.env` file in the root:

```env
NEXT_PUBLIC_AWS_ACCESS_KEY=your_aws_access_key
NEXT_PUBLIC_AWS_SECRET_KEY=your_aws_secret_key
NEXT_PUBLIC_AWS_REGION=your_aws_region
NEXT_PUBLIC_AWS_S3_BUCKET=your_s3_bucket_name
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
├── pages/
│   ├── index.js                  # Login page
│   ├── forgot-password.js
│   └── dashboard/
│       ├── index.js              # Dashboard
│       ├── user-management.js
│       ├── dietitian-requests.js
│       ├── dietitian-management.js
│       └── setting.js
├── src/
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
