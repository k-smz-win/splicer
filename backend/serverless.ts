import type { AWS } from '@serverless/typescript'

/**
 * Serverless Framework 設定。
 * ローカル: serverless-offline（ポート 3000）
 * 本番: AWS Lambda + API Gateway（ap-northeast-1）
 *
 * esbuild でハンドラーを個別バンドルするため、Lambda パッケージは最小になる。
 * ts-node がこのファイルを読み込むため tsconfig.json の module は CommonJS にすること。
 */
const serverlessConfig: AWS = {
  service: 'fusion-splicer-backend',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'ap-northeast-1',
    environment: {
      NODE_ENV: '${env:NODE_ENV, "development"}',
      AUTH_MODE: '${env:AUTH_MODE, "cognito"}',
      COGNITO_USER_POOL_ID: '${env:COGNITO_USER_POOL_ID, ""}',
      COGNITO_CLIENT_ID: '${env:COGNITO_CLIENT_ID, ""}',
      AWS_REGION: '${env:AWS_REGION, "ap-northeast-1"}',
    },
  },
  functions: {
    // ---- 認証 ----
    login: {
      handler: 'src/handlers/auth.login',
      events: [{ http: { path: '/api/auth/login', method: 'post', cors: true } }],
    },
    me: {
      handler: 'src/handlers/auth.me',
      events: [{ http: { path: '/api/auth/me', method: 'get', cors: true } }],
    },
    mfaChallenge: {
      handler: 'src/handlers/auth.mfaChallenge',
      events: [{ http: { path: '/api/auth/mfa/challenge', method: 'post', cors: true } }],
    },
    mfaSetup: {
      handler: 'src/handlers/auth.mfaSetup',
      events: [{ http: { path: '/api/auth/mfa/setup', method: 'post', cors: true } }],
    },
    mfaVerifySetup: {
      handler: 'src/handlers/auth.mfaVerifySetup',
      events: [{ http: { path: '/api/auth/mfa/verify-setup', method: 'post', cors: true } }],
    },

    // ---- 会社管理 ----
    // ⚠️ /companies/me/descendants は /companies/{id}/descendants より先に定義すること
    getMyDescendants: {
      handler: 'src/handlers/companies.getMyDescendants',
      events: [{ http: { path: '/api/companies/me/descendants', method: 'get', cors: true } }],
    },
    createCompany: {
      handler: 'src/handlers/companies.createCompany',
      events: [{ http: { path: '/api/companies', method: 'post', cors: true } }],
    },
    getDescendants: {
      handler: 'src/handlers/companies.getDescendants',
      events: [{ http: { path: '/api/companies/{id}/descendants', method: 'get', cors: true } }],
    },
    getAncestors: {
      handler: 'src/handlers/companies.getAncestors',
      events: [{ http: { path: '/api/companies/{id}/ancestors', method: 'get', cors: true } }],
    },

    // ---- 設定管理（会社×ロール） ----
    getCompanySettings: {
      handler: 'src/handlers/settings.getCompanySettings',
      events: [{ http: { path: '/api/companies/{id}/settings', method: 'get', cors: true } }],
    },
    setCompanySetting: {
      handler: 'src/handlers/settings.setCompanySetting',
      events: [{ http: { path: '/api/companies/{id}/settings/{role}/{key}', method: 'put', cors: true } }],
    },

    // ---- 設定管理（ユーザー個別） ----
    getUserSettings: {
      handler: 'src/handlers/settings.getUserSettings',
      events: [{ http: { path: '/api/users/{sub}/settings', method: 'get', cors: true } }],
    },
    setUserSetting: {
      handler: 'src/handlers/settings.setUserSetting',
      events: [{ http: { path: '/api/users/{sub}/settings/{key}', method: 'put', cors: true } }],
    },
    deleteUserSetting: {
      handler: 'src/handlers/settings.deleteUserSetting',
      events: [{ http: { path: '/api/users/{sub}/settings/{key}', method: 'delete', cors: true } }],
    },

    // ---- 融着・プロジェクト ----
    getFusion: {
      handler: 'src/handlers/fusion.getFusion',
      events: [{ http: { path: '/api/fusion', method: 'get', cors: true } }],
    },
    getProjects: {
      handler: 'src/handlers/projects.getProjects',
      events: [{ http: { path: '/api/projects', method: 'get', cors: true } }],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      target: 'node20',
      exclude: ['aws-sdk'],
    },
    'serverless-offline': {
      httpPort: 3000,
      host: '0.0.0.0',
      noPrependStageInUrl: true,
    },
  },
}

module.exports = serverlessConfig
