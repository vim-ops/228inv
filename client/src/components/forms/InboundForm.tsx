import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus, Loader2, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PRODUCT_CATEGORIES,
  PC_WARRANTY_PERIODS,
  VEST_TYPES,
  VEST_SIZES,
  VEST_LOGOS,
} from "@/lib/constants";
import type { ProductCategory } from "@/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useStaff } from "@/hooks/use-staff";
import { useProductTypes } from "@/hooks/use-product-types";

interface InboundFormProps {
  category: ProductCategory;
  onSubmit: (data: { products: any[]; staffId: number; inboundDate: Date }) => Promise<void>;
}

export function InboundForm({ category, onSubmit }: InboundFormProps) {
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelNumber, setNewModelNumber] = useState("");
  const [modelNumberFilter, setModelNumberFilter] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [existingProducts, setExistingProducts] = useState<Record<string, { category: string; typeName: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { staff } = useStaff();
  const { productTypes } = useProductTypes(category);

  const { data: pcModelNumbers } = useQuery<{ id: number; modelNumber: string }[]>({
    queryKey: ["pc-model-numbers"],
    enabled: category === PRODUCT_CATEGORIES.PC,
  });

  const { data: latestLotNumber } = useQuery({
    queryKey: ["latest-lot-number", category],
    enabled: !!category,
  });

  const formSchema = z.object({
    inboundDate: z.date(),
    staffId: z.number(),
    typeId: z.number().min(1, "製品タイプを選択してください"),
    productIdStart: z.coerce.number(),
    productIdEnd: z.coerce.number(),
    lotNumber: category === PRODUCT_CATEGORIES.PC ? z.string().optional() : z.string(),
    purchaseDate: category === PRODUCT_CATEGORIES.PC ? z.date() : z.date().optional(),
    modelNumber: category === PRODUCT_CATEGORIES.PC ? z.string() : z.string().optional(),
    serialNumber: category === PRODUCT_CATEGORIES.PC ? z.string() : z.string().optional(),
    warrantyPeriod: category === PRODUCT_CATEGORIES.PC ? z.number() : z.number().optional(),
    vestType: category === PRODUCT_CATEGORIES.VEST ? z.string() : z.string().optional(),
    vestSize: category === PRODUCT_CATEGORIES.VEST ? z.string() : z.string().optional(),
    hasLogo: category === PRODUCT_CATEGORIES.VEST ? z.boolean() : z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inboundDate: new Date(),
      productIdStart: undefined,
      productIdEnd: undefined,
      lotNumber: "",
      ...(category === PRODUCT_CATEGORIES.PC ? {
        modelNumber: "",
        serialNumber: "",
        warrantyPeriod: 0,
        purchaseDate: new Date(),
      } : {}),
      ...(category === PRODUCT_CATEGORIES.VEST ? {
        vestType: "",
        vestSize: "",
        hasLogo: false,
      } : {}),
    },
  });

  const checkProductId = useCallback(async (productId: number) => {
    if (!productId) {
      setExistingIds([]);
      setExistingProducts({});
      return;
    }
    setIsChecking(true);
    try {
      const response = await fetch(`/api/inventory/${category}/check-product-id/${productId}`);
      if (!response.ok) {
        throw new Error('製品IDのチェックに失敗しました');
      }
      const data = await response.json();
      console.log('Product ID check response:', data);

      setExistingIds([]);
      setExistingProducts({});

      if (data.exists && data.existingProduct && data.existingProduct.status === "in_stock") {
        setExistingIds([productId.toString()]);
        setExistingProducts({
          [productId.toString()]: data.existingProduct
        });
      }
    } catch (error) {
      console.error('Product ID check error:', error);
      setExistingIds([]);
      setExistingProducts({});
    } finally {
      setIsChecking(false);
    }
  }, [category]);

  const checkProductIdRange = useCallback(async (startId: number, endId: number) => {
    if (!startId || !endId) {
      setExistingIds([]);
      setExistingProducts({});
      return;
    }
    setIsChecking(true);
    try {
      setExistingIds([]);
      setExistingProducts({});

      const idsToCheck = Array.from({ length: endId - startId + 1 }, (_, i) => startId + i);
      const existing = await Promise.all(
        idsToCheck.map(async id => {
          const response = await fetch(`/api/inventory/${category}/check-product-id/${id}`);
          if (!response.ok) {
            throw new Error(`製品ID ${id} のチェックに失敗しました`);
          }
          const data = await response.json();
          return {
            id,
            exists: data.exists && data.existingProduct?.status === "in_stock",
            existingProduct: data.existingProduct
          };
        })
      );

      const existingIds: string[] = [];
      const existingProductsMap: Record<string, { category: string; typeName: string }> = {};

      existing.forEach(item => {
        if (item.exists && item.existingProduct) {
          existingIds.push(item.id.toString());
          existingProductsMap[item.id.toString()] = item.existingProduct;
        }
      });

      if (existingIds.length > 0) {
        setExistingIds(existingIds);
        setExistingProducts(existingProductsMap);
      }
    } catch (error) {
      console.error('Product ID range check error:', error);
      setExistingIds([]);
      setExistingProducts({});
    } finally {
      setIsChecking(false);
    }
  }, [category]);

  const clearCheck = useCallback(() => {
    setExistingIds([]);
    setExistingProducts({});
  }, []);

  const addModelNumberMutation = useMutation({
    mutationFn: async (modelNumber: string) => {
      const res = await fetch("/api/pc-model-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelNumber }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pc-model-numbers"] });
      toast({
        title: "型番を追加しました",
        description: `${newModelNumber}を型番リストに追加しました。`,
      });
      setIsAddingModel(false);
      setNewModelNumber("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "型番の追加に失敗しました。",
      });
    },
  });

  const deleteModelNumberMutation = useMutation({
    mutationFn: async (modelNumber: string) => {
      const res = await fetch(`/api/pc-model-numbers/${modelNumber}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pc-model-numbers"] });
      toast({
        title: "型番を削除しました",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "型番の削除に失敗しました。",
      });
    },
  });

  const handleAddModelNumber = async () => {
    if (!newModelNumber.trim()) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "型番を入力してください。",
      });
      return;
    }

    addModelNumberMutation.mutate(newModelNumber);
  };

  const handleDeleteModelNumber = async (modelNumber: string) => {
    if (confirm(`型番 ${modelNumber} を削除してもよろしいですか？`)) {
      try {
        deleteModelNumberMutation.mutate(modelNumber);
      } catch (error) {
        console.error('型番削除エラー:', error);
        toast({
          variant: "destructive",
          title: "エラー",
          description: error instanceof Error ? error.message : "型番の削除に失敗しました。",
        });
      }
    }
  };

  const incrementEndId = () => {
    const currentEnd = form.watch("productIdEnd");
    if (currentEnd !== undefined) {
      form.setValue("productIdEnd", currentEnd + 1);
    }
  };

  const decrementEndId = () => {
    const currentEnd = form.watch("productIdEnd");
    const startId = form.watch("productIdStart");
    if (currentEnd !== undefined && startId !== undefined && currentEnd > startId) {
      form.setValue("productIdEnd", currentEnd - 1);
    }
  };

  const filteredModelNumbers = useMemo(() => {
    if (!pcModelNumbers) return [];
    if (!modelNumberFilter) return pcModelNumbers;

    return pcModelNumbers.filter((model) =>
      model.modelNumber.toLowerCase().includes(modelNumberFilter.toLowerCase())
    );
  }, [pcModelNumbers, modelNumberFilter]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "productIdStart") {
        const startId = form.getValues("productIdStart");
        const endId = form.getValues("productIdEnd");

        if (startId) {
          if (endId) {
            checkProductIdRange(startId, endId);
          } else {
            checkProductId(startId);
          }
        }
      } else if (name === "productIdEnd") {
        const startId = form.getValues("productIdStart");
        const endId = form.getValues("productIdEnd");

        if (startId && endId) {
          checkProductIdRange(startId, endId);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkProductId, checkProductIdRange]);

  useEffect(() => {
    form.reset({
      inboundDate: new Date(),
      productIdStart: undefined,
      productIdEnd: undefined,
      lotNumber: "",
      ...(category === PRODUCT_CATEGORIES.PC ? {
        modelNumber: "",
        serialNumber: "",
        warrantyPeriod: 0,
        purchaseDate: new Date(),
      } : {}),
      ...(category === PRODUCT_CATEGORIES.VEST ? {
        vestType: "",
        vestSize: "",
        hasLogo: false,
      } : {}),
    });
    clearCheck();
  }, [category, form, clearCheck]);

  const productCount = form.watch("productIdEnd") - form.watch("productIdStart") + 1 || 0;

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      if (!formData.staffId || !formData.typeId) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "担当者と製品タイプを選択してください。",
        });
        return;
      }

      // リクエストデータをログ出力
      console.log('入庫フォームデータ:', formData);

      const products = Array.from(
        { length: formData.productIdEnd - formData.productIdStart + 1 },
        (_, i) => ({
          productId: (formData.productIdStart + i).toString(),
          typeId: formData.typeId, // 製品タイプIDを設定
          lotNumber: formData.lotNumber,
          ...(category === PRODUCT_CATEGORIES.PC
            ? {
              pcDetails: {
                modelNumber: formData.modelNumber,
                serialNumber: `${formData.serialNumber}-${i + 1}`,
                purchaseDate: formData.purchaseDate,
                warrantyPeriod: formData.warrantyPeriod,
              },
            }
            : {}),
          ...(category === PRODUCT_CATEGORIES.VEST
            ? {
              vestDetails: {
                type: formData.vestType,
                size: formData.vestSize,
                hasLogo: formData.hasLogo,
              },
            }
            : {}),
        })
      );

      // リクエストデータをログ出力
      console.log('入庫リクエストデータ:', {
        products,
        staffId: formData.staffId,
        inboundDate: formData.inboundDate,
      });

      await onSubmit({
        products,
        staffId: formData.staffId,
        inboundDate: formData.inboundDate,
      });

      form.reset({
        inboundDate: new Date(),
        productIdStart: undefined,
        productIdEnd: undefined,
        lotNumber: "",
        ...(category === PRODUCT_CATEGORIES.PC ? {
          modelNumber: "",
          serialNumber: "",
          warrantyPeriod: 0,
          purchaseDate: new Date(),
        } : {}),
        ...(category === PRODUCT_CATEGORIES.VEST ? {
          vestType: "",
          vestSize: "",
          hasLogo: false,
        } : {}),
      });
      clearCheck();

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="inboundDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>入庫日</FormLabel>
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

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>製品タイプ</FormLabel>
              <FormControl>
                <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="製品タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
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
                  <div className="relative">
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        field.onChange(value);
                      }}
                    />
                    {isChecking && (
                      <div className="absolute right-2 top-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </FormControl>
                {existingIds.includes(field.value?.toString() || "") && existingProducts[field.value?.toString()] && (
                  <p className="text-sm text-red-500">
                    {`${existingProducts[field.value?.toString()].category} (${existingProducts[field.value?.toString()].typeName}) の在庫にその製品IDが存在します`}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productIdEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>製品ID（終了）</FormLabel>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={incrementEndId}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={decrementEndId}
                      disabled={form.watch("productIdEnd") === form.watch("productIdStart")}
                    >
                      -
                    </Button>
                  </div>
                </div>
                {existingIds.includes(field.value?.toString() || "") && existingProducts[field.value?.toString()] && (
                  <p className="text-sm text-red-500">
                    {`${existingProducts[field.value?.toString()].category} (${existingProducts[field.value?.toString()].typeName}) の在庫にその製品IDが存在します`}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {existingIds.length > 0 && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-800">
              以下の製品IDは既に在庫に存在するため、入庫できません：
              {existingIds.map(id => (
                `${id} (${existingProducts[id].category} - ${existingProducts[id].typeName})`
              )).join(", ")}
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            入庫数: {productCount > 0 ? productCount : 0} 個
          </p>
        </div>

        <FormField
          control={form.control}
          name="lotNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ロット番号</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              {latestLotNumber?.message && (
                <p className="text-sm text-blue-600">
                  {latestLotNumber.message}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {category === PRODUCT_CATEGORIES.PC && (
          <>
            <FormField
              control={form.control}
              name="modelNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>型番</FormLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="型番を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredModelNumbers.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between px-2 py-1.5"
                            >
                              <SelectItem
                                value={model.modelNumber}
                                className="flex-1"
                              >
                                {model.modelNumber}
                              </SelectItem>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteModelNumber(model.modelNumber);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={isAddingModel} onOpenChange={setIsAddingModel}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-2 flex items-center justify-start"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            新規型番を追加
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>新規型番の追加</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="newModelNumber">型番</Label>
                              <Input
                                id="newModelNumber"
                                value={newModelNumber}
                                onChange={(e) => setNewModelNumber(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddModelNumber}>追加</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Input
                      placeholder="型番入力"
                      value={modelNumberFilter}
                      onChange={(e) => setModelNumberFilter(e.target.value)}
                      className="w-[200px]"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>シリアル番号</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>購入日</FormLabel>
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
              name="warrantyPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>保証期間</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="保証期間を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PC_WARRANTY_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value.toString()}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {category === PRODUCT_CATEGORIES.VEST && (
          <>
            <FormField
              control={form.control}
              name="vestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ベストタイプ</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="タイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VEST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vestSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サイズ</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="サイズを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VEST_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ロゴ</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "true")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ロゴの有無を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VEST_LOGOS.map((logo, index) => (
                        <SelectItem
                          key={logo}
                          value={index === 0 ? "true" : "false"}
                        >
                          {logo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" disabled={existingIds.length > 0 || isChecking}>入庫登録</Button>
      </form>
    </Form>
  );
}
