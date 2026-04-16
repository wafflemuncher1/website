import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (day: string) => void; // YYYY-MM-DD
};

const todayYmd = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const RescheduleDayDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const [day, setDay] = useState(todayYmd());

  const error = useMemo(() => {
    if (!day) return "Pick a date.";
    return null;
  }, [day]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule a day</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Day to reschedule</label>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          <p className="text-sm text-muted-foreground">
            Next step: move all bookings from this day to the next available slots.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (error) return;
              onSubmit(day);
              onOpenChange(false);
            }}
          >
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDayDialog;