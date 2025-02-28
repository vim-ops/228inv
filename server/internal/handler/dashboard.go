package handler

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "inventory-tracker/server/internal/db"
)

// ダッシュボード統計情報取得ハンドラー
func GetDashboardStats(c *gin.Context) {
    // 在庫総数の取得
    var totalProducts int
    err := db.DB.QueryRow(`
        SELECT COUNT(*)
        FROM products
        WHERE status = 'in_stock'
    `).Scan(&totalProducts)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "在庫総数の取得に失敗しました"})
        return
    }

    // カテゴリー別在庫数の取得
    rows, err := db.DB.Query(`
        SELECT pt.category, COUNT(*)
        FROM products p
        INNER JOIN product_types pt ON p.type_id = pt.id
        WHERE p.status = 'in_stock'
        GROUP BY pt.category
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "カテゴリー別在庫数の取得に失敗しました"})
        return
    }
    defer rows.Close()

    byCategory := make(map[string]int)
    for rows.Next() {
        var category string
        var count int
        if err := rows.Scan(&category, &count); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "カテゴリー別データの読み取りに失敗しました"})
            return
        }
        byCategory[category] = count
    }

    // 最近の入出庫履歴の取得
    recentActivities, err := getRecentActivities()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "最近の活動履歴の取得に失敗しました"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "totalProducts":    totalProducts,
        "byCategory":      byCategory,
        "recentActivities": recentActivities,
    })
}

// 最近の入出庫履歴を取得する補助関数
func getRecentActivities() ([]gin.H, error) {
    // 入庫履歴の取得
    inboundQuery := `
        SELECT 
            'inbound' as type,
            ir.inbound_date as date,
            p.product_id,
            pt.category,
            s.name as staff_name
        FROM inbound_records ir
        INNER JOIN products p ON ir.product_id = p.product_id
        INNER JOIN product_types pt ON p.type_id = pt.id
        INNER JOIN staff s ON ir.staff_id = s.id
        ORDER BY ir.inbound_date DESC
        LIMIT 5
    `

    inboundRows, err := db.DB.Query(inboundQuery)
    if err != nil {
        return nil, err
    }
    defer inboundRows.Close()

    // 出庫履歴の取得
    outboundQuery := `
        SELECT 
            'outbound' as type,
            or.outbound_date as date,
            p.product_id,
            pt.category,
            s.name as staff_name
        FROM outbound_records or
        INNER JOIN products p ON or.product_id = p.product_id
        INNER JOIN product_types pt ON p.type_id = pt.id
        INNER JOIN staff s ON or.staff_id = s.id
        ORDER BY or.outbound_date DESC
        LIMIT 5
    `

    outboundRows, err := db.DB.Query(outboundQuery)
    if err != nil {
        return nil, err
    }
    defer outboundRows.Close()

    var activities []gin.H

    // 入庫履歴の処理
    for inboundRows.Next() {
        var activity struct {
            Type      string
            Date      string
            ProductID string
            Category  string
            StaffName string
        }
        if err := inboundRows.Scan(&activity.Type, &activity.Date, &activity.ProductID, &activity.Category, &activity.StaffName); err != nil {
            return nil, err
        }
        activities = append(activities, gin.H{
            "type":      activity.Type,
            "date":      activity.Date,
            "productId": activity.ProductID,
            "category":  activity.Category,
            "staffName": activity.StaffName,
        })
    }

    // 出庫履歴の処理
    for outboundRows.Next() {
        var activity struct {
            Type      string
            Date      string
            ProductID string
            Category  string
            StaffName string
        }
        if err := outboundRows.Scan(&activity.Type, &activity.Date, &activity.ProductID, &activity.Category, &activity.StaffName); err != nil {
            return nil, err
        }
        activities = append(activities, gin.H{
            "type":      activity.Type,
            "date":      activity.Date,
            "productId": activity.ProductID,
            "category":  activity.Category,
            "staffName": activity.StaffName,
        })
    }

    return activities, nil
}