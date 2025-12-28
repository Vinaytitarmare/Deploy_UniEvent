import { makeRedirectUri, Prompt, ResponseType, useAuthRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

// --- CONFIGURATION ---
// This is the ORIGINAL Client ID that was working before refactoring
const CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const DISCOVERY = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/calendar.events',
];

WebBrowser.maybeCompleteAuthSession();

import { useState } from 'react'; // Added import

export const useCalendarAuth = () => {
    const redirectUri = makeRedirectUri({ useProxy: true });
    // console.log("Using Redirect URI (Calendar):", redirectUri);

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: CLIENT_ID,
            scopes: SCOPES,
            redirectUri: redirectUri,
            responseType: ResponseType.Token,
            prompt: Prompt.SelectAccount,
            usePKCE: false,
        },
        DISCOVERY
    );

    // Web Local State to mimic native behavior
    const [webResponse, setWebResponse] = useState(null);

    // Web-specific handler (Same logic as AuthScreen)
    const handleWebAuth = async () => {
        try {
            const { GoogleAuthProvider, signInWithPopup, getAuth } = await import('firebase/auth');
            const { app } = await import('./firebaseConfig');
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();
            SCOPES.forEach(scope => provider.addScope(scope));

            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            return {
                type: 'success',
                authentication: { accessToken: token },
                params: { access_token: token }
            };
        } catch (error) {
            console.error("Calendar Auth Error:", error);
            return { type: 'error', error };
        }
    };

    // Override promptAsync for web
    const customPromptAsync = async () => {
        if (typeof window !== 'undefined') { // Web check (better than Platform.OS for strict web)
            const result = await handleWebAuth();
            setWebResponse(result); // Trigger state update for consumers
            return result;
        }
        return promptAsync();
    };

    return { 
        request, 
        response: typeof window !== 'undefined' ? webResponse : response, 
        promptAsync: customPromptAsync 
    };
};

export const createMeetEvent = async (accessToken, eventDetails) => {
    try {
        const { title, description, startAt, endAt } = eventDetails;

        const eventBody = {
            summary: title,
            description: description,
            start: { dateTime: startAt }, // ISO String
            end: { dateTime: endAt },
            conferenceData: {
                createRequest: {
                    requestId: `req-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventBody),
            }
        );

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        return {
            meetLink: data.hangoutLink,
            eventId: data.id,
            htmlLink: data.htmlLink // Link to calendar event
        };

    } catch (error) {
        console.error("Calendar API Error:", error);
        throw error;
    }
};

export const addToCalendar = async (accessToken, event) => {
    try {
        let description = `${event.description}\n\nApp Event ID: ${event.id}`;
        if (event.meetLink) {
            description += `\n\nGoogle Meet Link: ${event.meetLink}`;
        }

        const eventBody = {
            summary: event.title,
            description: description,
            location: event.eventMode === 'online' ? event.meetLink : event.location, // Use Meet Link as location for online events
            start: { dateTime: new Date(event.startAt).toISOString() },
            end: { dateTime: new Date(event.endAt).toISOString() },
        };

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventBody),
            }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data;
    } catch (error) {
        console.error("Add to Calendar Error:", error);
        throw error;
    }
};
