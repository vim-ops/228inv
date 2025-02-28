package handler

import (
    "log"
    "net/http"
    "github.com/gin-gonic/gin"
    "inventory-tracker/server/internal/db"
)

// 製品タイプ一覧取得ハンドラー
func GetProductTypes(c *gin.Context) {
    category := c.Param("category")
    log.Printf("製品タイプ取得リクエスト: カテゴリー = %s", category)

    types, err := db.GetProductTypes(category)
    log.Printf("取得された製品タイプ: %+v", types)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "製品タイプの取得に失敗しました",
        })
        return
    }

    c.JSON(http.StatusOK, types)
}

// PC型番一覧取得ハンドラー
func GetPCModelNumbers(c *gin.Context) {
    models, err := db.GetPCModelNumbers()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "PC型番の取得に失敗しました",
        })
        return
    }

    c.JSON(http.StatusOK, models)
}

// PC型番追加ハンドラー
func AddPCModelNumber(c *gin.Context) {
    var req struct {
        ModelNumber string `json:"modelNumber" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "無効なリクエストデータです",
        })
        return
    }

    // 既存の型番チェック
    var exists bool
    err := db.DB.QueryRow(
        "SELECT EXISTS(SELECT 1 FROM pc_model_numbers WHERE model_number = $1)",
        req.ModelNumber,
    ).Scan(&exists)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "型番チェックに失敗しました",
        })
        return
    }

    if exists {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "この型番は既に登録されています",
        })
        return
    }

    // 新規型番の登録
    _, err = db.DB.Exec(
        "INSERT INTO pc_model_numbers (model_number) VALUES ($1)",
        req.ModelNumber,
    )

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "型番の登録に失敗しました",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "modelNumber": req.ModelNumber,
    })
}

// PC型番削除ハンドラー
func DeletePCModelNumber(c *gin.Context) {
    modelNumber := c.Param("modelNumber")

    // 使用中の型番チェック
    var inUse bool
    err := db.DB.QueryRow(
        "SELECT EXISTS(SELECT 1 FROM pc_details WHERE model_number = $1)",
        modelNumber,
    ).Scan(&inUse)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "型番使用状況の確認に失敗しました",
        })
        return
    }

    if inUse {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "この型番は使用中のため削除できません",
        })
        return
    }

    // 型番の削除
    result, err := db.DB.Exec(
        "DELETE FROM pc_model_numbers WHERE model_number = $1",
        modelNumber,
    )

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "型番の削除に失敗しました",
        })
        return
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "削除結果の確認に失敗しました",
        })
        return
    }

    if rowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "指定された型番が見つかりません",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
    })
}

// 最新ロット番号取得ハンドラー
func GetLatestLotNumber(c *gin.Context) {
    category := c.Param("category")

    lotNumber, err := db.GetLatestLotNumber(category)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "最新ロット番号の取得に失敗しました",
        })
        return
    }

    var message string
    if lotNumber != nil {
        message = "前回のロット番号: " + *lotNumber
    } else {
        message = "前回の入力なし"
    }

    c.JSON(http.StatusOK, gin.H{
        "lotNumber": lotNumber,
        "message": message,
    })
}