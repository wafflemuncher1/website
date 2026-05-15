import { BarChart3, Users, Calendar, DollarSign } from "lucide-react";

const placeholderCards = [
  { label: "Total Bookings", value: "—", icon: Calendar },
  { label: "Customers", value: "—", icon: Users },
  { label: "Revenue", value: "—", icon: DollarSign },
  { label: "This Month", value: "—", icon: BarChart3 },
];

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Admin.</p>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder content area */}
      <div className="rounded-lg border border-border bg-card p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground text-center">
          Dashboard content will appear here.<br />
          Use the menu to navigate between sections.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
