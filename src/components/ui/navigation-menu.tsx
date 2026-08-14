import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";
import { GridCard } from "@/components/ui/grid-card";
import { cn } from "@/lib/utils";

type NavItemType = {
  title: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group inline-flex h-9 w-max items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className="relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out md:absolute md:w-auto",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute left-0 top-full isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-background/95 text-popover-foreground shadow-xl backdrop-blur-xl transition-[width,height] duration-200 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-95 md:w-[var(--radix-navigation-menu-viewport-width)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex flex-col justify-center gap-1 rounded-sm px-4 py-2 text-sm outline-none transition-all hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function NavGridCard({
  link,
  ...props
}: React.ComponentProps<"div"> & {
  link: NavItemType;
}) {
  return (
    <NavigationMenuPrimitive.Link href={link.href} className="block h-full">
      <GridCard {...props}>
        {link.icon && <link.icon className="relative size-5 text-primary" />}
        <div className="relative">
          <span className="text-sm font-semibold text-foreground">{link.title}</span>
          {link.description && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{link.description}</p>
          )}
        </div>
      </GridCard>
    </NavigationMenuPrimitive.Link>
  );
}

function NavSmallItem({
  item,
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & {
  item: Omit<NavItemType, "description">;
}) {
  return (
    <NavigationMenuLink
      className={cn("group relative h-max flex-row items-center gap-x-3 px-2 py-2", className)}
      {...props}
    >
      {item.icon && <item.icon className="text-muted-foreground" />}
      <p>{item.title}</p>
      <div className="relative ml-auto flex h-full w-4 items-center">
        <ArrowRightIcon className="size-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
    </NavigationMenuLink>
  );
}

function NavLargeItem({
  link,
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & {
  link: NavItemType;
}) {
  return (
    <NavigationMenuLink
      className={cn("group relative flex flex-col justify-center border bg-background p-0", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-5 px-4 py-3">
        <div className="space-y-1">
          <span className="text-sm font-medium leading-none">{link.title}</span>
          {link.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{link.description}</p>
          )}
        </div>
        {link.icon && <link.icon className="size-5 text-muted-foreground" />}
      </div>
    </NavigationMenuLink>
  );
}

function NavItemMobile({
  item,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  item: NavItemType;
}) {
  return (
    <a
      className={cn(
        "group relative flex gap-x-3 rounded-sm p-2 text-sm outline-none transition-all hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
        {item.icon && <item.icon className="size-4 text-primary" />}
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <span className="line-clamp-1 text-xs leading-snug text-muted-foreground">
          {item.description}
        </span>
      </div>
    </a>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  NavItemMobile,
  type NavItemType,
};
