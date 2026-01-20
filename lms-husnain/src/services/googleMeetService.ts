import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export const generateMeetLink = async (
  summary: string,
  description: string,
  startTime: string, 
  endTime: string,
  isRecurring: boolean = false // 👈 New Parameter
) => {
  try {
    const requestId = uuidv4();

    const event: any = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: "Asia/Karachi",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Karachi",
      },
      conferenceData: {
        createRequest: {
          requestId: requestId,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    // ✅ ADD RECURRENCE RULE
    // This tells Google: "Repeat Weekly until the course ends"
    // (Here we set it to repeat for roughly 4 months/16 weeks for a semester)
    if (isRecurring) {
      event.recurrence = ["RRULE:FREQ=WEEKLY;COUNT=16"]; 
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: event,
    });

    console.log("✅ Recurring Google Meet Created:", response.data.hangoutLink);
    return response.data.hangoutLink;

  } catch (error) {
    console.error("❌ Error creating Google Meet link:", error);
    return null;
  }
};