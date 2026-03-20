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
      JWT_SECRET: '${env:JWT_SECRET, "local-dev-secret-change-in-production"}',
      NODE_ENV: '${env:NODE_ENV, "development"}',
    },
  },
  functions: {
    login: {
      handler: 'src/handlers/auth.login',
      events: [{ http: { path: '/api/auth/login', method: 'post', cors: true } }],
    },
    me: {
      handler: 'src/handlers/auth.me',
      events: [{ http: { path: '/api/auth/me', method: 'get', cors: true } }],
    },
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
    },
  },
}

module.exports = serverlessConfig
