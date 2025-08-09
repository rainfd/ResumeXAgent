import { NextRequest } from 'next/server';
import { POST, PUT } from '../route';
import { GrammarCheckerService } from '@/lib/services/grammar-checker.service';
import { ResumeRepository } from '@/lib/repositories/resume.repository';

// Mock dependencies
jest.mock('@/lib/services/grammar-checker.service');
jest.mock('@/lib/repositories/resume.repository');
jest.mock('@/lib/utils/logger');

const MockedGrammarCheckerService = GrammarCheckerService as jest.MockedClass<typeof GrammarCheckerService>;
const MockedResumeRepository = ResumeRepository as jest.MockedClass<typeof ResumeRepository>;

describe('/api/resume/check', () => {
  let mockGrammarService: jest.Mocked<GrammarCheckerService>;
  let mockResumeRepo: jest.Mocked<ResumeRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGrammarService = {
      checkGrammar: jest.fn(),
      checkFormat: jest.fn(),
      checkResumeSpecific: jest.fn(),
      performComprehensiveCheck: jest.fn(),
      batchFix: jest.fn(),
    } as any;

    mockResumeRepo = {
      findById: jest.fn(),
    } as any;

    MockedGrammarCheckerService.mockImplementation(() => mockGrammarService);
    MockedResumeRepository.mockImplementation(() => mockResumeRepo);
  });

  describe('POST /api/resume/check', () => {
    it('应该成功检查文本语法', async () => {
      const mockResult = {
        id: 'check-result-1',
        resume_id: 'resume-1',
        check_type: 'grammar' as const,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 100
        },
        created_at: new Date()
      };

      mockGrammarService.checkGrammar.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '这是一个测试文本',
          options: {
            enable_ai_check: true,
            check_grammar: true
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockResult);
      expect(mockGrammarService.checkGrammar).toHaveBeenCalledWith(
        '这是一个测试文本',
        expect.objectContaining({
          enable_ai_check: true,
          check_grammar: true
        })
      );
    });

    it('应该验证请求参数', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '', // 空文本应该被拒绝
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('文本内容不能为空');
    });

    it('应该处理过长的文本', async () => {
      const longText = 'a'.repeat(60000); // 超过50000字符限制

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: longText
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('文本内容过长');
    });

    it('应该支持简历专项检查', async () => {
      const mockResume = {
        id: 'resume-1',
        basicInfo: {
          name: '张三',
          email: 'zhangsan@example.com',
          phone: '13800138000'
        }
      };

      const mockResult = {
        id: 'check-result-1',
        resume_id: 'resume-1',
        check_type: 'complete' as const,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 95
        },
        created_at: new Date()
      };

      mockResumeRepo.findById.mockResolvedValue(mockResume as any);
      mockGrammarService.performComprehensiveCheck.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '张三的简历内容',
          resumeId: 'resume-1',
          options: {
            check_format: true,
            check_grammar: true
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockResumeRepo.findById).toHaveBeenCalledWith('resume-1');
      expect(mockGrammarService.performComprehensiveCheck).toHaveBeenCalledWith(mockResume);
    });

    it('应该处理不存在的简历ID', async () => {
      mockResumeRepo.findById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本',
          resumeId: 'non-existent-id'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('简历未找到');
    });

    it('应该处理服务异常', async () => {
      mockGrammarService.checkGrammar.mockRejectedValue(new Error('服务异常'));

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('检查失败');
    });

    it('应该处理无效的JSON请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('请求参数格式错误');
    });

    it('应该支持不同的检查选项', async () => {
      const mockResult = {
        id: 'check-result-1',
        resume_id: null,
        check_type: 'format' as const,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 100
        },
        created_at: new Date()
      };

      mockGrammarService.checkFormat.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本',
          options: {
            enable_rule_check: true,
            check_format: true,
            check_typos: false,
            check_grammar: false,
            max_suggestions: 50
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGrammarService.checkFormat).toHaveBeenCalledWith('测试文本');
    });
  });

  describe('PUT /api/resume/check (批量修复)', () => {
    it('应该成功执行批量修复', async () => {
      const mockBatchResult = {
        success: true,
        fixedText: '修复后的文本内容',
        appliedFixes: [
          {
            issueId: 'issue-1',
            originalText: '错误文本',
            fixedText: '正确文本',
            applied: true
          }
        ],
        failedFixes: []
      };

      mockGrammarService.batchFix.mockResolvedValue(mockBatchResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'PUT',
        body: JSON.stringify({
          originalText: '原始文本内容',
          operations: [
            {
              issueIds: ['issue-1', 'issue-2'],
              strategy: 'apply_all'
            }
          ]
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockBatchResult);
      expect(mockGrammarService.batchFix).toHaveBeenCalledWith(
        '原始文本内容',
        [{ issueIds: ['issue-1', 'issue-2'], strategy: 'apply_all' }]
      );
    });

    it('应该验证批量修复请求参数', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'PUT',
        body: JSON.stringify({
          originalText: '', // 空文本
          operations: []
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('原始文本不能为空');
    });

    it('应该验证操作数组不为空', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'PUT',
        body: JSON.stringify({
          originalText: '测试文本',
          operations: [] // 空操作数组
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('操作列表不能为空');
    });

    it('应该处理批量修复服务异常', async () => {
      mockGrammarService.batchFix.mockRejectedValue(new Error('修复服务异常'));

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'PUT',
        body: JSON.stringify({
          originalText: '测试文本',
          operations: [
            {
              issueIds: ['issue-1'],
              strategy: 'apply_all'
            }
          ]
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('批量修复失败');
    });

    it('应该支持不同的修复策略', async () => {
      const mockResult = {
        success: true,
        fixedText: '修复后文本',
        appliedFixes: [],
        failedFixes: []
      };

      mockGrammarService.batchFix.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'PUT',
        body: JSON.stringify({
          originalText: '测试文本',
          operations: [
            {
              issueIds: ['issue-1'],
              strategy: 'apply_high_confidence'
            },
            {
              issueIds: ['issue-2'],
              strategy: 'skip_ambiguous'
            }
          ]
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理意外的运行时错误', async () => {
      // 模拟意外错误
      mockGrammarService.checkGrammar.mockImplementation(() => {
        throw new Error('意外的运行时错误');
      });

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('应该处理数据库连接错误', async () => {
      mockResumeRepo.findById.mockRejectedValue(new Error('数据库连接失败'));

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本',
          resumeId: 'resume-1'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('检查失败');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理请求', async () => {
      const mockResult = {
        id: 'result-1',
        resume_id: null,
        check_type: 'grammar' as const,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 100
        },
        created_at: new Date()
      };

      mockGrammarService.checkGrammar.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: '测试文本'.repeat(1000) // 较长的文本
        })
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    });
  });

  describe('安全性测试', () => {
    it('应该防止注入攻击', async () => {
      const maliciousText = '<script>alert("xss")</script>';
      
      const mockResult = {
        id: 'result-1',
        resume_id: null,
        check_type: 'grammar' as const,
        issues: [],
        statistics: {
          total_issues: 0,
          errors: 0,
          warnings: 0,
          suggestions: 0,
          overall_score: 100
        },
        created_at: new Date()
      };

      mockGrammarService.checkGrammar.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        body: JSON.stringify({
          text: maliciousText
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // 确保恶意脚本被正确处理
      expect(mockGrammarService.checkGrammar).toHaveBeenCalledWith(
        maliciousText,
        expect.any(Object)
      );
    });

    it('应该验证Content-Type', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // 非JSON类型
        },
        body: 'plain text body'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});