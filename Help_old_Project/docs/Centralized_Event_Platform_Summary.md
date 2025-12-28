# Centralized Event Platform - GCOEN

## Project Overview
The **Centralized Event Platform** is a comprehensive solution designed to streamline event management for universities. It bridges the gap between student clubs and the student body by providing a single, unified platform for event discovery, management, and engagement.

## Key Problems Solved
1.  **Fragmented Information**: Replaces scattered WhatsApp/Instagram announcements with a central feed.
2.  **Engagement Tracking**: Provides clubs with tools to track attendance and reputation.
3.  **Targeted Communication**: Ensures students only receive notifications for events relevant to their department/interest.

## Feature Highlights

### For Students
-   **Personalized Feed**: Events filtered by Department and Year.
-   **Reminders**: "Set Reminder" button with push/in-app notifications 10 minutes before events.
-   **One-Stop Discovery**: View all campus activities in one place.

### For Clubs & Admins
-   **Role-Based Access**: Secure Admin and Club dashboards.
-   **Event Creation**: Form-based creation with targeting options (Dept/Year).
-   **Reputation System**: Gamified scoring based on event success (attendance, registrations).
-   **Responsive Admin Panel**: Desktop-optimized table views and mobile-optimized lists.

## Tech Stack
-   **Frontend**: Expo (React Native) + React Native Web (PWA).
-   **Backend**: Firebase (Auth, Firestore, Cloud Functions).
-   **Notifications**: Firebase Cloud Messaging (Stubbed/In-App for Demo).
-   **Deployment**: Firebase Hosting + GitHub Actions CI/CD.

## Scalability & Future Scope
-   **AI Recommendations**: Vertex AI to suggest events based on user history.
-   **Calendar Sync**: One-click add to Google Calendar.
-   **Advanced Analytics**: Visual charts for engagement trends.
