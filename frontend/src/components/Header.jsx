import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { tr } from "@/lib/i18n";
import { Search, ShoppingCart, Sun, Moon, User, LogOut, Menu, X, Store, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const { lang, setLang, currency, setCurrency } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const t = (k) => tr(lang, k);
  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const dashboardHref =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "store_owner"
      ? "/dashboard/store"
      : "/dashboard/customer";

  return (
    <header className="sticky top-0 z-40 glass" data-testid="site-header">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[2px] shadow-[0_4px_20px_-4px_rgba(217,119,6,0.5)] ring-1 ring-amber-500/40">
            <div className="grid h-full w-full place-items-center rounded-[14px] bg-neutral-900">
              <img
                src="/logo.png"
                alt="JASAMORGAD"
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
                style={{ imageRendering: "auto", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4)) contrast(1.15) saturate(1.2)" }}
              />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-black tracking-tight bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">{t("brand.name")}</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:block">
              Multi Services
            </span>
          </div>
        </Link>

        <form onSubmit={onSearch} className="ml-6 hidden flex-1 md:block" data-testid="header-search-form">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              data-testid="header-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-full border border-border bg-background/60 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-background"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavItem to="/products" testid="nav-products">{t("nav.products")}</NavItem>
          <NavItem to="/services" testid="nav-services">{t("nav.services")}</NavItem>
          <NavItem to="/digital" testid="nav-digital">Digital</NavItem>
          <NavItem to="/stores" testid="nav-stores">{t("nav.stores")}</NavItem>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="lang-currency-btn"
                className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted sm:block"
              >
                {lang.toUpperCase()} · {currency}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuItem data-testid="lang-id" onClick={() => setLang("id")}>Indonesian</DropdownMenuItem>
              <DropdownMenuItem data-testid="lang-en" onClick={() => setLang("en")}>English</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Currency</DropdownMenuLabel>
              <DropdownMenuItem data-testid="cur-idr" onClick={() => setCurrency("IDR")}>IDR (Rupiah)</DropdownMenuItem>
              <DropdownMenuItem data-testid="cur-usd" onClick={() => setCurrency("USD")}>USD</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            data-testid="theme-toggle"
            onClick={toggle}
            className="rounded-full border border-border p-2 transition-colors hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            to="/cart"
            data-testid="header-cart-link"
            className="relative rounded-full border border-border p-2 transition-colors hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span
                data-testid="cart-count-badge"
                className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground"
              >
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-menu-btn"
                  className="ml-1 flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted"
                >
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {(user.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden text-xs font-medium sm:block">{user.name?.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={dashboardHref} data-testid="menu-dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                {user.role === "store_owner" && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/store" data-testid="menu-store">
                      <Store className="mr-2 h-4 w-4" /> My Store
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="nav-login"
                className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted sm:block"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                data-testid="nav-register"
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                {t("nav.register")}
              </Link>
            </>
          )}

          <button
            className="ml-1 rounded-full border border-border p-2 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            data-testid="mobile-menu-btn"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden" data-testid="mobile-menu">
          <form onSubmit={onSearch} className="mb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm"
              />
            </div>
          </form>
          <div className="flex flex-col divide-y divide-border">
            <Link to="/products" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Products</Link>
            <Link to="/services" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Services</Link>
            <Link to="/stores" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Stores</Link>
            {user && <Link to={dashboardHref} className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, children, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      className={({ isActive }) =>
        `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
