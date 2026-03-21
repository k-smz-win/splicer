# AWS デプロイ手順

## 全体の流れ

```
[GitHub リポジトリ]
      │
      │ push to main
      ▼
[GitHub Actions]
      ├─── Deploy Frontend ───► [S3] ──► [CloudFront] ──► ユーザーのブラウザ
      └─── Deploy Backend  ───► [Lambda + API Gateway]
```

| サービス | 役割 |
|---|---|
| S3 | フロントエンド（HTML/JS/CSS）の置き場所 |
| CloudFront | S3の前に置くCDN。HTTPSアクセス・キャッシュを担当 |
| Lambda | バックエンドのサーバーレス関数 |
| API Gateway | Lambdaへのリクエスト受け口（HTTPエンドポイントを提供） |
| GitHub Actions | pushをトリガーに自動デプロイを実行するCI/CD |

### デプロイの順番

```
Step 1: S3バケット作成
Step 2: CloudFront作成
Step 3: IAMロール作成（GitHub Actions用）
Step 4: GitHub Secrets登録
Step 5: バックエンドデプロイ（Lambda + API Gateway）← APIのURLを取得するため先に行う
Step 6: .env.production作成（取得したURLを設定）
Step 7: フロントエンドデプロイ（mainへpush）
Step 8: 動作確認
```

> **なぜバックエンドを先にデプロイするか**
> フロントエンドのビルド時に `VITE_API_BASE_URL`（APIのURL）が必要。
> バックエンドをデプロイしてURLが確定してからでないと設定できない。

---

## 用語説明

| 用語 | 説明 |
|---|---|
| **OIDC** | パスワードの代わりにトークンでAWS認証する仕組み。GitHub ActionsのシークレットにAWSキーを保存しなくて済む |
| **OAC (Origin Access Control)** | CloudFrontだけがS3にアクセスできるよう制限する設定。S3を直接公開しなくて済む |
| **CloudFormation** | AWSリソースをコードで管理するサービス。Serverless Frameworkが内部で使用する |

---

## 前提条件

- AWSアカウントがあり、`aws` CLIでログイン済み（`aws sts get-caller-identity` でアカウント情報が表示されること）
- Node.js 20以上がインストール済み
- `.github/workflows/deploy-frontend.yml` と `deploy-backend.yml` がリポジトリに存在すること
- デプロイはすべて `main` ブランチへのpushで発火する

---

## Step 1: S3バケットを作成する

**目的**: フロントエンドのビルド成果物（HTML/JS/CSS）を置くストレージを作る。

```bash
# バケットを東京リージョンに作成
aws s3 mb s3://splicer-frontend --region ap-northeast-1
```

実行後、`make_bucket: splicer-frontend` と表示されれば成功。

> **詰まりやすいポイント**
> - `InvalidAccessKeyId` エラー → `aws configure` でキーを再設定する
> - バケット名はグローバルで一意。`splicer-frontend` が使われていたら別の名前にする

---

## Step 2: CloudFrontディストリビューションを作成する

**目的**: S3の前にCDNを置き、HTTPSアクセスとキャッシュを有効にする。ユーザーはCloudFrontのURLで画面にアクセスする。

AWSコンソール → CloudFront → 「ディストリビューションを作成」

| 設定項目 | 値 |
|---|---|
| オリジンドメイン | `splicer-frontend.s3.ap-northeast-1.amazonaws.com` |
| オリジンアクセス | **OACを新規作成**（S3直接公開を防ぐ） |
| デフォルトルートオブジェクト | `index.html` |
| カスタムエラーレスポンス | 403/404 → `/index.html`（HTTPステータス: 200） |

> **カスタムエラーレスポンスが必要な理由**
> React RouterでSPAのルーティングを使っているため、`/dashboard` などのURLを直接開くとS3が404を返す。CloudFrontで強制的に `index.html` を返すことでSPAが正常動作する。

作成後：
1. **ディストリビューションID**（`E1XXXXXXXXXX` 形式）をメモする
2. コンソールが「S3バケットポリシーを更新してください」と表示したら、**提示されたポリシーをそのままS3に適用する**

> **S3バケットポリシーの適用方法**
> S3コンソール → `splicer-frontend` → 「アクセス許可」タブ → 「バケットポリシー」→ 「編集」→ CloudFrontが提示したJSONを貼り付けて保存

