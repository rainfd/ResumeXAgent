/**
 * 日志服务
 * 提供结构化日志记录功能，替代 console.log
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * 日志记录器类
 */
export class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    // 根据环境设置日志级别
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      this.minLevel = LogLevel.DEBUG;
    } else if (env === 'test') {
      this.minLevel = LogLevel.WARN;
    } else {
      this.minLevel = LogLevel.INFO;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 设置最小日志级别
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * 记录调试信息
   */
  debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * 记录一般信息
   */
  info(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * 记录警告信息
   */
  warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * 记录错误信息
   */
  error(
    message: string,
    context?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  /**
   * 核心日志记录方法
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      error,
    };

    this.writeLog(entry);
  }

  /**
   * 写入日志
   */
  private writeLog(entry: LogEntry): void {
    const levelString = LogLevel[entry.level];
    const contextString = entry.context ? `[${entry.context}]` : '';
    const timestamp = entry.timestamp;

    // 构建日志消息
    let logMessage = `${timestamp} ${levelString} ${contextString} ${entry.message}`;

    // 添加元数据
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += ` | ${JSON.stringify(entry.metadata)}`;
    }

    // 根据日志级别选择输出方式
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        if (entry.error) {
          console.error('Error details:', entry.error);
        }
        break;
    }
  }

  /**
   * 记录数据库操作
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    recordId?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const logMetadata = {
      table,
      recordId,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata,
    };

    this.info(`Database ${operation}`, 'DATABASE', logMetadata);
  }

  /**
   * 记录API请求
   */
  logApiRequest(
    method: string,
    path: string,
    statusCode?: number,
    duration?: number,
    userId?: string
  ): void {
    const metadata = {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      userId,
    };

    if (statusCode && statusCode >= 400) {
      this.warn(`API request failed`, 'API', metadata);
    } else {
      this.info(`API request`, 'API', metadata);
    }
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): void {
    const metadata = {
      severity,
      ...details,
    };

    if (severity === 'critical' || severity === 'high') {
      this.error(`Security event: ${event}`, 'SECURITY', undefined, metadata);
    } else {
      this.warn(`Security event: ${event}`, 'SECURITY', metadata);
    }
  }

  /**
   * 记录性能指标
   */
  logPerformance(
    operation: string,
    duration: number,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const logMetadata = {
      duration: `${duration}ms`,
      ...metadata,
    };

    if (duration > 1000) {
      this.warn(
        `Slow operation: ${operation}`,
        context || 'PERFORMANCE',
        logMetadata
      );
    } else {
      this.debug(
        `Performance: ${operation}`,
        context || 'PERFORMANCE',
        logMetadata
      );
    }
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 便捷函数导出
export const logInfo = (
  message: string,
  context?: string,
  metadata?: Record<string, any>
) => {
  logger.info(message, context, metadata);
};

export const logError = (
  message: string,
  context?: string,
  error?: Error,
  metadata?: Record<string, any>
) => {
  logger.error(message, context, error, metadata);
};

export const logWarn = (
  message: string,
  context?: string,
  metadata?: Record<string, any>
) => {
  logger.warn(message, context, metadata);
};

export const logDebug = (
  message: string,
  context?: string,
  metadata?: Record<string, any>
) => {
  logger.debug(message, context, metadata);
};
