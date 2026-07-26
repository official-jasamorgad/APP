import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Package, Calendar, Heart, Bell, Star, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { currency, lang } = useApp();
  const [stats, setStats] = useState({ orders: 0, bookings: 0, wishlist: 0 });
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get("/dashboard/customer").then((r) => setStats(r.data));
    api.get("/orders").then((r) => setOrders(r.data));
    api.get("/bookings").then((r) => setBookings(r.data));
    api.get("/wishlist").then((r) => setWishlist(r.data));
    api.get("/notifications").then((r) => setNotifs(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="customer-dashboard">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          {(user?.name || "?").slice(0, 1)}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Hi, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCard icon={<Package className="h-5 w-5" />} label="Orders" value={stats.orders} />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Bookings" value={stats.bookings} />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Wishlist" value={stats.wishlist} />
      </div>

      <Tabs defaultValue="orders">
        <TabsList data-testid="customer-tabs">
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
          <TabsTrigger value="wishlist" data-testid="tab-wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? <Empty text="No orders yet." /> : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} data-testid={`order-row-${o.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted">
                  <div>
                    <div className="text-sm font-bold">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.items.length} items</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(o.total, currency, lang)}</div>
                    <div className="text-xs capitalize text-primary">{o.status}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {bookings.length === 0 ? <Empty text="No bookings yet." /> : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <div className="text-sm font-bold">{b.service_name}</div>
                    <div className="text-xs text-muted-foreground">{b.date} at {b.time}</div>
                  </div>
                  <div className="rounded-full bg-muted px-2 py-1 text-xs font-semibold capitalize">{b.status}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-4">
          {wishlist.length === 0 ? <Empty text="Wishlist is empty." /> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {wishlist.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="overflow-hidden rounded-xl border border-border">
                  <img src={p.images?.[0]} alt="" className="aspect-square w-full object-cover" />
                  <div className="p-2 text-xs font-semibold">{p.name}</div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          {notifs.length === 0 ? <Empty text="No notifications." /> : (
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <Bell className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <div className="max-w-md space-y-2 rounded-xl border border-border p-5 text-sm">
            <Row label="Name" value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Phone" value={user?.phone || "—"} />
            <Row label="Role" value={user?.role} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-2 font-heading text-3xl font-extrabold">{value}</div>
    </div>
  );
}
function Empty({ text }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
