import { exchangeCodeAsync, Prompt, ResponseType, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const CLIENT_ID = '447974687688-qeiu17sp40o16nkupfen6cqcd4gomnov.apps.googleusercontent.com'; // Keep your working ID
const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};
const SCOPES = [
  'openid', 
  'https://www.googleapis.com/auth/calendar.events',
];

WebBrowser.maybeCompleteAuthSession();

export const useCalendarAuth = () => {
  const redirectUri = 'https://auth.expo.io/@vinaykt_06/centralized-event-platform';
  
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: ResponseType.Code,  // ✅ FIXED: Use Code flow for Expo Go proxy
      prompt: Prompt.SelectAccount,
    },
    DISCOVERY
  );

  // ✅ NEW: Exchange code for tokens after success
  const getAccessToken = async () => {
    if (response?.type === 'success' && response.params.code) {
      try {
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code: response.params.code,
            redirectUri, // Required for token exchange
            extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : {}, // PKCE - code_verifier is on request object
          },
          DISCOVERY
        );
        return tokenResult.accessToken;
      } catch (error) {
        console.error('Token exchange failed:', error);
        throw new Error('Failed to exchange authorization code for token');
      }
    }
    return null;
  };

  return { request, response, promptAsync, getAccessToken };
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
        const eventBody = {
            summary: event.title,
            description: `${event.description}\n\nApp Event ID: ${event.id}`,
            location: event.location,
            start: { dateTime: event.startAt },
            end: { dateTime: event.endAt },
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
