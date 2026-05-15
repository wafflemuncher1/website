import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, RefreshCw, Car, DollarSign,
  Users, TrendingUp, Navigation,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  zip_code: string;
  service: string;
  vehicle_size: string;
  total_cents: number;
  booking_date: string;
  completed: boolean;
  lat?: number;
  lng?: number;
};

type ZipStat = { zip: string; city: string; count: number; revenue: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (c: number) => `$${(c / 100).toFixed(0)}`;

const SERVICE_COLORS: Record<string, string> = {
  "The Baseline": "#3b82f6",
  "The Signature Detail": "#8b5cf6",
  "Default": "#10b981",
};
const getColor = (service: string) => SERVICE_COLORS[service] ?? SERVICE_COLORS.Default;

// Nominatim geocode — free, no key needed, rate-limited to 1 req/sec
const geocodeAddress = async (address: string, city: string, state = "KY"): Promise<{ lat: number; lng: number } | null> => {
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}, USA`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "GlossworksAdmin/1.0 (Contact@glossworksky.com)" } }
    );
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (_) { /* fail silently */ }
  return null;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Main Component ───────────────────────────────────────────────────────────

const ServiceAreaPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markersLayerRef = useRef<unknown>(null);
  const { toast } = useToast();

  const [jobs, setJobs] = useState<JobLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ done: 0, total: 0 });
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming">("all");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Load Leaflet from CDN ──────────────────────────────────────────────────

  useEffect(() => {
    if (document.getElementById("leaflet-css")) { setLeafletLoaded(true); return; }

    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Fetch jobs ─────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data: bookings } = await supabase
      .from("estimate_requests")
      .select("id,name,address,city,zip_code,service,vehicle_size,total_cents,booking_date,completed")
      .not("address", "is", null)
      .order("booking_date", { ascending: false });

    if (!bookings) { setLoading(false); return; }

    // Fetch cached geocoded coordinates
    const { data: geocoded } = await supabase
      .from("geocoded_locations")
      .select("estimate_request_id,lat,lng");

    const coordMap = new Map<string, { lat: number; lng: number }>();
    if (geocoded) {
      for (const g of geocoded) coordMap.set(g.estimate_request_id, { lat: g.lat, lng: g.lng });
    }

    const enriched: JobLocation[] = bookings.map(b => ({
      ...b,
      lat: coordMap.get(b.id)?.lat,
      lng: coordMap.get(b.id)?.lng,
    }));

    setJobs(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Geocode missing addresses ──────────────────────────────────────────────

  const geocodeMissing = useCallback(async () => {
    const missing = jobs.filter(j => j.address && !j.lat);
    if (!missing.length) { toast({ title: "All addresses already geocoded ✓" }); return; }

    setGeocoding(true);
    setGeocodeProgress({ done: 0, total: missing.length });

    for (let i = 0; i < missing.length; i++) {
      const job = missing[i];
      const coords = await geocodeAddress(job.address, job.city);
      if (coords) {
        const addressKey = `${job.address},${job.city},${job.zip_code}`.toLowerCase().replace(/\s+/g, " ");
        await supabase.from("geocoded_locations").upsert({
          estimate_request_id: job.id,
          address_key: addressKey,
          lat: coords.lat,
          lng: coords.lng,
          display_name: `${job.address}, ${job.city}`,
        }, { onConflict: "address_key" });
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...coords } : j));
      }
      setGeocodeProgress({ done: i + 1, total: missing.length });
      if (i < missing.length - 1) await sleep(1100); // Nominatim rate limit
    }

    setGeocoding(false);
    toast({ title: `Geocoded ${missing.length} address${missing.length !== 1 ? "es" : ""} ✓` });
  }, [jobs, toast]);

  // ── Initialize / update Leaflet map ───────────────────────────────────────

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as unknown as { L: unknown }).L as {
      map: (el: HTMLElement, opts: object) => unknown;
      tileLayer: (url: string, opts: object) => { addTo: (m: unknown) => void };
      layerGroup: () => { addTo: (m: unknown) => unknown; clearLayers: () => void; addLayer: (l: unknown) => void };
      circleMarker: (latlng: [number, number], opts: object) => { bindPopup: (html: string) => unknown };
    };
    if (!L) return;

    if (!leafletMapRef.current) {
      // Louisville, KY center
      const m = L.map(mapRef.current, { center: [38.2527, -85.7585], zoom: 11 } as object);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      } as object).addTo(m);
      markersLayerRef.current = L.layerGroup().addTo(m);
      leafletMapRef.current = m;
      setMapReady(true);
    }
  }, [leafletLoaded]);

  // ── Update markers when jobs or filter changes ─────────────────────────────

  useEffect(() => {
    if (!mapReady || !markersLayerRef.current) return;
    const L = (window as unknown as { L: unknown }).L as {
      circleMarker: (latlng: [number, number], opts: object) => { bindPopup: (html: string) => unknown };
    };
    if (!L) return;

    const layer = markersLayerRef.current as { clearLayers: () => void; addLayer: (l: unknown) => void };
    layer.clearLayers();

    const visible = jobs.filter(j => {
      if (!j.lat || !j.lng) return false;
      if (filter === "completed") return j.completed;
      if (filter === "upcoming") return !j.completed;
      return true;
    });

    for (const job of visible) {
      const color = getColor(job.service);
      const marker = L.circleMarker([job.lat!, job.lng!], {
        radius: 9,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      } as object).bindPopup(`
        <div style="min-width:180px;font-family:sans-serif;">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${job.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:6px;">${job.address}, ${job.city}</div>
          <table style="font-size:11px;border-collapse:collapse;width:100%">
            <tr><td style="color:#888;padding:1px 6px 1px 0">Service</td><td style="font-weight:500">${job.service || "—"}</td></tr>
            <tr><td style="color:#888;padding:1px 6px 1px 0">Vehicle</td><td>${job.vehicle_size || "—"}</td></tr>
            <tr><td style="color:#888;padding:1px 6px 1px 0">Date</td><td>${job.booking_date || "—"}</td></tr>
            <tr><td style="color:#888;padding:1px 6px 1px 0">Total</td><td style="font-weight:700;color:#2563eb">${fmt$(job.total_cents)}</td></tr>
            <tr><td style="color:#888;padding:1px 6px 1px 0">Status</td><td><span style="background:${job.completed ? "#dcfce7" : "#dbeafe"};color:${job.completed ? "#166534" : "#1e40af"};padding:1px 6px;border-radius:999px;font-size:10px">${job.completed ? "Done" : "Upcoming"}</span></td></tr>
          </table>
        </div>
      `);
      layer.addLayer(marker);
    }
  }, [jobs, filter, mapReady]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const geocodedJobs = jobs.filter(j => j.lat && j.lng);
  const visibleJobs = jobs.filter(j => {
    if (filter === "completed") return j.completed;
    if (filter === "upcoming") return !j.completed;
    return true;
  });

  // Zip code stats
  const zipStats: ZipStat[] = (() => {
    const m: Record<string, ZipStat> = {};
    for (const j of visibleJobs) {
      const key = j.zip_code || "Unknown";
      if (!m[key]) m[key] = { zip: key, city: j.city || "", count: 0, revenue: 0 };
      m[key].count++;
      if (j.completed) m[key].revenue += j.total_cents;
    }
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  // City stats
  const cityStats = (() => {
    const m: Record<string, number> = {};
    for (const j of visibleJobs) {
      const city = j.city ? j.city.replace(/\b\w/g, c => c.toUpperCase()) : "Unknown";
      m[city] = (m[city] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  const totalRevenue = visibleJobs.filter(j => j.completed).reduce((s, j) => s + j.total_cents, 0);
  const avgJobValue = visibleJobs.filter(j => j.completed).length > 0
    ? Math.round(totalRevenue / visibleJobs.filter(j => j.completed).length) : 0;
  const missingGeocode = jobs.filter(j => j.address && !j.lat).length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Service Area</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Map of all {jobs.length} job locations · {geocodedJobs.length} geocoded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {missingGeocode > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
              disabled={geocoding} onClick={geocodeMissing}>
              {geocoding
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Geocoding {geocodeProgress.done}/{geocodeProgress.total}…</>
                : <><Navigation className="h-3.5 w-3.5" /> Geocode {missingGeocode} address{missingGeocode !== 1 ? "es" : ""}</>}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={fetchJobs}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Geocode notice ───────────────────────────────────────────────────── */}
      {missingGeocode > 0 && !geocoding && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            <strong>{missingGeocode} address{missingGeocode !== 1 ? "es" : ""}</strong> haven't been placed on the map yet.
            Click "Geocode addresses" above to look them up. Free, uses OpenStreetMap.
          </span>
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Total Jobs</span></div>
          <div className="text-2xl font-bold">{visibleJobs.length}</div>
          <div className="text-xs text-muted-foreground">{geocodedJobs.length} on map</div>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Total Revenue</span></div>
          <div className="text-2xl font-bold">{fmt$(totalRevenue)}</div>
          <div className="text-xs text-muted-foreground">completed jobs</div>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Avg Job Value</span></div>
          <div className="text-2xl font-bold">{fmt$(avgJobValue)}</div>
          <div className="text-xs text-muted-foreground">per completed job</div>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Zip Codes</span></div>
          <div className="text-2xl font-bold">{zipStats.length}</div>
          <div className="text-xs text-muted-foreground">unique areas served</div>
        </div>
      </div>

      {/* ── Map + Sidebar ─────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 items-start">

        {/* Map */}
        <div className="md:col-span-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex rounded-md border overflow-hidden text-xs">
              {(["all","completed","upcoming"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={["px-3 py-1.5 font-medium capitalize transition-colors border-r last:border-r-0",
                    filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  ].join(" ")}>
                  {f}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 ml-2 text-xs text-muted-foreground">
              {Object.entries(SERVICE_COLORS).filter(([k]) => k !== "Default").map(([svc, color]) => (
                <span key={svc} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block border-2 border-white shadow-sm" style={{ background: color }} />
                  {svc}
                </span>
              ))}
            </div>
          </div>

          {/* Map container */}
          <div className="rounded-xl border overflow-hidden" style={{ height: "480px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !leafletLoaded ? (
              <div className="flex items-center justify-center h-full bg-muted/20">
                <p className="text-sm text-muted-foreground">Loading map…</p>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full z-0" />
            )}
          </div>

          {geocodedJobs.length === 0 && !loading && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              No geocoded locations yet — click "Geocode addresses" above to place pins on the map.
            </p>
          )}
        </div>

        {/* Sidebar stats */}
        <div className="space-y-4">
          {/* Top zip codes */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Top Zip Codes</h3>
            </div>
            {zipStats.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2">
                {zipStats.map((z, i) => (
                  <div key={z.zip} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">{z.zip}</span>
                        <span className="text-xs font-bold">{z.count} job{z.count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{z.city ? z.city.replace(/\b\w/g, c => c.toUpperCase()) : ""}</div>
                      <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${(z.count / (zipStats[0]?.count || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top cities */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Top Cities</h3>
            </div>
            {cityStats.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2">
                {cityStats.map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{city}</span>
                    <Badge variant="outline" className="text-[10px] h-5 ml-2 shrink-0">
                      {count} job{count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent jobs with location */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Recent Jobs</h3>
            </div>
            <div className="space-y-2.5">
              {visibleJobs.slice(0, 6).map(j => (
                <div key={j.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{j.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{j.city}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold">{fmt$(j.total_cents)}</div>
                      <div className={["text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        j.completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                      ].join(" ")}>
                        {j.completed ? "Done" : "Upcoming"}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{j.address}</span>
                    {j.lat && <span className="text-green-500 shrink-0">📍</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreaPage;
