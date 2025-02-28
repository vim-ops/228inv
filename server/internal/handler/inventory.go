package handler

import (
    "database/sql"
    "fmt"
    "net/http"
    "time"
    "log"
    "github.com/gin-gonic/gin"
    "inventory-tracker/server/internal/db"
    "inventory-tracker/server/internal/model"
)

// 製品ID存在チェックハンドラー
func CheckProductID(c *gin.Context) {
    category := c.Param("category")
    productID := c.Param("productId")
// 製品の存在、在庫状態、型番を確認
var exists bool
var typeName string
var status string
err := db.DB.QueryRow(`
    SELECT
        CASE WHEN p.id IS NOT NULL THEN true ELSE false END as exists,
        COALESCE(pt.name, '') as type_name,
        COALESCE(p.status, '') as status
    FROM (SELECT 1) as dummy
    LEFT JOIN products p ON p.product_id = $1
    LEFT JOIN product_types pt ON p.type_id = pt.id AND pt.category = $2
`, productID, category).Scan(&exists, &typeName, &status)

if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
}

var message string
if !exists {
    message = "その製品IDは存在しません"
} else if status != "in_stock" {
    message = "その製品IDは既に出庫済みです"
} else if typeName == "" {
    message = "その製品IDは異なる製品カテゴリに属しています"
} else {
    message = fmt.Sprintf("その製品ID（%s）は在庫に存在します", typeName)
}

c.JSON(http.StatusOK, gin.H{
    "exists": exists && status == "in_stock" && typeName != "",
    "message": message,
    "existingProduct": gin.H{
        "category": category,
        "typeName": typeName,
        "status": status,
    },
})
}

