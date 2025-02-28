import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import type { ProductCategory } from "@/lib/constants";

export const useInventoryHistory = (category?: ProductCategory) => {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["outbound-history", category],
    queryFn: async () => {
      const response = await inventoryApi.getOutboundHistory(category || "");
      return response.data;
    },
    enabled: !!category,
  });

  return {
    history: Array.isArray(history) ? history : [],
    isLoading,
  };
};