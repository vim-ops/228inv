FROM golang:1.21-alpine AS builder

WORKDIR /build

# 必要なパッケージのインストール
RUN apk add --no-cache gcc musl-dev

# 依存関係のコピーとダウンロード
COPY go.mod go.sum ./
RUN go mod download

# ソースコードのコピー
COPY . .

# アプリケーションのビルド
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

# 実行用の軽量イメージ
FROM alpine:latest

WORKDIR /app

# ビルドしたバイナリをコピー
COPY --from=builder /build/main .

# 実行
EXPOSE 8080
CMD ["./main"]