// 入庫処理ハンドラー
func HandleInbound(c *gin.Context) {
    category := c.Param("category")
    var req model.InboundRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "無効なリクエストデータです"})
        return
    }

    // トランザクション開始
    tx, err := db.BeginTx()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクション開始エラー"})
        return
    }
    defer tx.Rollback()

    // 入庫番号の生成
    today := time.Now().Format("20060102")
    var lastSeq int
    err = tx.QueryRow(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(inbound_number FROM 10) AS INTEGER)), 0)
        FROM inbound_records
        WHERE inbound_number LIKE $1
    `, today+"-%").Scan(&lastSeq)
    if err != nil && err != sql.ErrNoRows {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "入庫番号生成エラー"})
        return
    }

    inboundNumber := fmt.Sprintf("%s-%04d", today, lastSeq+1)

    // 製品の登録と入庫記録の作成
    for _, p := range req.Products {
        // 製品の登録
        var productID string
        err = tx.QueryRow(`
            INSERT INTO products (product_id, type_id, lot_number, inbound_number, status)
            VALUES ($1, $2, $3, $4, 'in_stock')
            RETURNING product_id
        `, p.ProductID, p.TypeID, p.LotNumber, inboundNumber).Scan(&productID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("製品登録エラー: %v", err)})
            return
        }

        // PCの場合、詳細情報も登録
        if category == "pc" && p.PCDetails != nil {
            _, err = tx.Exec(`
                INSERT INTO pc_details (product_id, model_number, serial_number, purchase_date, warranty_period)
                VALUES ($1, $2, $3, $4, $5)
            `, productID, p.PCDetails.ModelNumber, p.PCDetails.SerialNumber,
                p.PCDetails.PurchaseDate, p.PCDetails.WarrantyPeriod)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("PC詳細情報登録エラー: %v", err)})
                return
            }
        }

        // 入庫記録の作成
        _, err = tx.Exec(`
            INSERT INTO inbound_records (product_id, staff_id, inbound_number, inbound_date)
            VALUES ($1, $2, $3, $4)
        `, productID, req.StaffID, inboundNumber, req.InboundDate)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("入庫記録作成エラー: %v", err)})
            return
        }
    }

    // トランザクションのコミット
    if err := tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションコミットエラー"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "inboundNumber": inboundNumber,
    })
}

// 出庫処理ハンドラー
func HandleOutbound(c *gin.Context) {
    category := c.Param("category")
    log.Printf("出庫処理開始: カテゴリ = %s", category)

    // リクエストデータのバインド
    var req struct {
        ProductIDStart   string    `json:"productIdStart"`
        ProductIDEnd     string    `json:"productIdEnd"`
        StaffID         int       `json:"staffId"`
        OutboundDate    string    `json:"outboundDate"`
        CustomerNumber  *string   `json:"customerNumber,omitempty"`
        CustomerName    *string   `json:"customerName,omitempty"`
        PurchaserNumber *string   `json:"purchaserNumber,omitempty"`
        PurchaserName   *string   `json:"purchaserName,omitempty"`
        Notes           *string   `json:"notes,omitempty"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        log.Printf("リクエストデータバインドエラー: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "無効なリクエストデータです"})
        return
    }

    log.Printf("リクエストデータ: %+v", req)

    // 日付文字列をtime.Time型に変換
    outboundDate, err := time.Parse("2006-01-02", req.OutboundDate)
    if err != nil {
        log.Printf("日付パースエラー: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "無効な日付フォーマットです"})
        return
    }

    // トランザクション開始
    tx, err := db.BeginTx()
    if err != nil {
        log.Printf("トランザクション開始エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションの開始に失敗しました"})
        return
    }
    defer tx.Rollback()

    // 出庫番号の生成
    today := time.Now().Format("20060102")
    var lastSeq int
    err = tx.QueryRow(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(outbound_number FROM 10) AS INTEGER)), 0)
        FROM outbound_records
        WHERE outbound_number LIKE $1
    `, today+"-%").Scan(&lastSeq)
    if err != nil && err != sql.ErrNoRows {
        log.Printf("出庫番号生成エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "出庫番号生成エラー"})
        return
    }

    outboundNumber := fmt.Sprintf("%s-%04d", today, lastSeq+1)
    log.Printf("生成された出庫番号: %s", outboundNumber)

    // 開始IDと終了IDの型番を取得して一致を確認
    var startTypeID, endTypeID int
    var startTypeName, endTypeName string

    // 開始IDの型番取得
    err = tx.QueryRow(`
        SELECT p.type_id, pt.name
        FROM products p
        INNER JOIN product_types pt ON p.type_id = pt.id
        WHERE p.product_id = $1
        AND pt.category = $2
        AND p.status = 'in_stock'
    `, req.ProductIDStart, category).Scan(&startTypeID, &startTypeName)
    if err != nil {
        if err == sql.ErrNoRows {
            log.Printf("開始製品ID %s は在庫に存在しないか、既に出庫済みです", req.ProductIDStart)
            c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("開始製品ID %s は在庫に存在しないか、既に出庫済みです", req.ProductIDStart)})
            return
        }
        log.Printf("開始ID型番取得エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "開始IDの型番取得に失敗しました"})
        return
    }

    // 終了IDの型番取得
    err = tx.QueryRow(`
        SELECT p.type_id, pt.name
        FROM products p
        INNER JOIN product_types pt ON p.type_id = pt.id
        WHERE p.product_id = $1
        AND pt.category = $2
        AND p.status = 'in_stock'
    `, req.ProductIDEnd, category).Scan(&endTypeID, &endTypeName)
    if err != nil {
        if err == sql.ErrNoRows {
            log.Printf("終了製品ID %s は在庫に存在しないか、既に出庫済みです", req.ProductIDEnd)
            c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("終了製品ID %s は在庫に存在しないか、既に出庫済みです", req.ProductIDEnd)})
            return
        }
        log.Printf("終了ID型番取得エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "終了IDの型番取得に失敗しました"})
        return
    }

    // 型番の一致を確認
    if startTypeID != endTypeID {
        log.Printf("型番が一致しません: 開始ID=%s（%s）, 終了ID=%s（%s）",
            req.ProductIDStart, startTypeName, req.ProductIDEnd, endTypeName)
        c.JSON(http.StatusBadRequest, gin.H{
            "error": fmt.Sprintf("開始IDと終了IDの型番が一致しません（開始ID: %s, 終了ID: %s）", startTypeName, endTypeName),
        })
        return
    }

    // 対象製品の取得と更新をメインのトランザクション内で実行
    var processedProducts []string
    rows, err := tx.Query(`
        UPDATE products p
        SET status = 'out_of_stock'
        FROM product_types pt
        WHERE p.type_id = pt.id
        AND p.product_id >= $1
        AND p.product_id <= $2
        AND p.status = 'in_stock'
        AND pt.category = $3
        AND pt.id = $4
        RETURNING p.product_id
    `, req.ProductIDStart, req.ProductIDEnd, category, startTypeID)
    if err != nil {
        log.Printf("製品更新エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "製品の更新に失敗しました"})
        return
    }
    defer rows.Close()

    // 更新された製品IDを収集
    for rows.Next() {
        var productID string
        if err := rows.Scan(&productID); err != nil {
            log.Printf("製品データ読み取りエラー: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "製品データの読み取りに失敗しました"})
            return
        }
        processedProducts = append(processedProducts, productID)
    }

    // 出庫記録の一括作成
    if len(processedProducts) > 0 {
        stmt, err := tx.Prepare(`
            INSERT INTO outbound_records (
                product_id, staff_id, outbound_number, outbound_date,
                customer_number, customer_name, purchaser_number, purchaser_name, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `)
        if err != nil {
            log.Printf("ステートメント準備エラー: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "出庫記録の準備に失敗しました"})
            return
        }
        defer stmt.Close()

        for _, productID := range processedProducts {
            _, err = stmt.Exec(
                productID, req.StaffID, outboundNumber, outboundDate,
                req.CustomerNumber, req.CustomerName, req.PurchaserNumber, req.PurchaserName, req.Notes,
            )
            if err != nil {
                log.Printf("出庫記録作成エラー: %v", err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("出庫記録の作成に失敗しました: %v", err)})
                return
            }
        }
    }

    if len(processedProducts) == 0 {
        log.Printf("対象製品が見つかりません: %s から %s", req.ProductIDStart, req.ProductIDEnd)
        c.JSON(http.StatusNotFound, gin.H{"error": "指定された範囲の製品が見つかりません"})
        return
    }

    // トランザクションのコミット
    if err := tx.Commit(); err != nil {
        log.Printf("トランザクションコミットエラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションのコミットに失敗しました"})
        return
    }

    log.Printf("出庫処理が完了しました。処理された製品: %v", processedProducts)
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "outboundNumber": outboundNumber,
        "processedCount": len(processedProducts),
        "products": processedProducts,
    })
}

// 在庫一覧取得ハンドラー
func GetInventory(c *gin.Context) {
    category := c.Param("category")

    query := `
        WITH latest_products AS (
            SELECT DISTINCT ON (p.product_id) 
                p.id, p.product_id, p.type_id, p.lot_number, p.inbound_number,
                p.status, p.created_at, p.updated_at,
                pt.id as type_id, pt.category, pt.name as type_name,
                pc.model_number, pc.serial_number, pc.purchase_date, pc.warranty_period,
                s.id as staff_id, s.name as staff_name
            FROM products p
            INNER JOIN product_types pt ON p.type_id = pt.id
            LEFT JOIN pc_details pc ON p.product_id = pc.product_id
            LEFT JOIN inbound_records ir ON p.product_id = ir.product_id
            LEFT JOIN staff s ON ir.staff_id = s.id
            WHERE pt.category = $1
            ORDER BY p.product_id, p.created_at DESC
        )
        SELECT * FROM latest_products
        ORDER BY created_at DESC
    `

    rows, err := db.DB.Query(query, category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("在庫データの取得に失敗しました: %v", err)})
        return
    }
    defer rows.Close()

    var products []gin.H
    for rows.Next() {
        var p struct {
            ID            int
            ProductID     string
            TypeID       int
            LotNumber    sql.NullString
            InboundNumber string
            Status       string
            CreatedAt    time.Time
            UpdatedAt    time.Time
            TypeID2      int
            Category     string
            TypeName     string
            ModelNumber  sql.NullString
            SerialNumber sql.NullString
            PurchaseDate sql.NullTime
            WarrantyPeriod sql.NullInt32
            StaffID      sql.NullInt32
            StaffName    sql.NullString
        }

        err := rows.Scan(
            &p.ID, &p.ProductID, &p.TypeID, &p.LotNumber, &p.InboundNumber,
            &p.Status, &p.CreatedAt, &p.UpdatedAt,
            &p.TypeID2, &p.Category, &p.TypeName,
            &p.ModelNumber, &p.SerialNumber, &p.PurchaseDate, &p.WarrantyPeriod,
            &p.StaffID, &p.StaffName,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("データの読み取りに失敗しました: %v", err)})
            return
        }

        product := gin.H{
            "id":            p.ID,
            "productId":     p.ProductID,
            "lotNumber":     p.LotNumber.String,
            "inboundNumber": p.InboundNumber,
            "status":        p.Status,
            "createdAt":     p.CreatedAt,
            "updatedAt":     p.UpdatedAt,
            "type": gin.H{
                "id":       p.TypeID,
                "category": p.Category,
                "name":     p.TypeName,
            },
        }

        if p.StaffID.Valid {
            product["staff"] = gin.H{
                "id":   p.StaffID.Int32,
                "name": p.StaffName.String,
            }
        }

        if category == "pc" && p.ModelNumber.Valid {
            product["pcDetails"] = gin.H{
                "modelNumber":    p.ModelNumber.String,
                "serialNumber":   p.SerialNumber.String,
                "purchaseDate":   p.PurchaseDate.Time,
                "warrantyPeriod": p.WarrantyPeriod.Int32,
            }
        }

        products = append(products, product)
    }

    c.JSON(http.StatusOK, products)
}

// 入庫履歴取得ハンドラー
func GetInboundHistory(c *gin.Context) {
    category := c.Param("category")

    query := `
        SELECT
            ir.id, ir.inbound_number, ir.inbound_date,
            p.product_id, p.lot_number,
            pt.id as type_id, pt.name as type_name,
            s.id as staff_id, s.name as staff_name,
            pc.model_number, pc.serial_number
        FROM inbound_records ir
        INNER JOIN products p ON ir.product_id = p.product_id
        INNER JOIN product_types pt ON p.type_id = pt.id
        INNER JOIN staff s ON ir.staff_id = s.id
        LEFT JOIN pc_details pc ON p.product_id = pc.product_id
        WHERE pt.category = $1
        ORDER BY ir.inbound_date DESC, ir.id DESC
    `

    rows, err := db.DB.Query(query, category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("入庫履歴の取得に失敗しました: %v", err)})
        return
    }
    defer rows.Close()

    var history []gin.H
    for rows.Next() {
        var h struct {
            ID            int
            InboundNumber string
            InboundDate   time.Time
            ProductID     string
            LotNumber     sql.NullString
            TypeID       int
            TypeName     string
            StaffID      int
            StaffName    string
            ModelNumber  sql.NullString
            SerialNumber sql.NullString
        }

        err := rows.Scan(
            &h.ID, &h.InboundNumber, &h.InboundDate,
            &h.ProductID, &h.LotNumber,
            &h.TypeID, &h.TypeName,
            &h.StaffID, &h.StaffName,
            &h.ModelNumber, &h.SerialNumber,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("データの読み取りに失敗しました: %v", err)})
            return
        }

        record := gin.H{
            "id":            h.ID,
            "inboundNumber": h.InboundNumber,
            "inboundDate":   h.InboundDate,
            "productId":     h.ProductID,
            "lotNumber":     h.LotNumber.String,
            "type": gin.H{
                "id":   h.TypeID,
                "name": h.TypeName,
            },
            "staff": gin.H{
                "id":   h.StaffID,
                "name": h.StaffName,
            },
        }

        if category == "pc" && h.ModelNumber.Valid {
            record["pcDetails"] = gin.H{
                "modelNumber":  h.ModelNumber.String,
                "serialNumber": h.SerialNumber.String,
            }
        }

        history = append(history, record)
    }

    c.JSON(http.StatusOK, history)
}

// 出庫履歴取得ハンドラー
func GetOutboundHistory(c *gin.Context) {
    category := c.Param("category")

    query := `
        SELECT
            or.id, or.outbound_number, or.outbound_date,
            p.product_id, p.lot_number,
            pt.id as type_id, pt.name as type_name,
            s.id as staff_id, s.name as staff_name,
            or.customer_number, or.customer_name,
            or.purchaser_number, or.purchaser_name,
            or.notes,
            pc.model_number, pc.serial_number
        FROM outbound_records or
        INNER JOIN products p ON or.product_id = p.product_id
        INNER JOIN product_types pt ON p.type_id = pt.id
        INNER JOIN staff s ON or.staff_id = s.id
        LEFT JOIN pc_details pc ON p.product_id = pc.product_id
        WHERE pt.category = $1
        ORDER BY or.outbound_date DESC, or.id DESC
    `

    rows, err := db.DB.Query(query, category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("出庫履歴の取得に失敗しました: %v", err)})
        return
    }
    defer rows.Close()

    var history []gin.H
    for rows.Next() {
        var h struct {
            ID              int
            OutboundNumber  string
            OutboundDate    time.Time
            ProductID       string
            LotNumber       sql.NullString
            TypeID         int
            TypeName       string
            StaffID        int
            StaffName      string
            CustomerNumber sql.NullString
            CustomerName   sql.NullString
            PurchaserNumber sql.NullString
            PurchaserName   sql.NullString
            Notes          sql.NullString
            ModelNumber    sql.NullString
            SerialNumber   sql.NullString
        }

        err := rows.Scan(
            &h.ID, &h.OutboundNumber, &h.OutboundDate,
            &h.ProductID, &h.LotNumber,
            &h.TypeID, &h.TypeName,
            &h.StaffID, &h.StaffName,
            &h.CustomerNumber, &h.CustomerName,
            &h.PurchaserNumber, &h.PurchaserName,
            &h.Notes,
            &h.ModelNumber, &h.SerialNumber,
        )
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("データの読み取りに失敗しました: %v", err)})
            return
        }

        record := gin.H{
            "id":             h.ID,
            "outboundNumber": h.OutboundNumber,
            "outboundDate":   h.OutboundDate,
            "productId":      h.ProductID,
            "lotNumber":      h.LotNumber.String,
            "type": gin.H{
                "id":   h.TypeID,
                "name": h.TypeName,
            },
            "staff": gin.H{
                "id":   h.StaffID,
                "name": h.StaffName,
            },
            "customerNumber": h.CustomerNumber.String,
            "customerName":   h.CustomerName.String,
            "purchaserNumber": h.PurchaserNumber.String,
            "purchaserName":   h.PurchaserName.String,
            "notes":          h.Notes.String,
        }

        if category == "pc" && h.ModelNumber.Valid {
            record["pcDetails"] = gin.H{
                "modelNumber":  h.ModelNumber.String,
                "serialNumber": h.SerialNumber.String,
            }
        }

        history = append(history, record)
    }

    c.JSON(http.StatusOK, history)
}