import { useParams } from "wouter";
import { InboundForm } from "@/components/forms/InboundForm";
import ProductLayout from "@/components/ProductLayout";
import { useInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import type { ProductCategory } from "@/lib/constants";

export default function InboundPage() {
  const { product } = useParams<{ product: ProductCategory }>();
  const { inbound } = useInventory(product);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting inbound data:', data);

      await inbound.mutateAsync({
        category: product,
        products: data.products,
        staffId: data.staffId,
        inboundDate: data.inboundDate,
      });

      toast({
        title: "入庫完了",
        description: "製品の入庫処理が完了しました。",
      });
    } catch (error) {
      console.error('入庫処理エラー:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "入庫処理に失敗しました。",
      });
    }
  };

  return (
    <ProductLayout type="inbound" title="入庫登録">
      <div className="max-w-2xl mx-auto">
        <InboundForm category={product} onSubmit={handleSubmit} />
      </div>
    </ProductLayout>
  );
}