---

## Step 3: GitHub OIDC用 IAMロールを作成する

**目的**: GitHub ActionsがAWSに安全にアクセスするためのロールを作る。
AWSのアクセスキーをGitHubに保存せず、OIDCトークンで一時的な権限を取得できるようにする。

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
> `main` ブランチからのActionsのみがこのロールを使えるよう制限される。

「次へ」をクリック。

### 3-3. 許可を追加（ポリシー選択）

**何も選択せず**「次へ」をクリック。
（ポリシーはロール作成後にインラインで追加する）

### 3-4. ロール名を入力して作成

| 項目 | 値 |
|---|---|
| ロール名 | `github-actions-splicer` |

「ロールを作成」をクリック。

### 3-5. インラインポリシーを追加

作成したロール `github-actions-splicer` を開く →「許可」タブ →「許可を追加」→「インラインポリシーを作成」→「JSON」タブに以下を貼り付ける：

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
        "s3:ListBucket",
        "s3:CreateBucket",
        "s3:GetBucketLocation",
        "s3:GetEncryptionConfiguration",
        "s3:PutEncryptionConfiguration",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudformation:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["apigateway:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:*"],
      "Resource": "*"
    }
  ]
}
```

> **なぜこれだけの権限が必要か**
> Serverless Framework（バックエンドデプロイに使用）が内部でCloudFormationを使ってLambda・API Gateway・IAMロール・CloudWatch Logsを自動作成するため、広い権限が必要になる。
>
> **後で絞る場合**
> 本番運用が安定したら、各Resourceを `arn:aws:lambda:ap-northeast-1:アカウントID:function:fusion-splicer-*` のように特定のARNに絞ることを推奨。

ポリシー名（例: `splicer-github-actions-policy`）を入力して「ポリシーを作成」をクリック。

> **詰まりやすいポイント**
> - 保存時に盾マーク（セキュリティ警告）が出ることがあるが、そのまま保存して問題ない
> - `s3:HeadObject` はIAMのアクションとして存在しないためエラーになる（使わない）

### 3-6. ロールARNをメモ

ロールの概要ページ上部に表示されるARNをメモする。

```
arn:aws:iam::387681450938:role/github-actions-splicer
```

---

## Step 4: GitHub Secretsを設定する

**目的**: GitHub ActionsからAWSリソースにアクセスするために必要な値を安全に登録する。

リポジトリ → Settings → Secrets and variables → Actions → 「New repository secret」

| Secret名 | 値 | 取得元 |
|---|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::xxxx:role/github-actions-splicer` | Step 3-6でメモしたARN |
| `S3_BUCKET` | `splicer-frontend` | Step 1で作成したバケット名 |
| `CF_DISTRIBUTION_ID` | `E1XXXXXXXXXX` | Step 2でメモしたID |
| `JWT_SECRET` | `bc4b1c26b4e0178c0e5b99434180f333e7130d4103c617c1a52f192421c9c938` | 固定値（変更不要） |

> **詰まりやすいポイント**
> - Secretsは登録後に値を確認できない。誤入力した場合は削除して再登録する
> - Secret名は大文字・アンダースコアで正確に入力する（ワークフローYAMLと一致している必要がある）

---

## Step 5: バックエンドをデプロイする

**目的**: LambdaとAPI GatewayをAWSに作成し、フロントエンドが呼び出すAPIのURLを取得する。

> **なぜStep 5で行うか**
> APIのURLはデプロイしてみるまで確定しない。このURLをStep 6で `.env.production` に書く必要があるため、フロントエンドのビルド前に実行する。

```bash
# backendディレクトリに移動して依存パッケージをインストール
cd backend
npm ci

# Serverless FrameworkでLambda + API GatewayをAWSにデプロイ
npx serverless deploy --stage prod
```

デプロイ完了後、以下のような出力が表示される：

```
endpoints:
  POST - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/auth/login
  GET  - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/auth/me
  GET  - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/fusion
  GET  - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/projects
```

`https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod` の部分（`/api/...` より前）をメモする。

> **詰まりやすいポイント**
> - `cloudformation:DescribeStacks` 権限エラー → Step 3のIAMポリシーが古い。最新のポリシーに更新してから再実行
> - `npm ci` でエラー → `backend/package-lock.json` が存在するか確認
> - デプロイに2〜3分かかることがある

