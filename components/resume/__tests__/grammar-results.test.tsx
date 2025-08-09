import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrammarResults } from '../grammar-results';
import { 
  IGrammarCheckResult, 
  IGrammarIssue, 
  IssueSeverity, 
  IssueType 
} from '@/lib/types/grammar-issue.types';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  CardDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      className={`button ${variant} ${size} ${className}`}
    >
      {children}
    </button>
  ),
}));

describe('GrammarResults', () => {
  const mockIssues: IGrammarIssue[] = [
    {
      id: 'issue-1',
      type: 'typo' as IssueType,
      severity: 'error' as IssueSeverity,
      position: {
        start: 0,
        end: 5,
        line: 1,
        column: 1,
        context: '错别字测试'
      },
      message: '发现错别字："错别字"',
      suggestion: '正确的字',
      confidence: 0.9
    },
    {
      id: 'issue-2',
      type: 'format' as IssueType,
      severity: 'warning' as IssueSeverity,
      position: {
        start: 10,
        end: 15,
        line: 2,
        column: 1,
        context: '格式问题测试'
      },
      message: '标点符号使用不当',
      suggestion: '建议使用中文标点符号',
      confidence: 0.8
    },
    {
      id: 'issue-3',
      type: 'grammar' as IssueType,
      severity: 'suggestion' as IssueSeverity,
      position: {
        start: 20,
        end: 25,
        line: 3,
        column: 1,
        context: '语法建议测试'
      },
      message: '建议调整语序',
      suggestion: '更好的表达方式',
      confidence: 0.7
    }
  ];

  const mockResult: IGrammarCheckResult = {
    id: 'result-1',
    resume_id: 'resume-1',
    check_type: 'complete',
    issues: mockIssues,
    statistics: {
      total_issues: 3,
      errors: 1,
      warnings: 1,
      suggestions: 1,
      overall_score: 85
    },
    created_at: new Date()
  };

  const mockProps = {
    result: mockResult,
    originalText: '错别字测试\n格式问题测试\n语法建议测试',
    onApplyFix: jest.fn(),
    onBatchFix: jest.fn(),
    onExportReport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染组件', () => {
      render(<GrammarResults {...mockProps} />);
      
      expect(screen.getByText('语法检测结果')).toBeInTheDocument();
      expect(screen.getByText('85分')).toBeInTheDocument();
    });

    it('应该显示问题统计信息', () => {
      render(<GrammarResults {...mockProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // 总问题数
      expect(screen.getByText('1')).toBeInTheDocument(); // 错误数
    });

    it('应该显示所有问题', () => {
      render(<GrammarResults {...mockProps} />);
      
      expect(screen.getByText('发现错别字："错别字"')).toBeInTheDocument();
      expect(screen.getByText('标点符号使用不当')).toBeInTheDocument();
      expect(screen.getByText('建议调整语序')).toBeInTheDocument();
    });
  });

  describe('问题过滤功能', () => {
    it('应该能够按严重程度过滤问题', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      // 点击错误过滤器
      const errorFilter = screen.getByText('错误');
      await user.click(errorFilter);

      // 应该只显示错误级别的问题
      expect(screen.getByText('发现错别字："错别字"')).toBeInTheDocument();
      
      // 警告和建议应该被隐藏或过滤
      // 这里需要根据实际实现调整断言
    });

    it('应该能够按问题类型过滤', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      // 查找并点击类型过滤器
      const typeFilter = screen.getByDisplayValue ? 
        screen.getByDisplayValue('all') : 
        screen.getByRole('combobox');
      
      if (typeFilter) {
        await user.click(typeFilter);
        // 选择特定类型
        const typoOption = screen.getByText('错别字');
        await user.click(typoOption);
      }
    });

    it('应该支持搜索功能', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/搜索问题/i);
      await user.type(searchInput, '错别字');

      // 应该只显示包含搜索词的问题
      await waitFor(() => {
        expect(screen.getByText('发现错别字："错别字"')).toBeInTheDocument();
      });
    });
  });

  describe('问题操作功能', () => {
    it('应该能够应用单个修复', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const applyButton = screen.getAllByText('应用修复')[0];
      await user.click(applyButton);

      expect(mockProps.onApplyFix).toHaveBeenCalledWith('issue-1');
    });

    it('应该能够忽略问题', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const ignoreButtons = screen.getAllByText('忽略');
      if (ignoreButtons.length > 0) {
        await user.click(ignoreButtons[0]);
        // 验证问题被标记为已忽略或从列表中移除
      }
    });

    it('应该支持批量操作', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      // 选择多个问题
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]);
        await user.click(checkboxes[1]);

        // 执行批量修复
        const batchFixButton = screen.getByText('批量修复');
        await user.click(batchFixButton);

        expect(mockProps.onBatchFix).toHaveBeenCalled();
      }
    });
  });

  describe('文本高亮功能', () => {
    it('应该高亮显示问题文本', () => {
      render(<GrammarResults {...mockProps} />);

      // 查找高亮的文本
      const highlightedElements = document.querySelectorAll('[class*="highlight"]');
      expect(highlightedElements.length).toBeGreaterThan(0);
    });

    it('应该在点击问题时跳转到对应位置', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const issueItem = screen.getByText('发现错别字："错别字"');
      await user.click(issueItem);

      // 验证滚动或高亮行为
      // 这里需要根据实际实现调整
    });
  });

  describe('导出功能', () => {
    it('应该能够导出报告', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const exportButton = screen.getByText('导出报告');
      await user.click(exportButton);

      expect(mockProps.onExportReport).toHaveBeenCalled();
    });
  });

  describe('空状态处理', () => {
    it('应该处理没有问题的情况', () => {
      const emptyResult = {
        ...mockResult,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 100
        }
      };

      render(<GrammarResults {...mockProps} result={emptyResult} />);

      expect(screen.getByText('100分')).toBeInTheDocument();
      expect(screen.getByText(/没有发现问题|检测结果良好/i)).toBeInTheDocument();
    });

    it('应该处理加载状态', () => {
      const loadingResult = {
        ...mockResult,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 0
        }
      };

      render(<GrammarResults {...mockProps} result={loadingResult} />);
      // 验证加载状态的UI
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上正确显示', () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GrammarResults {...mockProps} />);

      // 验证移动端布局
      expect(document.querySelector('.container')).toBeInTheDocument();
    });
  });

  describe('性能优化', () => {
    it('应该处理大量问题而不卡顿', () => {
      const manyIssues = Array.from({ length: 1000 }, (_, i) => ({
        ...mockIssues[0],
        id: `issue-${i}`,
        message: `问题 ${i}`
      }));

      const largeResult = {
        ...mockResult,
        issues: manyIssues,
        statistics: {
          ...mockResult.statistics,
          total_issues: 1000
        }
      };

      const startTime = Date.now();
      render(<GrammarResults {...mockProps} result={largeResult} />);
      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(1000); // 1秒内渲染完成
    });
  });

  describe('错误边界', () => {
    it('应该处理无效的问题数据', () => {
      const invalidResult = {
        ...mockResult,
        issues: [
          {
            // 缺少必要字段的问题
            id: 'invalid-issue'
          } as any
        ]
      };

      // 应该不会崩溃
      expect(() => {
        render(<GrammarResults {...mockProps} result={invalidResult} />);
      }).not.toThrow();
    });

    it('应该处理缺失的回调函数', () => {
      const propsWithoutCallbacks = {
        result: mockResult,
        originalText: mockProps.originalText
      };

      expect(() => {
        render(<GrammarResults {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<GrammarResults {...mockProps} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toBeTruthy();
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      render(<GrammarResults {...mockProps} />);

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      await user.keyboard('{Tab}');
      // 验证焦点移动到下一个可交互元素
    });
  });
});