import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { useInventory } from "../../hooks/use-inventory";
import { useProductTypes } from "../../hooks/use-product-types";

const schema = z.object({
  productTypeId: z.string().min(1, "Product type is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  minQuantity: z.number().min(0, "Minimum quantity must be 0 or greater"),
  location: z.string().min(1, "Location is required"),
});

type FormData = z.infer<typeof schema>;

interface InventoryFormProps {
  item?: {
    id: string;
    productTypeId: string;
    name: string;
    description?: string;
    quantity: number;
    minQuantity: number;
    location: string;
  };
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  item,
  onSubmit,
  onCancel,
}) => {
  const { createInventoryItem, updateInventoryItem } = useInventory();
  const { productTypes } = useProductTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          ...item,
          quantity: Number(item.quantity),
          minQuantity: Number(item.minQuantity),
        }
      : {
          quantity: 0,
          minQuantity: 0,
        },
  });

  const onFormSubmit = async (data: FormData) => {
    if (item) {
      await updateInventoryItem({
        id: item.id,
        ...data,
      });
    } else {
      await createInventoryItem(data);
    }
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="productTypeId">Product Type</Label>
        <Select {...register("productTypeId")}>
          <option value="">Select a product type</option>
          {productTypes?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
        {errors.productTypeId && (
          <p className="text-sm text-red-500">{errors.productTypeId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          type="number"
          {...register("quantity", { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="minQuantity">Minimum Quantity</Label>
        <Input
          type="number"
          {...register("minQuantity", { valueAsNumber: true })}
        />
        {errors.minQuantity && (
          <p className="text-sm text-red-500">{errors.minQuantity.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input {...register("location")} />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{item ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}; 