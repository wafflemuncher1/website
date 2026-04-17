import type { VercelRequest, VercelResponse } from "@vercel/node";

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

const getAccessToken = async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await r.json();

  if (!r.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(json)}`);
  }

  return json.access_token as string;
};

const parseMonth = (month: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error("month must be YYYY-MM");
  const year = Number(m[1]);
  const mon = Number(m[2]) - 1;
  const start = new Date(Date.UTC(year, mon, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon + 1, 1, 0, 0, 0));
  return { start, end };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : null;

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!calendarId || !clientId || !clientSecret || !refreshToken) {
      res
        .status(500)
        .send(
          "Missing GOOGLE_CALENDAR_ID / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN"
        );
      return;
    }

    if (!month) {
      res.status(400).send("Missing ?month=YYYY-MM");
      return;
    }

    const { start, end } = parseMonth(month);
    const accessToken = await getAccessToken();

    const params = new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?${params.toString()}`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const json = await r.json();

    if (!r.ok) {
      res.status(500).json(json);
      return;
    }

    const items: GoogleEvent[] = json.items ?? [];

    const events = items
      .map((e) => {
        const startIso =
          e.start?.dateTime ??
          (e.start?.date ? `${e.start.date}T00:00:00Z` : null);
        const endIso =
          e.end?.dateTime ??
          (e.end?.date ? `${e.end.date}T23:59:00Z` : null);

        if (!startIso || !endIso) return null;

        return {
          id: e.id,
          title: e.summary ?? "(No title)",
          start: startIso,
          end: endIso,
          description: e.description ?? "",
        };
      })
      .filter(Boolean);

    res.status(200).json({ month, events });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
}