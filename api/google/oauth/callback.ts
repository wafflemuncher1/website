import type { VercelRequest, VercelResponse } from "@vercel/node";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === "string" ? req.query.code : null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).send("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI");
    return;
  }

  if (!code) {
    res.status(400).send("Missing ?code= in callback URL");
    return;
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await r.json()) as TokenResponse;

  if (!r.ok) {
    res.status(500).json(json);
    return;
  }

  // IMPORTANT: refresh_token usually only appears on first consent (or prompt=consent).
  res
    .status(200)
    .setHeader("Content-Type", "text/plain; charset=utf-8")
    .send(
      [
        "OAuth success.",
        "",
        `access_token: ${json.access_token ?? "(none)"}`,
        `refresh_token: ${json.refresh_token ?? "(none)"}`,
        "",
        "Copy refresh_token into Vercel env var GOOGLE_REFRESH_TOKEN.",
      ].join("\n")
    );
}