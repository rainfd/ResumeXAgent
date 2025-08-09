import { 
  IGrammarCheckResult, 
  IGrammarIssue, 
  IssueSeverity,
  ICheckStatistics 
} from '../types/grammar-issue.types';
import { logger } from '../utils/logger';

export interface IReportOptions {
  format: 'html' | 'pdf' | 'word';
  includeSummary: boolean;
  includeIssueDetails: boolean;
  includeStatistics: boolean;
  includeRecommendations: boolean;
  customTemplate?: string;
  brandName?: string;
  brandLogo?: string;
}

export interface IReportData {
  title: string;
  content: string;
  filename: string;
  contentType: string;
  size: number;
  generatedAt: Date;
}

/**
 * 报告生成服务
 */
export class ReportGeneratorService {
  
  /**
   * 生成语法检测报告
   */
  async generateReport(
    result: IGrammarCheckResult,
    options: IReportOptions
  ): Promise<IReportData> {
    try {
      logger.info('开始生成报告', {
        checkId: result.id,
        format: options.format
      });

      const reportContent = await this.buildReportContent(result, options);
      
      const reportData: IReportData = {
        title: `简历语法检测报告_${result.id}`,
        content: reportContent,
        filename: this.generateFilename(result.id, options.format),
        contentType: this.getContentType(options.format),
        size: Buffer.byteLength(reportContent, 'utf8'),
        generatedAt: new Date()
      };

      logger.info('报告生成完成', {
        checkId: result.id,
        format: options.format,
        size: reportData.size
      });

      return reportData;
    } catch (error) {
      logger.error('报告生成失败', { 
        checkId: result.id,
        format: options.format,
        error 
      });
      throw error;
    }
  }

  /**
   * 构建报告内容
   */
  private async buildReportContent(
    result: IGrammarCheckResult,
    options: IReportOptions
  ): Promise<string> {
    switch (options.format) {
      case 'html':
        return this.generateHTMLReport(result, options);
      case 'pdf':
        return this.generatePDFReport(result, options);
      case 'word':
        return this.generateWordReport(result, options);
      default:
        throw new Error(`不支持的报告格式: ${options.format}`);
    }
  }

