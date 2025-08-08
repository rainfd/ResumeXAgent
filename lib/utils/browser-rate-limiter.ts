import { logger } from './logger';

interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * 专门用于Playwright浏览器访问的频率限制器
 * 防止对招聘网站的过度访问，避免被封禁
 */
export class BrowserRateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly minInterval: number; // 最小请求间隔

  constructor(
    windowMs: number = 60000, // 默认1分钟时间窗口
    maxRequests: number = 3,  // 默认每分钟最多3次请求
    minInterval: number = 10000 // 默认请求间隔至少10秒
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.minInterval = minInterval;

    logger.info(
      `Browser rate limiter initialized: ${maxRequests} requests per ${windowMs}ms, min interval: ${minInterval}ms`,
      'BrowserRateLimiter'
    );
  }

  /**
   * 检查是否允许访问指定域名
   * @param domain 域名（如 zhipin.com）
   * @returns Promise<{ allowed: boolean, waitTime?: number }>
   */
  async checkAndWait(domain: string): Promise<{ allowed: boolean; waitTime?: number }> {
    const now = Date.now();
    const key = `browser_access:${domain}`;
    
    // 获取该域名的请求记录
    let records = this.requests.get(key) || [];
    
    // 清理过期记录
    records = records.filter(record => now - record.timestamp < this.windowMs);
    
    // 检查最近一次请求的时间间隔
    const lastRequest = records.length > 0 ? records[records.length - 1] : null;
    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest.timestamp;
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        logger.warn(
          `Browser access to ${domain} blocked: too soon since last request. Wait ${waitTime}ms`,
          'BrowserRateLimiter'
        );
        
        // 等待最小间隔
        await this.sleep(waitTime);
        return { allowed: true, waitTime };
      }
    }

    // 检查时间窗口内的请求数量
    if (records.length >= this.maxRequests) {
      const oldestRecord = records[0];
      const waitTime = this.windowMs - (now - oldestRecord.timestamp);
      
      logger.warn(
        `Browser access to ${domain} rate limited: ${records.length}/${this.maxRequests} requests in window. Wait ${waitTime}ms`,
        'BrowserRateLimiter'
      );
      
      return { allowed: false, waitTime };
    }

    // 允许访问，记录请求
    records.push({ timestamp: now, count: 1 });
    this.requests.set(key, records);
    
    logger.debug(
      `Browser access to ${domain} allowed: ${records.length}/${this.maxRequests} requests in window`,
      'BrowserRateLimiter'
    );

    return { allowed: true };
  }

  /**
   * 强制等待并允许访问
   * @param domain 域名
   */
  async waitAndAllow(domain: string): Promise<void> {
    const result = await this.checkAndWait(domain);
    
    if (!result.allowed && result.waitTime) {
      logger.info(
        `Waiting ${result.waitTime}ms before accessing ${domain}`,
        'BrowserRateLimiter'
      );
      await this.sleep(result.waitTime);
      
      // 递归调用直到允许访问
      return this.waitAndAllow(domain);
    }
  }

  /**
   * 获取域名的当前状态
   */
  getStatus(domain: string): {
    requestsInWindow: number;
    maxRequests: number;
    nextAllowedTime?: number;
  } {
    const now = Date.now();
    const key = `browser_access:${domain}`;
    const records = (this.requests.get(key) || []).filter(
      record => now - record.timestamp < this.windowMs
    );

    let nextAllowedTime: number | undefined;
    
    if (records.length >= this.maxRequests) {
      const oldestRecord = records[0];
      nextAllowedTime = oldestRecord.timestamp + this.windowMs;
    } else if (records.length > 0) {
      const lastRequest = records[records.length - 1];
      const minIntervalEnd = lastRequest.timestamp + this.minInterval;
      if (minIntervalEnd > now) {
        nextAllowedTime = minIntervalEnd;
      }
    }

    return {
      requestsInWindow: records.length,
      maxRequests: this.maxRequests,
      nextAllowedTime,
    };
  }

  /**
   * 清理过期记录
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, records] of this.requests.entries()) {
      const validRecords = records.filter(
        record => now - record.timestamp < this.windowMs
      );
      
      if (validRecords.length === 0) {
        this.requests.delete(key);
        cleanedCount++;
      } else if (validRecords.length !== records.length) {
        this.requests.set(key, validRecords);
      }
    }

    if (cleanedCount > 0) {
      logger.debug(
        `Cleaned up ${cleanedCount} expired browser rate limit records`,
        'BrowserRateLimiter'
      );
    }
  }

  /**
   * 重置指定域名的频率限制
   */
  reset(domain?: string): void {
    if (domain) {
      const key = `browser_access:${domain}`;
      this.requests.delete(key);
      logger.info(`Browser rate limit reset for ${domain}`, 'BrowserRateLimiter');
    } else {
      this.requests.clear();
      logger.info('All browser rate limits reset', 'BrowserRateLimiter');
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalDomains: number;
    totalRequests: number;
    memoryUsage: string;
  } {
    const totalDomains = this.requests.size;
    let totalRequests = 0;
    
    for (const records of this.requests.values()) {
      totalRequests += records.length;
    }

    const memoryUsage = `${Math.round(
      (JSON.stringify([...this.requests]).length * 2) / 1024
    )} KB`;

    return {
      totalDomains,
      totalRequests,
      memoryUsage,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建默认实例 - 针对招聘网站的保守配置，支持环境变量配置
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) || defaultValue : defaultValue;
};

export const browserRateLimiter = new BrowserRateLimiter(
  getEnvNumber('BROWSER_RATE_LIMIT_WINDOW_MS', 60000), // 默认1分钟窗口
  getEnvNumber('BROWSER_RATE_LIMIT_MAX_REQUESTS', 2),   // 默认每分钟最多2次请求
  getEnvNumber('BROWSER_RATE_LIMIT_MIN_INTERVAL_MS', 15000) // 默认请求间隔至少15秒
);

// 定期清理过期记录
setInterval(() => {
  browserRateLimiter.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次