# Google API Integration Research

This document outlines the architecture, OAuth 2.0 scopes, endpoints, and integration patterns for Google Calendar, Google Meet, and Gmail APIs in a client-side web application.

---

## 1. Authentication & OAuth 2.0 Flow
Since Gonze is a client-side React application running in the browser, the recommended auth flow is the **Google Identity Services (GIS) Token Client** flow (Implicit Flow / Authorization Code Flow with PKCE if a backend is present). We will implement a client-side GIS implicit flow to obtain an access token.

### Scopes Required
* **Google Calendar API:** `https://www.googleapis.com/auth/calendar.events` (Allows creating, reading, updating, and deleting events).
* **Gmail API:** `https://www.googleapis.com/auth/gmail.send` (Allows sending email invitations and meeting follow-ups).
* **Google User Profile Info:** `openid`, `https://www.googleapis.com/auth/userinfo.profile`, `https://www.googleapis.com/auth/userinfo.email` (For retrieving name, email, avatar).

### Token Management & Encryption
Tokens received from Google OAuth must be stored securely.
* **Storage:** Local Storage (`gonze_integrations` key).
* **Security:** Tokens must be obfuscated/encoded (e.g., Base64 or simple encryption) in the browser storage to prevent plaintext scraping.
* **Lifecycle:** Access tokens expire after 1 hour (3600 seconds). We track `expires_at` and verify token validity before calling any Google API. If expired, we request the user to re-authorize or refresh (if utilizing offline access / refresh tokens).

---

## 2. Google Calendar Event & Google Meet Integration
To create a calendar event with a Google Meet link:

* **Endpoint:** `POST https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`
* **Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Payload Structure:**
  ```json
  {
    "summary": "Meeting Title",
    "description": "Meeting Description",
    "start": {
      "dateTime": "2026-06-12T14:00:00",
      "timeZone": "Asia/Tbilisi"
    },
    "end": {
      "dateTime": "2026-06-12T15:00:00",
      "timeZone": "Asia/Tbilisi"
    },
    "attendees": [
      { "email": "participant@example.com" }
    ],
    "conferenceData": {
      "createRequest": {
        "requestId": "unique-uuid-or-timestamp",
        "conferenceSolutionKey": {
          "type": "hangoutsMeet"
        }
      }
    }
  }
  ```
* **Response:** Returns the created event, including `htmlLink` (Google Calendar UI link) and `conferenceData.entryPoints[0].uri` (the **Google Meet link**).

---

## 3. Gmail Invitation Workflow
To send a meeting invitation email:

* **Endpoint:** `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
* **Payload Structure:** Gmail requires emails to be formatted as a MIME message, base64url encoded.
  ```json
  {
    "raw": "RnJvbTogbWUgdG8g..."
  }
  ```
* **MIME Generator Helper:**
  ```javascript
  const makeMime = (to, subject, body) => {
    const lines = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "Mime-Version: 1.0",
      `Subject: ${subject}`,
      "",
      body
    ];
    return btoa(unescape(encodeURIComponent(lines.join("\r\n"))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  ```

---

## 4. Fallback/Sandbox Architecture
To ensure the app functions immediately without Google Cloud Credentials:
1. **Credentials Validation:** If `clientId` or `apiKey` are missing, we disable production mode and operate in **Sandbox Mode**.
2. **Sandbox Simulation:** Calls to `googleService` resolve after a short artificial delay, returning mock event IDs, realistic Google Meet links (`https://meet.google.com/xxx-xxxx-xxx`), and success states.
3. **Error Handling:** Gracefully handles offline scenarios, API rate limits, invalid participant email validation, and authentication expiration with user-facing alerts.
