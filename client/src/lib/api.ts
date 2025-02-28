import axios from 'axios';
import { ProductCategory } from "./constants";

export interface Staff {
    id: number;
    name: string;
    createdAt: string;
}

export interface ProductType {
    id: number;
    category: ProductCategory;
    name: string;
    createdAt: string;
}

export interface PCDetails {
    modelNumber: string;
    serialNumber: string;
    purchaseDate: string;
    warrantyPeriod?: number;
}

export interface VestDetails {
    type: 'DS' | 'thin' | 'thick';
    size: string;
    hasLogo: boolean;
}

export interface Product {
    id: number;
    productId: string;
    lotNumber?: string;
    inboundNumber: string;
    status: 'in_stock' | 'out_of_stock';
    createdAt: string;
    updatedAt: string;
    type: ProductType;
    pcDetails?: PCDetails;
    vestDetails?: VestDetails;
    staff?: {
        id: number;
        name: string;
    };
}

export interface InboundProduct {
    productId: string;
    typeId: number;
    lotNumber?: string;
    pcDetails?: {
        modelNumber: string;
        serialNumber: string;
        purchaseDate: string;
        warrantyPeriod?: number;
    };
}

export interface InboundRequest {
    products: InboundProduct[];
    staffId: number;
    inboundDate: string;
}

export interface OutboundRequest {
    productIdStart: string;
    productIdEnd: string;
    staffId: number;
    outboundDate: string;
    customerNumber?: string;
    customerName?: string;
    purchaserNumber?: string;
    purchaserName?: string;
    notes?: string;
}

export interface DashboardStats {
    totalProducts: number;
    byCategory: Record<string, number>;
    recentActivities: Array<{
        type: 'inbound' | 'outbound';
        date: string;
        productId: string;
        category: string;
        staffName: string;
    }>;
}

// APIクライアントのインスタンスを作成
export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 在庫管理API
export const inventoryApi = {
    checkProductId: (category: string, productId: string) =>
        api.get<{
            exists: boolean;
            message: string;
            existingProduct?: {
                category: string;
                typeName: string;
                status: string;
            };
        }>(`/inventory/${category}/check-product-id/${productId}`),
    getByCategory: (category: string) =>
        api.get<Product[]>(`/inventory/${category}`),
    inbound: (category: string, data: InboundRequest) =>
        api.post(`/inbound/${category}`, data),
    outbound: (category: string, data: OutboundRequest) =>
        api.post(`/outbound/${category}`, data),
    getInboundHistory: (category: string, all?: boolean) =>
        api.get(`/inbound/${category}/history${all ? '?all=true' : ''}`),
    getOutboundHistory: (category: string, all?: boolean) =>
        api.get(`/outbound/${category}/history${all ? '?all=true' : ''}`),
};

// スタッフAPI
export const staffApi = {
    getAll: () => api.get<Staff[]>('/staff'),
    create: (data: { name: string }) => api.post<Staff>('/staff', data),
    delete: (id: number) => api.delete(`/staff/${id}`),
};

// 製品タイプAPI
export const productTypesApi = {
    getByCategory: (category: string) =>
        api.get<ProductType[]>(`/product-types/${category}`),
};

// PC型番API
export const pcModelNumbersApi = {
    getAll: () => api.get<string[]>('/pc-model-numbers'),
    create: (data: { modelNumber: string }) =>
        api.post('/pc-model-numbers', data),
    delete: (modelNumber: string) =>
        api.delete(`/pc-model-numbers/${modelNumber}`),
};

// ダッシュボードAPI
export const dashboardApi = {
    getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

// ロット番号API
export const lotNumberApi = {
    getLatest: (category: string) =>
        api.get<{ lotNumber: string | null; message: string }>(
            `/latest-lot-number/${category}`
        ),
};