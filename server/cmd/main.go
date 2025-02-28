package main

import (
    "log"
    "os"
    "github.com/gin-gonic/gin"
    "inventory-tracker/server/internal/db"
    "inventory-tracker/server/internal/routes"
)

func main() {
    // ログの設定
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
    log.SetOutput(os.Stdout)

    // デバッグモードを有効化
    gin.SetMode(gin.DebugMode)

    // データベースの初期化
    if err := db.InitDB(); err != nil {
        log.Fatalf("データベース初期化エラー: %v", err)
    }

    // ルーターの設定
    router := routes.SetupRouter()

    // サーバーの起動
    log.Println("サーバーを起動します...")
    if err := router.Run(":8080"); err != nil {
        log.Fatalf("サーバー起動エラー: %v", err)
    }
}