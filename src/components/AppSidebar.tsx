import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, MenuIcon, PanelLeftClose, PanelLeftOpen, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { type NavItemType } from "@/components/ui/navigation-menu";
import { navSections } from "@/config/navigation";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "erp-finance:sidebar-collapsed";

function hrefToRoute(href: string) {
  return href.replace("#", "");
}

/** Which accordion group contains the active route, so it opens on load. */
function groupForRoute(route: string) {
  return navSections.find((section) => section.list.some((link) => hrefToRoute(link.href) === route))?.id;
}

type NavLinkProps = {
  item: NavItemType;
  active: boolean;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
};

function NavLink({ item, active, collapsed, onNavigate }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      {Icon && <Icon className="size-4 shrink-0" />}
      {!collapsed && <span className="truncate">{item.title}</span>}
    </a>
  );
}

type NavGroupProps = {
  id: string;
  name: string;
  list: NavItemType[];
  route: string;
  open: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
  onNavigate?: (() => void) | undefined;
};

function NavGroup({ id, name, list, route, open, collapsed, onToggle, onNavigate }: NavGroupProps) {
  // Collapsed to the icon rail there is no room for group headers, so every
  // item is shown flat and the groups are separated by a rule instead.
  if (collapsed) {
    return (
      <div className="space-y-0.5 border-b border-sidebar-border pb-2 last:border-b-0">
        {list.map((link) => (
          <NavLink
            key={link.href}
            item={link}
            active={hrefToRoute(link.href) === route}
            collapsed
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-section transition-colors hover:text-sidebar-muted"
      >
        {name}
        <ChevronDown className={cn("size-3 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {list.map((link) => (
            <NavLink
              key={link.href}
              item={link}
              active={hrefToRoute(link.href) === route}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <a href="#receber" className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <BarChart3 className="size-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-sidebar-foreground">ERP Finance</p>
          <p className="truncate text-[11px] text-sidebar-muted">Nortefin, Lda.</p>
        </div>
      )}
    </a>
  );
}

function NavTree({
  route,
  collapsed,
  onNavigate,
}: {
  route: string;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const activeGroup = useMemo(() => groupForRoute(route), [route]);
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    activeGroup ? [activeGroup] : [navSections[0]!.id],
  );

  // Reveal the group holding the active route when navigation happens elsewhere
  // (search, a link inside a page, the back button).
  useEffect(() => {
    if (activeGroup) {
      setOpenGroups((current) => (current.includes(activeGroup) ? current : [...current, activeGroup]));
    }
  }, [activeGroup]);

  const toggle = (id: string) =>
    setOpenGroups((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <nav className={cn("space-y-2", collapsed && "space-y-2")}>
      {navSections.map((section) => (
        <NavGroup
          key={section.id}
          id={section.id}
          name={section.name}
          list={section.list}
          route={route}
          open={openGroups.includes(section.id)}
          collapsed={collapsed}
          onToggle={toggle}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function AppSidebar({ route }: { route: string }) {
  const [collapsed, setCollapsed] = useState(
    () => globalThis.localStorage?.getItem(COLLAPSE_KEY) === "1",
  );

  useEffect(() => {
    globalThis.localStorage?.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[60px]" : "w-[232px]",
      )}
    >
      <div className={cn("flex h-14 items-center px-3", collapsed && "justify-center px-0")}>
        <Brand collapsed={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <NavTree route={route} collapsed={collapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ route }: { route: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Abrir menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" showClose={false} className="w-[260px] gap-0 bg-sidebar p-0">
        <div className="flex h-14 items-center justify-between px-3">
          <Brand collapsed={false} />
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Fechar menu"
              className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <XIcon />
            </Button>
          </SheetClose>
        </div>
        <div className="overflow-y-auto px-2 pb-8">
          <NavTree route={route} collapsed={false} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
