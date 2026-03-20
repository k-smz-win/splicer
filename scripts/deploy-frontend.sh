#!/bin/bash
# フロントエンドを手動で S3 + CloudFront にデプロイする。
# 事前に AWS CLI の認証情報と以下の環境変数を設定すること。
#
#   export S3_BUCKET=<バケット名>
#   export CF_DISTRIBUTION_ID=<CloudFront ディストリビューション ID>

set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET が未設定です}"
: "${CF_DISTRIBUTION_ID:?CF_DISTRIBUTION_ID が未設定です}"

echo "==> フロントエンドをビルド中..."
npm ci
npm run build

echo "==> S3 にアセットを同期中（index.html 除外）..."
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --exclude "index.html" \
  --cache-control "max-age=31536000,immutable" \
  --size-only

echo "==> index.html をアップロード中（no-cache）..."
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache,no-store,must-revalidate"

echo "==> CloudFront キャッシュを無効化中..."
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths "/index.html"

echo "==> 完了"
