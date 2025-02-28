import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import type { ProductCategory } from "@/lib/constants";
import type { InboundRequest, OutboundRequest } from "@/lib/api";

export const useInventory = (category?: ProductCategory) => {
  const queryClient = useQueryClient();

  const { data: inventory, isLoading: isInventoryLoading } = useQuery({
    queryKey: ["inventory", category],
    queryFn: async () => {
      const response = await inventoryApi.getByCategory(category || "");
      return response.data;
    },
    enabled: !!category,
    staleTime: 0, // 常に最新データを取得
  });

  const { data: inboundHistory, isLoading: isInboundLoading } = useQuery({
    queryKey: ["inbound-history", category],
    queryFn: async () => {
      const response = await inventoryApi.getInboundHistory(category || "");
      return response.data;
    },
    enabled: !!category,
    staleTime: 0,
  });

  const { data: outboundHistory, isLoading: isOutboundLoading } = useQuery({
    queryKey: ["outbound-history", category],
    queryFn: async () => {
      const response = await inventoryApi.getOutboundHistory(category || "");
      return response.data;
    },
    enabled: !!category,
    staleTime: 0,
  });

  const checkProductId = useMutation({
    mutationFn: async (data: { category: string; productId: string }) => {
      const response = await inventoryApi.checkProductId(data.category, data.productId);
      return response.data;
    },
  });

  const inbound = useMutation({
    mutationFn: async (data: InboundRequest & { category: string }) => {
      const response = await inventoryApi.inbound(data.category, {
        products: data.products,
        staffId: data.staffId,
        inboundDate: data.inboundDate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", category] });
      queryClient.invalidateQueries({ queryKey: ["inbound-history", category] });
    },
  });

  const outbound = useMutation({
    mutationFn: async (data: OutboundRequest & { category: string }) => {
      try {
        // outboundDateが既にISO文字列形式であることを確認
        if (!(typeof data.outboundDate === 'string')) {
          throw new Error('出庫日付が正しい形式ではありません');
        }

        const response = await inventoryApi.outbound(data.category, {
          productIdStart: data.productIdStart,
          productIdEnd: data.productIdEnd,
          staffId: data.staffId,
          outboundDate: data.outboundDate,
          customerNumber: data.customerNumber,
          customerName: data.customerName,
          purchaserNumber: data.purchaserNumber,
          purchaserName: data.purchaserName,
          notes: data.notes,
        });
        return response.data;
      } catch (error) {
        // エラーを上位に伝播させる
        throw error;
      }
    },
    onSuccess: () => {
      // 即時にキャッシュを無効化して再取得を強制
      queryClient.invalidateQueries({
        queryKey: ["inventory", category],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["outbound-history", category],
        refetchType: "active",
      });
    },
  });

  return {
    inventory: Array.isArray(inventory) ? inventory : [],
    inboundHistory: Array.isArray(inboundHistory) ? inboundHistory : [],
    outboundHistory: Array.isArray(outboundHistory) ? outboundHistory : [],
    isLoading: isInventoryLoading || isInboundLoading || isOutboundLoading,
    checkProductId,
    inbound,
    outbound,
  };
};