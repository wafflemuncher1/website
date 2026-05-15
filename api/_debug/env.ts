import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_REDIRECT_URI: Boolean(process.env.GOOGLE_REDIRECT_URI),
    GOOGLE_CALENDAR_ID: Boolean(process.env.GOOGLE_CALENDAR_ID),
    GOOGLE_REFRESH_TOKEN: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
  });
}