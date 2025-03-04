package handler

import (
    "log"
    "net/http"
    "strconv"
    "time"
    "github.com/gin-gonic/gin"
    "inventory-tracker/server/internal/db"
)

// スタッフ一覧取得ハンドラー
func GetStaffList(c *gin.Context) {
    log.Printf("[GetStaffList] リクエスト受信")
    staffList, err := db.GetStaffList()
    if err != nil {
        log.Printf("[GetStaffList] エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "スタッフ一覧の取得に失敗しました",
        })
        return
    }

    log.Printf("[GetStaffList] 成功: %d件のスタッフを取得", len(staffList))
    c.JSON(http.StatusOK, staffList)
}

// スタッフ追加ハンドラー
func CreateStaff(c *gin.Context) {
    log.Printf("[CreateStaff] リクエスト受信")
    var req struct {
        Name string `json:"name" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        log.Printf("[CreateStaff] バリデーションエラー: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "無効なリクエストデータです",
        })
        return
    }

    log.Printf("[CreateStaff] 担当者名: %s", req.Name)
    var staff struct {
        ID        int       `json:"id"`
        Name      string    `json:"name"`
        CreatedAt time.Time `json:"createdAt"`
    }

    err := db.DB.QueryRow(
        "INSERT INTO staff (name) VALUES ($1) RETURNING id, name, created_at::timestamp",
        req.Name,
    ).Scan(&staff.ID, &staff.Name, &staff.CreatedAt)

    if err != nil {
        log.Printf("[CreateStaff] データベースエラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "スタッフの登録に失敗しました",
        })
        return
    }

    log.Printf("[CreateStaff] 成功: ID=%d", staff.ID)
    c.JSON(http.StatusOK, staff)
}

// スタッフ削除ハンドラー
func DeleteStaff(c *gin.Context) {
    log.Printf("[DeleteStaff] リクエスト受信")
    staffID, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        log.Printf("[DeleteStaff] IDパースエラー: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "無効なスタッフIDです",
        })
        return
    }

    log.Printf("[DeleteStaff] スタッフID: %d", staffID)
    _, err = db.DB.Exec("DELETE FROM staff WHERE id = $1", staffID)
    if err != nil {
        log.Printf("[DeleteStaff] データベースエラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "スタッフの削除に失敗しました",
        })
        return
    }

    log.Printf("[DeleteStaff] 成功")
    c.JSON(http.StatusOK, gin.H{
        "message": "スタッフを削除しました",
    })
}