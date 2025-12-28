# UniEvent - College Event Management System

## Overview
**UniEvent** is a smart mobile and web application designed to simplify how college events are managed and attended. It bridges the gap between Club Leads, Admin, and Students. The app allows Clubs to organize events efficiently with automated tools, and helps Students stay updated and engaged via a gamified platform.

Simply put: It's a single place for all college activities, attendance, and rewards.

## Key Features

### For Students:
- **Unified Feed**: See all upcoming workshops, fests, and seminars in one scrollable list.
- **One-Tap Calendar Sync**: Add events to your personal Google Calendar with a single click.
- **QR Check-in**: Scan QR codes at venues to mark attendance instantly.
- **Reputation Points**: Earn points for attending events and climb the college leaderboard.
- **Multi-Account**: secure login with multiple accounts (Personal & Organization) on one device.

### For Clubs & Admin:
- **Smart Event Creation**: Just fill in details, and the system **automatically generates a unique Google Meet link** and attaches it.
- **Admin Dashboard**: Full control to monitor all events.
- **Suspend/Ban**: Admins can instantly suspend inappropriate events or users.
- **Analytics**: Track how many students registered and attended.

## Technology Stack
- **Frontend**: React Native (Expo) - Works on Android, iOS, and Web.
- **Backend**: Firebase (Firestore, Auth, Functions).
- **Integrations**: Google Calendar API, Google Meet API.

## Project File Structure

```
TechSprint_Project/
├── app/                        # Main Frontend Code (Expo)
│   ├── App.js                  # Entry Point & Navigation Logic
│   └── src/
│       ├── components/         # Reusable UI (Cards, Headers, Modals)
│       ├── screens/            # App Pages (Home, Profile, Create Event)
│       │   ├── UserFeed.js     # Main Event List
│       │   ├── ProfileScreen.js# User Profile & Settings
│       │   ├── QRScanner.js    # Attendance Scanner
│       │   └── ...
│       └── lib/                # Logic & Configuration
│           ├── firebaseConfig.js
│           ├── AuthContext.js  # Authentication Logic
│           └── CalendarService.js # Google API integration
│
├── cloud-functions/            # Backend Logic (Firebase Functions)
│   └── index.js                # Server-side triggers
│
├── docs/                       # Project Documentation
└── README.md                   # This file
```

## How to Run

1.  **Install Dependencies**:
    ```bash
    cd app
    npm install
    ```
2.  **Start the App**:
    ```bash
    npx expo start
    ```
    - Press `w` for Web.
    - Scan QR code for Android/iOS.

---
*Built for Hack2Skill GDGC TechSprint.*
