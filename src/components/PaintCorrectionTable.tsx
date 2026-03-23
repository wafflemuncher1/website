import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stages = [
  {
    level: "Stage 1",
    service: "Enhancement",
    price: "$450+",
    goal: "Single-pass machine polish to remove light swirls and maximize gloss.",
  },
  {
    level: "Stage 2",
    service: "Correction",
    price: "$750+",
    goal: 'A "Cut & Polish." Heavy pass to remove deep scratches followed by a mirror-finish polish.',
  },
  {
    level: "Stage 3",
    service: "Restoration",
    price: "Quote Only",
    goal: "Heavy sanding and multi-stage compounding for high-end builds or oxidized paint.",
  },
];

const PaintCorrectionTable = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Paint Correction</p>
          <h2 className="text-3xl md:text-5xl font-bold">Correction Stages</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-lg mx-auto">
            Choose the level of correction your paint needs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-xl border border-border/50 bg-card/50 overflow-hidden"
        >
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-primary font-semibold">Level</TableHead>
                  <TableHead className="text-primary font-semibold">Service</TableHead>
                  <TableHead className="text-primary font-semibold">Price</TableHead>
                  <TableHead className="text-primary font-semibold">Goal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((s) => (
                  <TableRow key={s.level} className="border-border/30">
                    <TableCell className="font-semibold">{s.level}</TableCell>
                    <TableCell>{s.service}</TableCell>
                    <TableCell className="font-semibold text-primary">{s.price}</TableCell>
                    <TableCell className="text-muted-foreground font-body text-sm max-w-xs">{s.goal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/30">
            {stages.map((s) => (
              <div key={s.level} className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{s.level} — {s.service}</span>
                  <span className="font-semibold text-primary text-sm">{s.price}</span>
                </div>
                <p className="text-sm text-muted-foreground font-body">{s.goal}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PaintCorrectionTable;