  /**
   * 生成HTML格式报告
   */
  private generateHTMLReport(
    result: IGrammarCheckResult,
    options: IReportOptions
  ): string {
    const { brandName = '简历助手', brandLogo } = options;
    const reportDate = new Date().toLocaleString('zh-CN');
    
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>简历语法检测报告</title>
    <style>
        body { 
            font-family: "Microsoft YaHei", Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #4CAF50; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .logo { max-width: 150px; margin-bottom: 10px; }
        h1 { color: #4CAF50; margin: 0; }
        .meta { color: #666; font-size: 14px; margin-top: 10px; }
        .summary { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
        }
        .score { 
            font-size: 24px; 
            font-weight: bold; 
            color: #4CAF50; 
            text-align: center; 
            margin: 10px 0; 
        }
        .stats { 
            display: flex; 
            justify-content: space-around; 
            text-align: center; 
            margin: 20px 0; 
        }
        .stat-item { flex: 1; }
        .stat-number { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 12px; color: #666; }
        .error { color: #f44336; }
        .warning { color: #ff9800; }
        .suggestion { color: #2196f3; }
        .issue { 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px; 
            background: #fff; 
        }
        .issue-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 10px; 
        }
        .issue-badge { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
            margin-right: 10px; 
            color: white; 
        }
        .badge-error { background-color: #f44336; }
        .badge-warning { background-color: #ff9800; }
        .badge-suggestion { background-color: #2196f3; }
        .fix-suggestion { 
            background: #e8f5e8; 
            padding: 10px; 
            border-radius: 4px; 
            margin-top: 10px; 
        }
        .recommendation { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 20px; 
        }
        .footer { 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
        }
    </style>
</head>
<body>
    <div class="header">
        ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" class="logo">` : ''}
        <h1>简历语法检测报告</h1>
        <div class="meta">
            生成时间: ${reportDate} | 检测ID: ${result.id}
            ${result.resume_id ? ` | 简历ID: ${result.resume_id}` : ''}
        </div>
    </div>
`;

    // 添加摘要部分
    if (options.includeSummary) {
      html += this.generateSummarySection(result);
    }

    // 添加统计信息
    if (options.includeStatistics) {
      html += this.generateStatisticsSection(result.statistics);
    }

    // 添加问题详情
    if (options.includeIssueDetails && result.issues.length > 0) {
      html += this.generateIssuesSection(result.issues);
    }

    // 添加建议部分
    if (options.includeRecommendations) {
      html += this.generateRecommendationsSection(result);
    }

    html += `
    <div class="footer">
        <p>本报告由 ${brandName} 自动生成 | 处理时间: ${result.processing_time}ms</p>
        <p>建议定期检查简历，保持内容的专业性和准确性</p>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 生成摘要部分
   */
  private generateSummarySection(result: IGrammarCheckResult): string {
    const { statistics } = result;
    const scoreColor = this.getScoreColor(statistics.overall_score);
    
    return `
    <div class="summary">
        <h2>检测摘要</h2>
        <div class="score" style="color: ${scoreColor}">
            总体评分: ${statistics.overall_score}/100
        </div>
        <p>可读性评分: ${statistics.readability_score}/100</p>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number error">${statistics.errors}</div>
                <div class="stat-label">错误</div>
            </div>
            <div class="stat-item">
                <div class="stat-number warning">${statistics.warnings}</div>
                <div class="stat-label">警告</div>
            </div>
            <div class="stat-item">
                <div class="stat-number suggestion">${statistics.suggestions}</div>
                <div class="stat-label">建议</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${statistics.total_issues}</div>
                <div class="stat-label">总计</div>
            </div>
        </div>
    </div>`;
  }

  /**
   * 生成统计信息部分
   */
  private generateStatisticsSection(statistics: ICheckStatistics): string {
    return `
    <div class="section">
        <h2>详细统计</h2>
        <ul>
            <li>问题总数: ${statistics.total_issues}</li>
            <li>严重错误: ${statistics.errors} 个</li>
            <li>警告问题: ${statistics.warnings} 个</li>
            <li>优化建议: ${statistics.suggestions} 个</li>
            <li>整体评分: ${statistics.overall_score}/100</li>
            <li>可读性评分: ${statistics.readability_score}/100</li>
        </ul>
    </div>`;
  }

  /**
   * 生成问题详情部分
   */
  private generateIssuesSection(issues: IGrammarIssue[]): string {
    const groupedIssues = this.groupIssuesBySeverity(issues);
    
    let html = '<div class="section"><h2>问题详情</h2>';

    // 按严重程度显示问题
    ['error', 'warning', 'suggestion'].forEach(severity => {
      const severityIssues = groupedIssues[severity as IssueSeverity];
      if (severityIssues.length > 0) {
        html += `<h3>${this.getSeverityLabel(severity as IssueSeverity)} (${severityIssues.length})</h3>`;
        severityIssues.forEach((issue, index) => {
          html += this.generateIssueItem(issue, index + 1);
        });
      }
    });

    html += '</div>';
    return html;
  }

  /**
   * 生成单个问题项
   */
  private generateIssueItem(issue: IGrammarIssue, index: number): string {
    const badgeClass = `badge-${issue.severity}`;
    const severityLabel = this.getSeverityLabel(issue.severity);
    
    return `
    <div class="issue">
        <div class="issue-header">
            <span class="issue-badge ${badgeClass}">${severityLabel}</span>
            <strong>问题 ${index}</strong>
            <span style="margin-left: auto; font-size: 12px; color: #666;">
                第${issue.position.line}行:${issue.position.column}列
            </span>
        </div>
        <p><strong>问题描述:</strong> ${issue.message}</p>
        <p><strong>分类:</strong> ${issue.category || '未分类'}</p>
        ${issue.position.context ? `<p><strong>上下文:</strong> <code>${issue.position.context}</code></p>` : ''}
        <div class="fix-suggestion">
            <strong>建议修改:</strong><br>
            <span style="text-decoration: line-through; color: #f44336;">${issue.suggestion.original}</span>
            →
            <span style="color: #4CAF50; font-weight: bold;">${issue.suggestion.replacement}</span>
            <br>
            <small>置信度: ${Math.round(issue.suggestion.confidence * 100)}%</small>
        </div>
    </div>`;
  }

  /**
   * 生成建议部分
   */
  private generateRecommendationsSection(result: IGrammarCheckResult): string {
    const recommendations = this.generateRecommendations(result);
    
    let html = '<div class="section"><h2>优化建议</h2>';
    recommendations.forEach((rec, index) => {
      html += `
      <div class="recommendation">
          <h4>${index + 1}. ${rec.title}</h4>
          <p>${rec.description}</p>
      </div>`;
    });
    html += '</div>';
    
    return html;
  }

  /**
   * 生成PDF格式报告（简化版本）
   */
  private generatePDFReport(
    result: IGrammarCheckResult,
    options: IReportOptions
  ): string {
    // 简化实现：返回HTML内容，实际项目中需要使用PDF生成库
    const htmlContent = this.generateHTMLReport(result, options);
    return `PDF Report Content (需要PDF生成库实现)\n\nHTML版本:\n${htmlContent}`;
  }

  /**
   * 生成Word格式报告（简化版本）
   */
  private generateWordReport(
    result: IGrammarCheckResult,
    options: IReportOptions
  ): string {
    // 简化实现：返回纯文本内容，实际项目中需要使用Word生成库
    let content = `简历语法检测报告\n`;
    content += `检测时间: ${new Date(result.created_at).toLocaleString()}\n`;
    content += `检测ID: ${result.id}\n\n`;
    
    content += `=== 检测摘要 ===\n`;
    content += `总体评分: ${result.statistics.overall_score}/100\n`;
    content += `可读性评分: ${result.statistics.readability_score}/100\n`;
    content += `错误: ${result.statistics.errors} 个\n`;
    content += `警告: ${result.statistics.warnings} 个\n`;
    content += `建议: ${result.statistics.suggestions} 个\n\n`;
    
    if (result.issues.length > 0) {
      content += `=== 问题详情 ===\n`;
      result.issues.forEach((issue, index) => {
        content += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
        content += `   位置: 第${issue.position.line}行:${issue.position.column}列\n`;
        content += `   建议: ${issue.suggestion.original} → ${issue.suggestion.replacement}\n\n`;
      });
    }
    
    return content;
  }

  /**
   * 生成建议列表
   */
  private generateRecommendations(result: IGrammarCheckResult): Array<{title: string, description: string}> {
    const recommendations = [];
    const stats = result.statistics;

    if (stats.errors > 0) {
      recommendations.push({
        title: '优先修复错误',
        description: `发现 ${stats.errors} 个严重错误，建议优先修复这些问题以提升简历的专业性。`
      });
    }

    if (stats.overall_score < 70) {
      recommendations.push({
        title: '整体优化',
        description: '简历整体评分较低，建议全面检查语法、格式和内容结构。'
      });
    }

    if (stats.readability_score < 60) {
      recommendations.push({
        title: '提升可读性',
        description: '简历可读性有待改善，建议优化句子结构，使用简洁明了的表达方式。'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: '保持专业性',
        description: '简历质量良好，建议定期检查以保持内容的专业性和准确性。'
      });
    }

    return recommendations;
  }

  /**
   * 辅助方法
   */
  private generateFilename(checkId: string, format: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `grammar-report-${checkId}-${timestamp}.${format}`;
  }

  private getContentType(format: string): string {
    const contentTypes = {
      html: 'text/html',
      pdf: 'application/pdf',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[format as keyof typeof contentTypes] || 'text/plain';
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  }

  private getSeverityLabel(severity: IssueSeverity): string {
    const labels = {
      error: '错误',
      warning: '警告',
      suggestion: '建议'
    };
    return labels[severity];
  }

  private groupIssuesBySeverity(issues: IGrammarIssue[]): Record<IssueSeverity, IGrammarIssue[]> {
    return issues.reduce((groups, issue) => {
      if (!groups[issue.severity]) {
        groups[issue.severity] = [];
      }
      groups[issue.severity].push(issue);
      return groups;
    }, {} as Record<IssueSeverity, IGrammarIssue[]>);
  }
}