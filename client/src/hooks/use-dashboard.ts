import { useQuery } from "@tanstack/react-query";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

interface DashboardStats {
  totalProducts: number;
  byCategory: Record<string, number>;
  recentActivities: {
    type: "inbound" | "outbound";
    date: string;
    productId: string;
    category: string;
    staffName: string;
  }[];
}

export function useDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const stockLevels = Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => ({
    name: key,
    value: stats?.byCategory[value] || 0,
  }));

  return {
    stats,
    stockLevels,
    isLoading,
  };
}
