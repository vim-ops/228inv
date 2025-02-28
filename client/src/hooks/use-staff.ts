import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Staff, staffApi } from "@/lib/api";
import { useToast } from "./use-toast";

export const useStaff = () => {
  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      console.log("[useStaff] スタッフ一覧を取得中...");
      const response = await staffApi.getAll();
      console.log("[useStaff] スタッフ一覧:", response.data);
      return response.data;
    },
    initialData: [],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addStaffMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log("[useStaff] スタッフを追加中...", name);
      const response = await staffApi.create({ name });
      console.log("[useStaff] 追加完了:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "担当者を追加しました",
        description: `${data.name}を担当者リストに追加しました。`,
      });
    },
    onError: (error) => {
      console.error("[useStaff] 追加エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "担当者の追加に失敗しました。",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("[useStaff] スタッフを削除中...", id);
      await staffApi.delete(id);
      console.log("[useStaff] 削除完了");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "担当者を削除しました",
        description: "担当者リストから削除しました。",
      });
    },
    onError: (error) => {
      console.error("[useStaff] 削除エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "担当者の削除に失敗しました。",
      });
    },
  });

  const handleDeleteStaff = async (id: number) => {
    if (window.confirm("この担当者を削除してもよろしいですか？")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleAddStaff = async (name: string) => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "担当者名を入力してください。",
      });
      return;
    }

    addStaffMutation.mutate(name);
  };

  return {
    staff: staff || [],
    isLoading,
    addStaff: handleAddStaff,
    deleteStaff: handleDeleteStaff,
  };
};