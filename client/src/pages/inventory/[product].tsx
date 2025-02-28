import { useParams } from "wouter";
import { InventoryTable } from "@/components/tables/InventoryTable";
import ProductLayout from "@/components/ProductLayout";
import { useInventory } from "@/hooks/use-inventory";
import type { ProductCategory } from "@/lib/constants";

export default function InventoryPage() {
  const { product } = useParams<{ product: ProductCategory }>();
  const { inventory, isLoading } = useInventory(product);

  return (
    <ProductLayout type="inventory" title="在庫一覧">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <InventoryTable category={product} data={inventory || []} />
      )}
    </ProductLayout>
  );
}
