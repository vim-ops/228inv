import { ReactNode } from "react";
import { useParams } from "wouter";
import { SCREEN_COLORS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Package, Box, Heart, Shirt, Laptop } from "lucide-react";

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

interface ProductLayoutProps {
  children: ReactNode;
  type: keyof typeof SCREEN_COLORS;
  title: string;
}

export default function ProductLayout({
  children,
  type,
  title,
}: ProductLayoutProps) {
  const { product } = useParams();
  const Icon = product ? productIcons[product as keyof typeof productIcons] : null;
  const label = product ? productLabels[product as keyof typeof productLabels] : null;

  return (
    <div className={cn(
      "min-h-screen",
      SCREEN_COLORS[type],
      "relative overflow-hidden"
    )}>
      {/* Background Icon */}
      {Icon && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Icon className="w-96 h-96" />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center gap-2 mb-8">
          {Icon && <Icon className="h-6 w-6" />}
          <h1 className="text-2xl font-bold">
            {label && `${label} - `}{title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}