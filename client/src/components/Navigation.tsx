import { Link, useLocation } from "wouter";
import { PRODUCT_CATEGORIES, SCREEN_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Package, Box, Heart, Shirt, Laptop, LayoutDashboard, History } from "lucide-react";

const productIcons = {
  [PRODUCT_CATEGORIES.DEVICE]: Package,
  [PRODUCT_CATEGORIES.STATION]: Box,
  [PRODUCT_CATEGORIES.HEART_RATE]: Heart,
  [PRODUCT_CATEGORIES.VEST]: Shirt,
  [PRODUCT_CATEGORIES.PC]: Laptop,
} as const;

const productLabels = {
  [PRODUCT_CATEGORIES.DEVICE]: "デバイス",
  [PRODUCT_CATEGORIES.STATION]: "ステーション",
  [PRODUCT_CATEGORIES.HEART_RATE]: "心拍計",
  [PRODUCT_CATEGORIES.VEST]: "ベスト",
  [PRODUCT_CATEGORIES.PC]: "PC",
} as const;

const menuItems = [
  { path: "inbound", label: "入庫", color: SCREEN_COLORS.inbound },
  { path: "inventory", label: "在庫", color: SCREEN_COLORS.inventory },
  { path: "outbound", label: "出庫", color: SCREEN_COLORS.outbound },
  { path: "history", label: "履歴", color: "hover:bg-accent" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="min-h-screen w-64 bg-background border-r flex flex-col">
      <div className="p-4 space-y-2">
        <Link 
          to="/"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent w-full",
            location === "/" && "bg-accent"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>ダッシュボード</span>
        </Link>
        <Link 
          to="/history/all"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent w-full",
            location === "/history/all" && "bg-accent"
          )}
        >
          <History className="h-4 w-4" />
          <span>全履歴</span>
        </Link>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => {
          const Icon = productIcons[value];
          const label = productLabels[value];

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <div className="pl-6 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={`/${item.path}/${value}`}
                    className={cn(
                      "block px-4 py-2 text-sm rounded-md transition-colors",
                      location === `/${item.path}/${value}`
                        ? item.color
                        : "hover:bg-accent"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}