package routes

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "inventory-tracker/server/internal/handler"
)

func SetupRouter() *gin.Engine {
    r := gin.Default()

    // CORSの設定を更新
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           300,
    }))

    // APIルートグループ
    api := r.Group("/api")
    {
        // 製品ID存在チェック
        api.GET("/inventory/:category/check-product-id/:productId", handler.CheckProductID)

        // 入出庫処理
        api.POST("/inbound/:category", handler.HandleInbound)
        api.POST("/outbound/:category", handler.HandleOutbound)

        // 在庫一覧
        api.GET("/inventory/:category", handler.GetInventory)

        // スタッフ管理
        api.GET("/staff", handler.GetStaffList)
        api.POST("/staff", handler.CreateStaff)
        api.DELETE("/staff/:id", handler.DeleteStaff)

        // 製品タイプ
        api.GET("/product-types/:category", handler.GetProductTypes)

        // PC型番管理
        api.GET("/pc-model-numbers", handler.GetPCModelNumbers)
        api.POST("/pc-model-numbers", handler.AddPCModelNumber)
        api.DELETE("/pc-model-numbers/:modelNumber", handler.DeletePCModelNumber)

        // 最新ロット番号
        api.GET("/latest-lot-number/:category", handler.GetLatestLotNumber)

        // ダッシュボード
        api.GET("/dashboard/stats", handler.GetDashboardStats)

        // 履歴
        api.GET("/inbound/:category/history", handler.GetInboundHistory)
        api.GET("/outbound/:category/history", handler.GetOutboundHistory)
    }

    return r
}