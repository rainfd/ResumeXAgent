/**
 * 环境变量管理和验证
 */

interface EnvConfig {
  OPENROUTER_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  DATABASE_PATH: string;
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
}

const requiredEnvVars = [
  'OPENROUTER_API_KEY',
  'DEEPSEEK_API_KEY',
  'DATABASE_PATH',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * 验证环境变量
 */
function validateEnv(): EnvConfig {
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `
❌ 缺少必需的环境变量:
${missingVars.map((v) => `  - ${v}`).join('\n')}

📝 请按以下步骤配置:
1. 复制 .env.example 文件为 .env.local
2. 填写所需的 API 密钥和配置值
3. 重新启动开发服务器

详细配置说明请参见 README.md 文件。
`.trim();

    throw new Error(errorMessage);
  }

  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY!,
    DATABASE_PATH: process.env.DATABASE_PATH!,
    NODE_ENV: (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'],
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  };
}

export const env = validateEnv();
export type { EnvConfig };
