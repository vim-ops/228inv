package db

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "os"
    "time"
    _ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() error {
    // 環境変数から接続情報を取得
    host := os.Getenv("DB_HOST")
    port := os.Getenv("DB_PORT")
    user := os.Getenv("DB_USER")
    password := os.Getenv("DB_PASSWORD")
    dbname := os.Getenv("DB_NAME")

    if host == "" {
        host = "localhost"
    }
    if port == "" {
        port = "5432"
    }
    if user == "" {
        user = "postgres"
    }
    if dbname == "" {
        dbname = "inventory"
    }

    // 接続文字列の構築
    connStr := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        host, port, user, password, dbname,
    )

    // データベースへの接続
    var err error
    DB, err = sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("データベース接続エラー: %v", err)
    }

    // 接続プールの設定
    DB.SetMaxOpenConns(25)
    DB.SetMaxIdleConns(5)
    DB.SetConnMaxLifetime(5 * time.Minute)
    DB.SetConnMaxIdleTime(5 * time.Minute)

    // 接続テスト
    err = DB.Ping()
    if err != nil {
        return fmt.Errorf("データベース接続テストエラー: %v", err)
    }

    log.Println("データベースに接続しました")
    return nil
}

// トランザクションを開始
func BeginTx() (*sql.Tx, error) {
    // 分離レベルを指定してトランザクションを開始
    tx, err := DB.BeginTx(context.Background(), &sql.TxOptions{
        Isolation: sql.LevelRepeatableRead,
    })
    if err != nil {
        return nil, fmt.Errorf("トランザクション開始エラー: %v", err)
    }
    return tx, nil
}

// PCモデル番号の取得
func GetPCModelNumbers() ([]string, error) {
    rows, err := DB.Query("SELECT model_number FROM pc_model_numbers ORDER BY model_number")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var models []string
    for rows.Next() {
        var model string
        if err := rows.Scan(&model); err != nil {
            return nil, err
        }
        models = append(models, model)
    }
    return models, nil
}

// スタッフ一覧の取得
func GetStaffList() ([]struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"createdAt"`
}, error) {
    rows, err := DB.Query("SELECT id, name, created_at::timestamp FROM staff ORDER BY id")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var staffList []struct {
        ID        int       `json:"id"`
        Name      string    `json:"name"`
        CreatedAt time.Time `json:"createdAt"`
    }
    for rows.Next() {
        var staff struct {
            ID        int       `json:"id"`
            Name      string    `json:"name"`
            CreatedAt time.Time `json:"createdAt"`
        }
        if err := rows.Scan(&staff.ID, &staff.Name, &staff.CreatedAt); err != nil {
            return nil, err
        }
        staffList = append(staffList, staff)
    }
    return staffList, nil
}

// 製品タイプの取得
func GetProductTypes(category string) ([]struct {
    ID       int    `json:"id"`
    Name     string `json:"name"`
    Category string `json:"category"`
}, error) {
    rows, err := DB.Query(
        "SELECT id, name, category FROM product_types WHERE category = $1 ORDER BY id",
        category,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var types []struct {
        ID       int    `json:"id"`
        Name     string `json:"name"`
        Category string `json:"category"`
    }
    for rows.Next() {
        var t struct {
            ID       int    `json:"id"`
            Name     string `json:"name"`
            Category string `json:"category"`
        }
        if err := rows.Scan(&t.ID, &t.Name, &t.Category); err != nil {
            return nil, err
        }
        types = append(types, t)
    }
    return types, nil
}

// 製品IDの存在チェック
func CheckProductIDExists(productID string, category string) (bool, error) {
    var exists bool
    err := DB.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM products p
            INNER JOIN product_types pt ON p.type_id = pt.id
            WHERE p.product_id = $1 AND pt.category = $2 AND p.status = 'in_stock'
        )
    `, productID, category).Scan(&exists)
    return exists, err
}

// 最新のロット番号取得
func GetLatestLotNumber(category string) (*string, error) {
    var lotNumber sql.NullString
    err := DB.QueryRow(`
        SELECT p.lot_number
        FROM products p
        INNER JOIN product_types pt ON p.type_id = pt.id
        WHERE pt.category = $1
        ORDER BY p.created_at DESC
        LIMIT 1
    `, category).Scan(&lotNumber)

    if err == sql.ErrNoRows {
        return nil, nil
    }
    if err != nil {
        return nil, err
    }
    if !lotNumber.Valid {
        return nil, nil
    }
    return &lotNumber.String, nil
}