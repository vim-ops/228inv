import { useParams } from "wouter";
import { OutboundForm } from "@/components/forms/OutboundForm";
import ProductLayout from "@/components/ProductLayout";
import { useInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import type { ProductCategory } from "@/lib/constants";
import { AxiosError } from "axios";
import { z } from "zod";

// フォームのスキーマ定義
const formSchema = z.object({
  outboundDate: z.union([z.string(), z.date()]), // 文字列型とDate型の両方を許可
  staffId: z.number().min(1),
  productIdStart: z.string().min(1),
  productIdEnd: z.string().min(1),
  customerNumber: z.string(),
  customerName: z.string(),
  purchaserNumber: z.string(),
  purchaserName: z.string(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function OutboundPage() {
  const { product } = useParams<{ product: ProductCategory }>();
  const { outbound } = useInventory(product);
  const { toast } = useToast();

  const handleSubmit = async (data: FormData) => {
    try {
      // リクエストデータをログ出力
      // 日付を"2006-01-02"形式に変換
      const requestData = {
        category: product,
        ...data,
        // 日付が既に文字列の場合はそのまま使用し、Date型の場合のみ変換
        outboundDate: typeof data.outboundDate === 'string'
          ? data.outboundDate
          : data.outboundDate.toISOString().split('T')[0],
      };
      console.log('出庫リクエストデータ:', requestData);

      // 出庫処理実行
      const result = await outbound.mutateAsync(requestData);
      console.log('出庫処理結果:', result);

      toast({
        title: "出庫完了",
        description: "製品の出庫処理が完了しました。",
      });
    } catch (error) {
      console.error('出庫処理エラー:', error);
      
      // APIエラーの場合
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('APIエラー:', errorMessage);
        toast({
          variant: "destructive",
          title: "出庫エラー",
          description: errorMessage,
        });
        return;
      }
      
      // その他のエラーの場合
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
        toast({
          variant: "destructive",
          title: "エラー",
          description: error.message,
        });
        return;
      }
      
      // 未知のエラーの場合
      toast({
        variant: "destructive",
        title: "エラー",
        description: "出庫処理中に予期せぬエラーが発生しました。",
      });
    }
  };

  return (
    <ProductLayout type="outbound" title="出庫登録">
      <div className="max-w-2xl mx-auto">
        <OutboundForm 
          category={product} 
          onSubmit={handleSubmit}
          isSubmitting={outbound.isPending}
        />
      </div>
    </ProductLayout>
  );
}