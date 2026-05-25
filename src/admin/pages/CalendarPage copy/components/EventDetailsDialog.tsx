import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CalendarEventLike = {
  id: string;
  kind?: "booking" | "blocked";
  title: string;
  start: string; // ISO
  end: string;   // ISO
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEventLike | null;

  // only used when event.kind === "blocked"
  onDeleteBlock?: (id: string) => void;
};

const EventDetailsDialog = ({ open, onOpenChange, event, onDeleteBlock }: Props) => {
  if (!event) return null;

  const isBlocked = event.kind === "blocked";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isBlocked ? "Blocked time" : "Booking details"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Title</div>
            <div className="text-foreground font-medium">{event.title}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs">Time</div>
            <div className="text-foreground font-medium">
              {new Date(event.start).toLocaleString()} → {new Date(event.end).toLocaleString()}
            </div>
          </div>

          {!isBlocked && (
            <>
              <div>
                <div className="text-muted-foreground text-xs">Name</div>
                <div className="text-foreground font-medium">{event.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Email</div>
                <div className="text-foreground font-medium">{event.email ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Phone</div>
                <div className="text-foreground font-medium">{event.phone ?? "—"}</div>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <div className="text-muted-foreground text-xs">Notes</div>
            <div className="text-foreground font-medium">{event.notes ?? "—"}</div>
          </div>
        </div>

        <DialogFooter>
          {isBlocked && onDeleteBlock && (
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteBlock(event.id);
                onOpenChange(false);
              }}
            >
              Delete block
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;