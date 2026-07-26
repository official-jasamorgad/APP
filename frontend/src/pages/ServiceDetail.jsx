import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/format";
import { Calendar as CalIcon, Clock, MapPin, Star, ChevronLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { currency, lang } = useApp();
  const [service, setService] = useState(null);
  const [store, setStore] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    api.get(`/services/${id}`).then((r) => {
      setService(r.data);
      api.get(`/stores/${r.data.store_id}`).then((s) => setStore(s.data)).catch(() => {});
    });
  }, [id]);

  if (!service) return <div className="mx-auto max-w-7xl p-8">Loading...</div>;

  const book = async () => {
    if (!user) {
      toast.error("Please sign in to book");
      nav("/login");
      return;
    }
    try {
      await api.post("/bookings", {
        service_id: service.id,
        date: format(date, "yyyy-MM-dd"),
        time,
        notes,
        photos: [],
      });
      toast.success("Booking submitted!");
      nav("/dashboard/customer");
    } catch (e) {
      toast.error("Failed to book");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="service-detail-page">
      <button onClick={() => nav(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted">
          <img src={service.images?.[0]} alt={service.name} className="h-80 w-full object-cover md:h-full" />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold text-foreground">{service.rating?.toFixed(1)}</span>
            <span>({service.review_count} reviews)</span>
          </div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">{service.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{service.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration_min} min</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {service.service_area}</span>
            <span>Technician: {service.technician}</span>
          </div>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Starts from</div>
            <div className="font-heading text-3xl font-extrabold text-primary">
              {formatCurrency(service.starting_price, currency, lang)}
            </div>
          </div>

          {store && (
            <Link to={`/stores/${store.id}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-3">
              <img src={store.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="text-sm font-bold">{store.name}</div>
                <div className="text-xs text-muted-foreground">{store.address}</div>
              </div>
              <a
                href={`https://wa.me/${store.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Link>
          )}
        </div>
      </div>

      {/* Booking */}
      <section className="mt-10 rounded-3xl border border-border p-6" data-testid="booking-section">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-2xl font-bold">
          <CalIcon className="h-5 w-5" /> Schedule your booking
        </h2>
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="rounded-2xl border border-border p-2" data-testid="booking-calendar">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time slot</label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    data-testid={`time-${t}`}
                    onClick={() => setTime(t)}
                    className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold ${
                      time === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
              <textarea
                data-testid="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm"
                placeholder="Additional details about your booking..."
              />
            </div>
            <button
              data-testid="book-now-btn"
              onClick={book}
              className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Book on {format(date, "EEE, MMM dd")} at {time}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
