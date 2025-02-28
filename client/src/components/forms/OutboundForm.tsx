import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { StaffSelect } from "@/components/ui/staff-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OutboundFormProps {
  category: ProductCategory;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

interface ProductCheckResult {
  exists: boolean;
  message: string;
  existingProduct?: {
    category: string;
    typeName: string;
    status: string;
  };
}

export function OutboundForm({ category, onSubmit, isSubmitting = false }: OutboundFormProps) {
  const { toast } = useToast();
  const [productIdCheckResult, setProductIdCheckResult] = useState<{
    start: ProductCheckResult | null;
    end: ProductCheckResult | null;
  }>({
    start: null,
    end: null,
  });

  const formSchema = z.object({
    outboundDate: z.date(),
    staffId: z.number().min(1, "担当者を選択してください"),
    productIdStart: z.string().min(1, "製品IDを入力してください"),
    productIdEnd: z.string().min(1, "製品IDを入力してください"),
    customerNumber: z.string(),
    customerName: z.string(),
    purchaserNumber: z.string(),
    purchaserName: z.string(),
    notes: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outboundDate: new Date(),
      productIdStart: "",
      productIdEnd: "",
      customerNumber: "",
      customerName: "",
      purchaserNumber: "",
      purchaserName: "",
      notes: "",
    },
  });

  // 製品ID存在チェック
  const checkProductId = async (productId: string, type: 'start' | 'end') => {
    if (!productId) return;

    try {
      const response = await inventoryApi.checkProductId(category, productId);
      const { exists, message, existingProduct } = response.data;
      
      setProductIdCheckResult(prev => ({
        ...prev,
        [type]: { exists, message, existingProduct }
      }));
    } catch (error) {
      console.error("製品IDチェックエラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "製品IDの確認中にエラーが発生しました",
      });
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!productIdCheckResult.start?.exists || !productIdCheckResult.end?.exists) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "在庫に存在しない製品IDが含まれています",
        });
        return;
      }

      // 開始IDと終了IDの型番が一致しているか確認
      const startType = productIdCheckResult.start?.existingProduct?.typeName;
      const endType = productIdCheckResult.end?.existingProduct?.typeName;
      if (startType !== endType) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "開始IDと終了IDの型番が一致していません",
        });
        return;
      }

      // outboundDateをISO文字列に変換
      const formattedData = {
        ...data,
        outboundDate: data.outboundDate.toISOString().split('T')[0],
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error("出庫登録エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "出庫登録中にエラーが発生しました",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="outboundDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>出庫日</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "yyyy/MM/dd")
                      ) : (
                        <span>日付を選択</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>担当者</FormLabel>
              <div className="space-y-2">
                <FormControl>
                  <div className="relative">
                    <StaffSelect
                      value={field.value?.toString()}
                      onValueChange={(v) => field.onChange(Number(v))}
                    />
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="productIdStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>製品ID（開始）</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      checkProductId(e.target.value, 'start');
                    }}
                  />
                </FormControl>
                <FormMessage />
                {productIdCheckResult.start && (
                  <Alert variant={productIdCheckResult.start.exists ? "default" : "destructive"}>
                    <AlertDescription>
                      {productIdCheckResult.start.message}
                      {productIdCheckResult.start.exists && productIdCheckResult.start.existingProduct && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          型番: {productIdCheckResult.start.existingProduct.typeName}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productIdEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>製品ID（終了）</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      checkProductId(e.target.value, 'end');
                    }}
                  />
                </FormControl>
                <FormMessage />
                {productIdCheckResult.end && (
                  <Alert variant={productIdCheckResult.end.exists ? "default" : "destructive"}>
                    <AlertDescription>
                      {productIdCheckResult.end.message}
                      {productIdCheckResult.end.exists && productIdCheckResult.end.existingProduct && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          型番: {productIdCheckResult.end.existingProduct.typeName}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>納品先顧客番号</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>納品先</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaserNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>購入者顧客番号</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaserName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>購入者</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備考</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || !productIdCheckResult.start?.exists || !productIdCheckResult.end?.exists}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            "出庫登録"
          )}
        </Button>
      </form>
    </Form>
  );
}