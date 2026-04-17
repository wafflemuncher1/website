import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Search, Eye } from "lucide-react";

type Booking = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  vehicle_size: string;
  condition: string;
  service: string;
  add_ons: unknown;
  total_cents: number;
  completed: boolean;
  ticket_number: string;
  notify_status: string;
  notes?: string;
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estimate_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const markComplete = async (id: string) => {
    const { error } = await supabase
      .from("estimate_requests")
      .update({ completed: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as complete" });
      fetchBookings();
      setSelected(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) ||
      b.ticket_number?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && !b.completed) ||
      (filter === "completed" && b.completed);
    return matchSearch && matchFilter;
  });

  const fmtCents = (c: number) => c ? `$${(c / 100).toFixed(2)}` : "—";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {bookings.filter((b) => !b.completed).length} active · {bookings.length} total
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, ticket…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No bookings found.</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead>
                <TableHead>Total</TableHead><TableHead>Ticket</TableHead><TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">{fmtDate(b.created_at)}</TableCell>
                  <TableCell><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.phone}</div></TableCell>
                  <TableCell><div className="text-sm">{b.service || "—"}</div><div className="text-xs text-muted-foreground">{b.vehicle_size}</div></TableCell>
                  <TableCell className="font-medium">{fmtCents(b.total_cents)}</TableCell>
                  <TableCell className="text-xs font-mono">{b.ticket_number || "—"}</TableCell>
                  <TableCell>
                    {b.completed ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                    ) : (
                      <Badge className={`${statusColor[b.notify_status] ?? "bg-gray-100 text-gray-700"} hover:opacity-90`}>{b.notify_status ?? "pending"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(b)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Booking — {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Date" value={fmtDate(selected.created_at)} />
                <Detail label="Ticket" value={selected.ticket_number || "—"} />
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Address" value={`${selected.address}, ${selected.city} ${selected.zip_code}`} />
                <Detail label="Vehicle size" value={selected.vehicle_size} />
                <Detail label="Condition" value={selected.condition} />
                <Detail label="Service" value={selected.service} />
                <Detail label="Total" value={fmtCents(selected.total_cents)} />
              </div>
              {selected.notes && <div><p className="text-muted-foreground text-xs mb-1">Notes</p><p>{selected.notes}</p></div>}
              {!selected.completed && (
                <Button className="w-full mt-2" onClick={() => markComplete(selected.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />Mark as Completed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <div><p className="text-muted-foreground text-xs">{label}</p><p className="font-medium">{value || "—"}</p></div>
);

export default BookingsPage;
