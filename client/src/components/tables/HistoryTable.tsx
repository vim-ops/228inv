import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductCategory } from "@/lib/constants";
import { format, isValid } from "date-fns";

interface HistoryTableProps {
  category?: ProductCategory;
  data: any[];
  type: "inbound" | "outbound";
}

export function HistoryTable({ category, data, type }: HistoryTableProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (!isValid(date)) return '-';
      return format(date, "yyyy/MM/dd");
    } catch (error) {
      console.error('日付のフォーマットエラー:', error);
      return '-';
    }
  };

  return (
    <Table>
      <TableHeader>
        {type === "inbound" ? (
          <TableRow>
            <TableHead>入庫管理番号</TableHead>
            <TableHead>日付</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>製品ID</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>ロット番号</TableHead>
            {category === 'pc' && (
              <>
                <TableHead>型番</TableHead>
                <TableHead>シリアル番号</TableHead>
                <TableHead>保証期間</TableHead>
                <TableHead>購入日</TableHead>
              </>
            )}
          </TableRow>
        ) : (
          <TableRow>
            <TableHead>出庫管理番号</TableHead>
            <TableHead>日付</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>製品ID</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>ロット番号</TableHead>
            <TableHead>納品先</TableHead>
            <TableHead>購入者</TableHead>
            <TableHead>備考</TableHead>
            {category === 'pc' && (
              <>
                <TableHead>型番</TableHead>
                <TableHead>シリアル番号</TableHead>
                <TableHead>保証期間</TableHead>
                <TableHead>購入日</TableHead>
              </>
            )}
          </TableRow>
        )}
      </TableHeader>
      <TableBody>
        {data.map((record) => (
          <TableRow key={record.id}>
            {type === "inbound" ? (
              <>
                <TableCell>{record.inboundNumber || '-'}</TableCell>
                <TableCell>{formatDate(record.inboundDate)}</TableCell>
                <TableCell>{record.staff?.name || '-'}</TableCell>
                <TableCell>{record.productId || '-'}</TableCell>
                <TableCell>{record.type?.name || '-'}</TableCell>
                <TableCell>{record.lotNumber || '-'}</TableCell>
                {category === 'pc' && record.pcDetails && (
                  <>
                    <TableCell>{record.pcDetails.modelNumber || '-'}</TableCell>
                    <TableCell>{record.pcDetails.serialNumber || '-'}</TableCell>
                    <TableCell>{record.pcDetails.warrantyPeriod ? `${record.pcDetails.warrantyPeriod}ヶ月` : '-'}</TableCell>
                    <TableCell>{formatDate(record.pcDetails.purchaseDate)}</TableCell>
                  </>
                )}
              </>
            ) : (
              <>
                <TableCell>{record.outboundNumber || '-'}</TableCell>
                <TableCell>{formatDate(record.outboundDate)}</TableCell>
                <TableCell>{record.staff?.name || '-'}</TableCell>
                <TableCell>{record.productId || '-'}</TableCell>
                <TableCell>{record.type?.name || '-'}</TableCell>
                <TableCell>{record.lotNumber || '-'}</TableCell>
                <TableCell>
                  {record.customerName ? 
                    `${record.customerNumber || ''} ${record.customerName}`.trim() : 
                    '-'
                  }
                </TableCell>
                <TableCell>
                  {record.purchaserName ? 
                    `${record.purchaserNumber || ''} ${record.purchaserName}`.trim() : 
                    '-'
                  }
                </TableCell>
                <TableCell>{record.notes || '-'}</TableCell>
                {category === 'pc' && record.pcDetails && (
                  <>
                    <TableCell>{record.pcDetails.modelNumber || '-'}</TableCell>
                    <TableCell>{record.pcDetails.serialNumber || '-'}</TableCell>
                    <TableCell>{record.pcDetails.warrantyPeriod ? `${record.pcDetails.warrantyPeriod}ヶ月` : '-'}</TableCell>
                    <TableCell>{formatDate(record.pcDetails.purchaseDate)}</TableCell>
                  </>
                )}
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}