---

## Step 6: フロントエンドの環境変数を設定する

**目的**: フロントエンドのビルド時にAPIのURLを埋め込むための設定ファイルを作る。

> **なぜ必要か**
> Viteはビルド時に `VITE_` プレフィックスの環境変数をJSバンドルに埋め込む。
> 本番環境用の `.env.production` を作ることで、本番ビルドのみ本番APIに向けることができる。

プロジェクトルート（`backend/` の外）に `.env.production` を作成：

```bash
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
```

`xxxxxxxxxx` の部分はStep 5でメモした値に置き換える。

> **詰まりやすいポイント**
> - ファイルの場所はプロジェクトルート（`package.json` と同じ階層）
> - `VITE_` プレフィックスがないと環境変数がビルドに含まれない
> - URLの末尾に `/` をつけない

---

## Step 7: mainブランチにプッシュしてフロントエンドをデプロイする

**目的**: コードをGitHubにpushしてGitHub Actionsを発火させ、自動でS3 + CloudFrontにデプロイする。

```bash
# 変更をステージング
git add .env.production

# コミット
git commit -m "add .env.production for production deploy"

# mainブランチにpush（GitHub Actionsが自動発火）
git push origin main
```

GitHub Actionsが自動的に以下を実行する：

1. `npm run build` でViteビルド（`.env.production` の値が埋め込まれる）
2. `dist/` 以下をS3へアップロード
   - アセット（JS/CSS）: 長期キャッシュ（1年）
   - `index.html`: キャッシュなし（常に最新を返す）
3. CloudFrontのキャッシュを削除（`index.html` のみ）

> **詰まりやすいポイント**
> - Actionsタブでワークフローが表示されない → `src/` 配下のファイルが変更されているか確認（ワークフローのpathフィルターが `src/**` のため）
> - `.env.production` だけのpushではDeploy Frontendが発火しない場合、`src/` 内の任意ファイルも一緒にコミットする
> - GitHub Actions → 失敗したジョブ → 「Re-run all jobs」で再実行できる

---

## Step 8: 動作確認

**目的**: 実際にブラウザでアクセスして画面が表示されることを確認する。

1. AWSコンソール → CloudFront → ディストリビューション一覧
2. 「ドメイン名」列に表示される `xxxx.cloudfront.net` をコピー
3. ブラウザで `https://xxxx.cloudfront.net` にアクセス

ログイン画面が表示されれば成功。

> **詰まりやすいポイント**
> - `403 Forbidden` → S3バケットポリシーが未設定。Step 2のOACポリシーをS3に適用する
> - 画面が真っ白 → ブラウザの開発者ツール（F12）→ Consoleタブでエラーを確認。`VITE_API_BASE_URL` が空になっている場合は `.env.production` の設定を見直す
> - ログインできない → AWSコンソール → CloudWatch → ロググループ → `/aws/lambda/fusion-splicer-backend-prod-login` でLambdaのログを確認

---

## トラブルシューティング

### GitHub Actionsが動かない

| 症状 | 原因 | 対処 |
|---|---|---|
| Actionsタブに何も表示されない | pushしたファイルがワークフローのpathフィルター外 | `src/` 配下のファイルを変更してpush |
| `Credentials could not be loaded` | `AWS_ROLE_ARN` Secretが未設定または誤り | GitHub Secrets を再確認・再登録 |
| `not authorized to perform` | IAMポリシーの権限不足 | Step 3-5のポリシーに更新 |

### serverless deploy 失敗

| 症状 | 原因 | 対処 |
|---|---|---|
| `cloudformation:DescribeStacks` エラー | IAMにCloudFormation権限がない | Step 3-5のポリシーに更新してRe-run |
| `npm ci` エラー | `backend/package-lock.json` がない | `cd backend && npm install` を実行してコミット |

### CORSエラー（ブラウザのコンソールに表示）

| 症状 | 原因 | 対処 |
|---|---|---|
| `CORS policy` エラー | `VITE_API_BASE_URL` が間違っている | `.env.production` のURLを確認。末尾の `/` を除く |
| `CORS policy` エラー | API GatewayのCORS設定が未反映 | `serverless deploy` を再実行 |
