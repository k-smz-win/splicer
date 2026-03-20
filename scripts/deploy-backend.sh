#!/bin/bash
# バックエンドを手動で AWS Lambda + API Gateway にデプロイする。
# 事前に AWS CLI の認証情報と以下の環境変数を設定すること。
#
#   export JWT_SECRET=<本番用シークレット>

set -euo pipefail

: "${JWT_SECRET:?JWT_SECRET が未設定です}"

echo "==> バックエンド依存関係をインストール中..."
cd backend
npm ci

echo "==> Serverless Framework でデプロイ中（stage: prod）..."
npx serverless deploy --stage prod

echo "==> 完了"
