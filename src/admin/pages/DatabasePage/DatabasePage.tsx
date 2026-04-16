import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type EstimateRow = {
  id: string;
  created_at: string;

  name: string;
  email: string;
  phone: string;

  vehicle_size: string | null;
  condition: string | null;
  service: string | null;
  add_ons: unknown; // jsonb

  total_cents: number;
  consent: boolean;
  service_agreement_url: string | null;

  completed: boolean;
  ticket_number: string | null;

  notify_status: "pending" | "sent" | "failed" | string;
  notified_at: string | null;
  notify_error: string | null;
};

const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

const DatabasePage = () => {
  const [rows, setRows] = useState<EstimateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      "created_at",
      "name",
      "email",
      "phone",
      "vehicle_size",
      "condition",
      "service",
      "add_ons",
      "total_cents",
      "consent",
      "service_agreement_url",
      "completed",
      "ticket_number",
      "notify_status",
      "notified_at",
      "notify_error",
    ] as const,
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("estimate_requests")
        .select(columns.join(","))
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        setError(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data as EstimateRow[]) ?? []);
      setLoading(false);
    };

    load();
  }, [columns]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Database</h1>
        <p className="text-muted-foreground mt-1">
          Latest estimate submissions (read-only for now).
        </p>
      </div>

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-destructive/40 bg-card p-6">
          <p className="font-semibold text-destructive">Failed to load</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            If you just enabled RLS, confirm your logged-in user has the admin role and that
            the RLS policy allows admin SELECT.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-lg border border-border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr className="text-left">
                <th className="p-3 whitespace-nowrap">Created</th>
                <th className="p-3 whitespace-nowrap">Name</th>
                <th className="p-3 whitespace-nowrap">Email</th>
                <th className="p-3 whitespace-nowrap">Phone</th>
                <th className="p-3 whitespace-nowrap">Vehicle</th>
                <th className="p-3 whitespace-nowrap">Condition</th>
                <th className="p-3 whitespace-nowrap">Service</th>
                <th className="p-3 whitespace-nowrap">Add-ons</th>
                <th className="p-3 whitespace-nowrap">Total</th>
                <th className="p-3 whitespace-nowrap">Consent</th>
                <th className="p-3 whitespace-nowrap">Agreement</th>
                <th className="p-3 whitespace-nowrap">Completed</th>
                <th className="p-3 whitespace-nowrap">Ticket</th>
                <th className="p-3 whitespace-nowrap">Notify</th>
                <th className="p-3 whitespace-nowrap">Notified At</th>
                <th className="p-3 whitespace-nowrap">Error</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={16}>
                    No rows yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">{r.name}</td>
                    <td className="p-3 whitespace-nowrap">{r.email}</td>
                    <td className="p-3 whitespace-nowrap">{r.phone}</td>
                    <td className="p-3 whitespace-nowrap">{r.vehicle_size ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{r.condition ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{r.service ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-muted-foreground">
                        {typeof r.add_ons === "string"
                          ? r.add_ons
                          : JSON.stringify(r.add_ons)}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatMoney(r.total_cents)}</td>
                    <td className="p-3 whitespace-nowrap">{r.consent ? "Yes" : "No"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {r.service_agreement_url ? (
                        <a
                          className="underline underline-offset-2"
                          href={r.service_agreement_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">{r.completed ? "Yes" : "No"}</td>
                    <td className="p-3 whitespace-nowrap">{r.ticket_number ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{r.notify_status}</td>
                    <td className="p-3 whitespace-nowrap">
                      {r.notified_at ? new Date(r.notified_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {r.notify_error ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatabasePage;