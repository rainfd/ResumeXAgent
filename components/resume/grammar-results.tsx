'use client';

import React, { useState, useMemo } from 'react';
import { 
  IGrammarCheckResult, 
  IGrammarIssue, 
  IssueSeverity,
  IssueType,
  IBatchFixOperation 
} from '@/lib/types/grammar-issue.types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GrammarResultsProps {
  result: IGrammarCheckResult;
  originalText: string;
  onApplyFix?: (issueId: string) => void;
  onBatchFix?: (operation: IBatchFixOperation) => void;
  onExportReport?: () => void;
}

interface IssueFilterState {
  severity: IssueSeverity | 'all';
  type: IssueType | 'all';
  category: string | 'all';
}

export function GrammarResults({ 
  result, 
  originalText,
  onApplyFix, 
  onBatchFix,
  onExportReport 
}: GrammarResultsProps) {
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<IssueFilterState>({
    severity: 'all',
    type: 'all',
    category: 'all'
  });
  const [highlightedText, setHighlightedText] = useState<string>('');

  // 获取所有唯一的分类
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      result.issues.map(issue => issue.category).filter(Boolean)
    );
    return Array.from(uniqueCategories);
  }, [result.issues]);

  // 过滤问题
  const filteredIssues = useMemo(() => {
    return result.issues.filter(issue => {
      if (filter.severity !== 'all' && issue.severity !== filter.severity) {
        return false;
      }
      if (filter.type !== 'all' && issue.type !== filter.type) {
        return false;
      }
      if (filter.category !== 'all' && issue.category !== filter.category) {
        return false;
      }
      return true;
    });
  }, [result.issues, filter]);

  // 统计信息
  const stats = useMemo(() => {
    const errors = filteredIssues.filter(i => i.severity === 'error').length;
    const warnings = filteredIssues.filter(i => i.severity === 'warning').length;
    const suggestions = filteredIssues.filter(i => i.severity === 'suggestion').length;
    
    return { errors, warnings, suggestions, total: filteredIssues.length };
  }, [filteredIssues]);

  // 生成高亮文本
  const generateHighlightedText = React.useCallback((text: string, issues: IGrammarIssue[]) => {
    if (!issues.length) return text;

    // 按位置排序，避免重叠
    const sortedIssues = [...issues].sort((a, b) => a.position.start - b.position.start);
    
    let result = '';
    let lastIndex = 0;

    sortedIssues.forEach((issue, index) => {
      // 安全检查：确保位置有效
      if (issue.position.start < 0 || issue.position.end > text.length || 
          issue.position.start >= issue.position.end) {
        return;
      }
      
      // 添加问题前的文本
      result += text.substring(lastIndex, issue.position.start);
      
      // 添加高亮的问题文本
      const issueText = text.substring(issue.position.start, issue.position.end);
      const severityClass = getSeverityHighlightClass(issue.severity);
      // 安全：转义HTML内容
      const escapedText = issueText.replace(/[<>&"]/g, (c) => {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c;
      });
      const escapedMessage = issue.message.replace(/[<>&"]/g, (c) => {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c;
      });
      
      result += `<span class="${severityClass}" data-issue-id="${issue.id}" title="${escapedMessage}">${escapedText}</span>`;
      
      lastIndex = issue.position.end;
    });

    // 添加剩余文本
    result += text.substring(lastIndex);
    return result;
  }, []);

  const getSeverityHighlightClass = (severity: IssueSeverity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-200 border-b-2 border-red-500 cursor-pointer';
      case 'warning':
        return 'bg-yellow-200 border-b-2 border-yellow-500 cursor-pointer';
      case 'suggestion':
        return 'bg-blue-200 border-b-2 border-blue-500 cursor-pointer';
      default:
        return 'bg-gray-200 border-b-2 border-gray-500 cursor-pointer';
    }
  };

  const getSeverityBadgeVariant = (severity: IssueSeverity) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'suggestion':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'suggestion':
        return '💡';
      default:
        return '📝';
    }
  };

  const handleIssueSelect = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(filteredIssues.map(issue => issue.id)));
    }
  };

  const handleBatchFix = () => {
    if (selectedIssues.size > 0 && onBatchFix) {
      onBatchFix({
        issue_ids: Array.from(selectedIssues),
        auto_apply: false,
        preview: true
      });
    }
  };

  React.useEffect(() => {
    setHighlightedText(generateHighlightedText(originalText, filteredIssues));
  }, [originalText, filteredIssues]);

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            语法检测结果
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                总分: {result.statistics.overall_score}/100
              </Badge>
              <Badge variant="outline">
                可读性: {result.statistics.readability_score}/100
              </Badge>
              {onExportReport && (
                <Button size="sm" variant="outline" onClick={onExportReport}>
                  导出报告
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            检测时间: {new Date(result.created_at).toLocaleString()} | 
            处理时间: {result.processing_time}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 font-semibold">{stats.errors}</span>
              <span className="text-sm text-gray-600">错误</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600 font-semibold">{stats.warnings}</span>
              <span className="text-sm text-gray-600">警告</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-semibold">{stats.suggestions}</span>
              <span className="text-sm text-gray-600">建议</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{stats.total}</span>
              <span className="text-sm text-gray-600">总计</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 问题列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>问题列表</span>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSelectAll}
                >
                  {selectedIssues.size === filteredIssues.length ? '取消全选' : '全选'}
                </Button>
                {selectedIssues.size > 0 && onBatchFix && (
                  <Button 
                    size="sm" 
                    onClick={handleBatchFix}
                  >
                    批量修复 ({selectedIssues.size})
                  </Button>
                )}
              </div>
            </CardTitle>
            
            {/* 过滤器 */}
            <div className="flex flex-wrap gap-2 pt-2">
              <select 
                className="px-2 py-1 border rounded text-sm"
                value={filter.severity}
                onChange={(e) => setFilter({...filter, severity: e.target.value as IssueSeverity | 'all'})}
              >
                <option value="all">所有严重程度</option>
                <option value="error">错误</option>
                <option value="warning">警告</option>
                <option value="suggestion">建议</option>
              </select>
              
              <select 
                className="px-2 py-1 border rounded text-sm"
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value as IssueType | 'all'})}
              >
                <option value="all">所有类型</option>
                <option value="typo">错别字</option>
                <option value="grammar">语法</option>
                <option value="format">格式</option>
                <option value="style">文体</option>
                <option value="resume-specific">简历专项</option>
              </select>
              
              <select 
                className="px-2 py-1 border rounded text-sm"
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
              >
                <option value="all">所有分类</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueItem
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssues.has(issue.id)}
                  onSelect={() => handleIssueSelect(issue.id)}
                  onApplyFix={onApplyFix}
                />
              ))}
              {filteredIssues.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {result.issues.length === 0 ? '没有发现问题' : '没有符合条件的问题'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 文本预览 */}
        <Card>
          <CardHeader>
            <CardTitle>文本预览</CardTitle>
            <CardDescription>
              高亮显示检测到的问题，点击可查看详情
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="max-h-96 overflow-y-auto p-3 border rounded bg-gray-50 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.dataset.issueId) {
                  const issue = result.issues.find(i => i.id === target.dataset.issueId);
                  if (issue) {
                    // 可以在这里显示问题详情弹窗
                    console.log('Clicked issue:', issue);
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface IssueItemProps {
  issue: IGrammarIssue;
  isSelected: boolean;
  onSelect: () => void;
  onApplyFix?: (issueId: string) => void;
}

function IssueItem({ issue, isSelected, onSelect, onApplyFix }: IssueItemProps) {
  return (
    <div className={cn(
      "border rounded p-3 transition-colors",
      isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm">{getSeverityIcon(issue.severity)}</span>
              <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                {issue.severity}
              </Badge>
              <Badge variant="outline">{issue.category}</Badge>
              <span className="text-xs text-gray-500">
                行 {issue.position.line}:{issue.position.column}
              </span>
            </div>
            
            <p className="text-sm font-medium mb-2">{issue.message}</p>
            
            {issue.position.context && (
              <div className="bg-gray-100 rounded p-2 mb-2">
                <p className="text-xs text-gray-600 mb-1">上下文:</p>
                <code className="text-xs">{issue.position.context}</code>
              </div>
            )}
            
            <div className="bg-green-50 rounded p-2">
              <p className="text-xs text-gray-600 mb-1">建议修改:</p>
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="line-through text-red-600">{issue.suggestion.original}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-600 font-medium">{issue.suggestion.replacement}</span>
                </div>
                <Badge variant="outline" className="ml-2">
                  {Math.round(issue.suggestion.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {onApplyFix && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onApplyFix(issue.id)}
            className="ml-2"
          >
            应用
          </Button>
        )}
      </div>
    </div>
  );
}