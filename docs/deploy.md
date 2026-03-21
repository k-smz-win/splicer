# AWS デプロイ手順

## 構成概要

| レイヤー | サービス |
|---|---|
| フロントエンド | S3 + CloudFront |
| バックエンド | Lambda + API Gateway (ap-northeast-1) |
| CI/CD | GitHub Actions (OIDC認証) |

- GitHubリポジトリ: https://github.com/k-smz-win/splicer
- AWSリージョン: `ap-northeast-1`（東京）

---

## Step 1: S3バケットを作成する

```bash
aws s3 mb s3://splicer-frontend --region ap-northeast-1
```

---

## Step 2: CloudFrontディストリビューションを作成する

AWSコンソール → CloudFront → 「ディストリビューションを作成」

| 設定項目 | 値 |
|---|---|
| オリジンドメイン | 上記S3バケット |
| オリジンアクセス | OAC（Origin Access Control）を新規作成 |
| デフォルトルートオブジェクト | `index.html` |
| カスタムエラーレスポンス | 403/404 → `/index.html`（HTTPステータス: 200） |

作成後、**ディストリビューションID** をメモしておく（後でGitHub Secretsに使用）。

### S3バケットポリシーの更新

CloudFrontからのアクセスを許可するため、コンソールが提示するバケットポリシーをそのままS3に適用する。

---

## Step 3: GitHub OIDC用 IAMロールを作成する

### 3-1. ロール作成画面へ

AWSコンソール → IAM → ロール → 「ロールを作成」

### 3-2. 信頼されたエンティティを選択

「**ウェブアイデンティティ**」を選択すると下部に入力欄が現れる。

| 項目 | 値 |
|---|---|
| アイデンティティプロバイダー | `token.actions.githubusercontent.com` |
| Audience | `sts.amazonaws.com` |
| GitHub organization | `k-smz-win` |
| GitHub repository | `splicer` |
| GitHub branch | `main` |

> organization・repository・branch を入力すると、条件（Condition）はAWSが自動生成するため手動追加は不要。

「次へ」をクリック。

### 3-3. 許可を追加（ポリシー選択）

何も選択せず「**次へ**」をクリック。
（ポリシーはロール作成後にインラインで追加する）

### 3-4. ロール名を入力して作成

| 項目 | 値 |
|---|---|
| ロール名 | `github-actions-splicer` |

「**ロールを作成**」をクリック。

### 3-5. インラインポリシーを追加

作成したロール `github-actions-splicer` を開く →「許可」タブ →「許可を追加」→「インラインポリシーを作成」→「JSON」タブ に以下を貼り付ける：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::splicer-frontend",
        "arn:aws:s3:::splicer-frontend/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    }
  ]
}
```

ポリシー名（任意）を入力して「**ポリシーを作成**」をクリック。

### 3-6. ロールARNをメモ

ロールの概要ページ上部に表示される ARN（`arn:aws:iam::xxxx:role/github-actions-splicer`）をメモする。

---

## Step 4: GitHub Secretsを設定する

リポジトリ → Settings → Secrets and variables → Actions → 「New repository secret」

| Secret名 | 値 |
|---|---|
| `AWS_ROLE_ARN` | Step 3でメモしたロールARN |
| `S3_BUCKET` | `splicer-frontend` |
| `CF_DISTRIBUTION_ID` | Step 2でメモしたディストリビューションID |
| `JWT_SECRET` | `bc4b1c26b4e0178c0e5b99434180f333e7130d4103c617c1a52f192421c9c938` |

---

## Step 5: バックエンドをデプロイする

バックエンドを先にデプロイして API Gateway の URL を取得する。

```bash
cd backend
npm ci
npx serverless deploy --stage prod
```

デプロイ完了後、ターミナルに以下のような出力が表示される：

```
endpoints:
  POST - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/auth/login
  GET  - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/auth/me
  ...
```

`https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod` の部分をメモする。

---

## Step 6: フロントエンドの環境変数を設定する

プロジェクトルートに `.env.production` を作成：

```bash
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
```

`xxxxxxxxxx` の部分は Step 5 でメモした値に置き換える。

---

## Step 7: mainブランチにプッシュしてフロントエンドをデプロイする

```bash
git add .
git commit -m "add .env.production for AWS deploy"
git push origin main
```

GitHub Actions が自動的に以下を実行する：

1. `npm run build` でビルド
2. S3へアップロード（アセットは長期キャッシュ、index.htmlはno-cache）
3. CloudFrontのキャッシュを削除

---

## Step 8: 動作確認

CloudFrontコンソールからドメイン名（`xxxx.cloudfront.net`）を確認し、ブラウザでアクセスする。

---

## トラブルシューティング

| 症状 | 確認箇所 |
|---|---|
| 画面が真っ白 | `VITE_API_BASE_URL` が正しいか確認 |
| ログインできない | Lambda のログを CloudWatch で確認 |
| 403 Forbidden | S3バケットポリシー、CloudFront OACの設定を確認 |
| GitHub Actions が失敗する | Secrets の値とIAMロールのARNを再確認 |
