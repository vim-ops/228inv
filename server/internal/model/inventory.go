package model

import "time"

type PCModelNumber struct {
    ID          int       `json:"id"`
    ModelNumber string    `json:"modelNumber"`
    CreatedAt   time.Time `json:"createdAt"`
}

type Staff struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"createdAt"`
}

type ProductType struct {
    ID        int       `json:"id"`
    Category  string    `json:"category"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"createdAt"`
}

type Product struct {
    ID            int       `json:"id"`
    ProductID     string    `json:"productId"`
    TypeID        int       `json:"typeId"`
    LotNumber     *string   `json:"lotNumber,omitempty"`
    InboundNumber string    `json:"inboundNumber"`
    Status        string    `json:"status"`
    CreatedAt     time.Time `json:"createdAt"`
    UpdatedAt     time.Time `json:"updatedAt"`
    Type          *ProductType `json:"type,omitempty"`
    PCDetails     *PCDetails  `json:"pcDetails,omitempty"`
    VestDetails   *VestDetails `json:"vestDetails,omitempty"`
}

type PCDetails struct {
    ID            int       `json:"id"`
    ProductID     string    `json:"productId"`
    ModelNumber   string    `json:"modelNumber"`
    SerialNumber  string    `json:"serialNumber"`
    PurchaseDate  time.Time `json:"purchaseDate"`
    WarrantyPeriod *int     `json:"warrantyPeriod,omitempty"`
}

type VestDetails struct {
    ID        int     `json:"id"`
    ProductID string  `json:"productId"`
    Type      string  `json:"type"`
    Size      string  `json:"size"`
    HasLogo   bool    `json:"hasLogo"`
}

type OutboundRecord struct {
    ID              int       `json:"id"`
    ProductID       string    `json:"productId"`
    StaffID         int       `json:"staffId"`
    OutboundNumber  string    `json:"outboundNumber"`
    CustomerNumber  *string   `json:"customerNumber,omitempty"`
    CustomerName    *string   `json:"customerName,omitempty"`
    PurchaserNumber *string   `json:"purchaserNumber,omitempty"`
    PurchaserName   *string   `json:"purchaserName,omitempty"`
    Notes           *string   `json:"notes,omitempty"`
    OutboundDate    time.Time `json:"outboundDate"`
    Product         *Product  `json:"product,omitempty"`
    Staff           *Staff    `json:"staff,omitempty"`
}

type InboundRecord struct {
    ID            int       `json:"id"`
    ProductID     string    `json:"productId"`
    StaffID       int       `json:"staffId"`
    InboundNumber string    `json:"inboundNumber"`
    InboundDate   time.Time `json:"inboundDate"`
    Product       *Product  `json:"product,omitempty"`
    Staff         *Staff    `json:"staff,omitempty"`
}

// Request/Response structures
type CheckProductIDResponse struct {
    Exists          bool   `json:"exists"`
    ExistingProduct *struct {
        Category string `json:"category"`
        TypeName string `json:"typeName"`
        Status   string `json:"status"`
    } `json:"existingProduct,omitempty"`
}

type InboundRequest struct {
    Products    []struct {
        ProductID  string     `json:"productId"`
        TypeID    int        `json:"typeId"`
        LotNumber  *string    `json:"lotNumber,omitempty"`
        PCDetails *struct {
            ModelNumber    string    `json:"modelNumber"`
            SerialNumber   string    `json:"serialNumber"`
            PurchaseDate   time.Time `json:"purchaseDate"`
            WarrantyPeriod *int      `json:"warrantyPeriod,omitempty"`
        } `json:"pcDetails,omitempty"`
    } `json:"products"`
    StaffID     int       `json:"staffId"`
    InboundDate time.Time `json:"inboundDate"`
}

type OutboundRequest struct {
    ProductIDStart   string    `json:"productIdStart"`
    ProductIDEnd     string    `json:"productIdEnd"`
    StaffID         int       `json:"staffId"`
    OutboundDate    time.Time `json:"outboundDate"`
    CustomerNumber  *string   `json:"customerNumber,omitempty"`
    CustomerName    *string   `json:"customerName,omitempty"`
    PurchaserNumber *string   `json:"purchaserNumber,omitempty"`
    PurchaserName   *string   `json:"purchaserName,omitempty"`
    Notes           *string   `json:"notes,omitempty"`
}

type DashboardStats struct {
    TotalProducts    int            `json:"totalProducts"`
    ByCategory      map[string]int `json:"byCategory"`
    RecentActivities []struct {
        Type      string    `json:"type"`
        Date      time.Time `json:"date"`
        ProductID string    `json:"productId"`
        Category  string    `json:"category"`
        StaffName string    `json:"staffName"`
    } `json:"recentActivities"`
}