import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Store as StoreIcon, Package, Wrench, ShoppingBag, DollarSign } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const COLORS = ["hsl(160 84% 34%)", "hsl(21 90% 50%)", "hsl(43 74% 55%)", "hsl(197 60% 42%)", "hsl(280 40% 55%)", "hsl(0 84% 55%)"];

export default function AdminDashboard() {
  const { currency, lang } = useApp();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = () => {
    api.get("/dashboard/admin").then((r) => setStats(r.data));
    api.get("/admin/users").then((r) => setUsers(r.data));
    api.get("/admin/orders").then((r) => setOrders(r.data));
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (uid, role) => {
    try {
      await api.patch(`/admin/users/${uid}/role?role=${role}`);
      toast.success("Role updated");
      load();
    } catch { toast.error("Failed"); }
  };

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="admin-dashboard">
      <h1 className="mb-2 font-heading text-3xl font-bold sm:text-4xl">Admin Panel</h1>
      <p className="mb-6 text-sm text-muted-foreground">Platform overview and management.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat icon={<Users className="h-4 w-4" />} label="Users" value={stats.users} />
        <Stat icon={<StoreIcon className="h-4 w-4" />} label="Stores" value={stats.stores} />
        <Stat icon={<Package className="h-4 w-4" />} label="Products" value={stats.products} />
        <Stat icon={<Wrench className="h-4 w-4" />} label="Services" value={stats.services} />
        <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={stats.orders} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={formatCurrency(stats.revenue, currency, lang)} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 font-heading font-bold">Monthly revenue</h3>
          <div className="h-64" data-testid="admin-revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <h3 className="mb-3 font-heading font-bold">Orders by status</h3>
          <div className="h-64" data-testid="admin-status-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.orders_by_status} dataKey="count" nameKey="status" innerRadius={45} outerRadius={80} label>
                  {stats.orders_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList data-testid="admin-tabs">
          <TabsTrigger value="users" data-testid="admin-tab-users">Users</TabsTrigger>
          <TabsTrigger value="orders" data-testid="admin-tab-orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Role</th><th className="p-2">Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-2 font-semibold">{u.name}</td>
                    <td className="p-2 text-muted-foreground">{u.email}</td>
                    <td className="p-2 capitalize">{u.role}</td>
                    <td className="p-2 text-center">
                      <select data-testid={`user-role-${u.id}`} value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                        <option value="customer">customer</option>
                        <option value="store_owner">store_owner</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="p-2 text-left">Order</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Total</th><th className="p-2">Date</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-2 font-semibold">#{o.id.slice(0, 8)}</td>
                    <td className="p-2 capitalize">{o.status}</td>
                    <td className="p-2 text-right">{formatCurrency(o.total, currency, lang)}</td>
                    <td className="p-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-1.5 font-heading text-xl font-extrabold">{value}</div>
    </div>
  );
}
