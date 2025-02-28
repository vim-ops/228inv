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
import { useStaff } from "../../hooks/use-staff";

const schema = z.object({
  productId: z.string().min(1, "Product is required"),
  type: z.enum(["IN", "OUT"], {
    required_error: "Operation type is required",
  }),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  staffId: z.string().min(1, "Staff is required"),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface InventoryHistoryFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const InventoryHistoryForm: React.FC<InventoryHistoryFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { inventory } = useInventory();
  const { staff } = useStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    // TODO: Implement history creation
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="productId">Product</Label>
        <Select {...register("productId")}>
          <option value="">Select a product</option>
          {inventory?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        {errors.productId && (
          <p className="text-sm text-red-500">{errors.productId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="type">Operation Type</Label>
        <Select {...register("type")}>
          <option value="">Select an operation type</option>
          <option value="IN">In</option>
          <option value="OUT">Out</option>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
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
        <Label htmlFor="staffId">Staff</Label>
        <Select {...register("staffId")}>
          <option value="">Select a staff member</option>
          {staff?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
        {errors.staffId && (
          <p className="text-sm text-red-500">{errors.staffId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea {...register("note")} />
        {errors.note && (
          <p className="text-sm text-red-500">{errors.note.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
}; 