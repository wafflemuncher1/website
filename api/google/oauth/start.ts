import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).send("Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI");
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline", // <-- required to get refresh token
    prompt: "consent",      // <-- forces refresh token on first run
    scope: "https://www.googleapis.com/auth/calendar.readonly",
  });

  res.status(302).setHeader("Location", `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.end();
}