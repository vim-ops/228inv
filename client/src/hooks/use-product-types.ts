import { useQuery } from "@tanstack/react-query";
import { productTypesApi, type ProductType } from "@/lib/api";
import type { ProductCategory } from "@/lib/constants";

export const useProductTypes = (category?: ProductCategory) => {
  const { data: productTypes, isLoading } = useQuery({
    queryKey: ["/api/product-types", category],
    queryFn: async () => {
      if (!category) return [];
      const response = await productTypesApi.getByCategory(category);
      return response.data;
    },
    enabled: !!category,
  });

  return {
    productTypes: productTypes || [],
    isLoading,
  };
};