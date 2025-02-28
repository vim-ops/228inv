FROM node:20-alpine

WORKDIR /app

# 依存関係のコピーとインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー
COPY . .

# 開発モードで実行（ビルドはスキップ）
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]