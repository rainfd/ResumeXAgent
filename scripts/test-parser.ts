#!/usr/bin/env tsx

/**
 * 简历解析器测试脚本
 * 用于测试不同格式简历文件的解析功能
 */

import fs from 'fs';
import path from 'path';
import { ParserService } from '../lib/services/parser.service';
import { ResumeMapperService } from '../lib/services/resume-mapper.service';
import { ResumeValidator } from '../lib/utils/resume-validator';
import { FileType } from '../lib/types/resume.types';

const TEST_RESUMES_DIR = path.join(__dirname, '../data/test-resumes');

interface TestResult {
  file: string;
  fileType: FileType;
  success: boolean;
  error?: string;
  parseTime?: number;
  basicInfo?: any;
  sectionsCount?: number;
  confidence?: number;
}

async function testFile(
  filePath: string,
  fileType: FileType
): Promise<TestResult> {
  const fileName = path.basename(filePath);
  const startTime = Date.now();

  try {
    console.log(`\n📄 测试文件: ${fileName}`);

    // 读取文件
    let content: Buffer | string;
    if (fileType === 'pdf') {
      content = fs.readFileSync(filePath);
    } else {
      content = fs.readFileSync(filePath, 'utf-8');
    }

    console.log(`📏 文件大小: ${Buffer.byteLength(content)} 字节`);

    // 创建解析器实例
    const parser = new ParserService({
      language: 'zh-CN',
      enable_ai_parsing: false,
    });

    // 解析简历
    const parseResult = await parser.parseResume(content, fileType);
    const parseTime = Date.now() - startTime;

    // 验证解析结果
    const validationResult = ResumeValidator.validateParsedResume(parseResult);

    // 映射到数据库格式
    const mappedData = ResumeMapperService.mapToDatabase(
      parseResult,
      fileName,
      fileType,
      typeof content === 'string' ? content : undefined
    );

    console.log(`✅ 解析成功!`);
    console.log(`⏱️  解析耗时: ${parseTime}ms`);
    console.log(
      `🎯 置信度: ${(parseResult.metadata.confidence * 100).toFixed(1)}%`
    );
    console.log(`📊 章节数量: ${parseResult.sections.length}`);
    console.log(`👤 基本信息: ${parseResult.basic_info.name || '未识别'}`);

    // 显示提取的基本信息
    if (parseResult.basic_info.email) {
      console.log(`📧 邮箱: ${parseResult.basic_info.email}`);
    }
    if (parseResult.basic_info.phone) {
      console.log(`📱 电话: ${parseResult.basic_info.phone}`);
    }

    // 显示章节信息
    console.log('\n📋 提取的章节:');
    parseResult.sections.forEach((section, index) => {
      console.log(
        `  ${index + 1}. ${section.title} (${section.type}) - ${section.items.length} 项`
      );
    });

    // 显示验证结果
    if (validationResult.warnings.length > 0) {
      console.log('\n⚠️  验证警告:');
      validationResult.warnings.forEach((warning) => {
        console.log(`  - ${warning}`);
      });
    }

    if (validationResult.errors.length > 0) {
      console.log('\n❌ 验证错误:');
      validationResult.errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }

    return {
      file: fileName,
      fileType,
      success: true,
      parseTime,
      basicInfo: parseResult.basic_info,
      sectionsCount: parseResult.sections.length,
      confidence: parseResult.metadata.confidence,
    };
  } catch (error) {
    const parseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(`❌ 解析失败: ${errorMessage}`);

    return {
      file: fileName,
      fileType,
      success: false,
      error: errorMessage,
      parseTime,
    };
  }
}

async function runTests() {
  console.log('🚀 开始简历解析器测试\n');

  const results: TestResult[] = [];

  // 测试文本文件
  const txtDir = path.join(TEST_RESUMES_DIR, 'txt');
  if (fs.existsSync(txtDir)) {
    const txtFiles = fs.readdirSync(txtDir).filter((f) => f.endsWith('.txt'));
    for (const file of txtFiles) {
      const filePath = path.join(txtDir, file);
      const result = await testFile(filePath, 'txt');
      results.push(result);
    }
  }

  // 测试 Markdown 文件
  const mdDir = path.join(TEST_RESUMES_DIR, 'markdown');
  if (fs.existsSync(mdDir)) {
    const mdFiles = fs.readdirSync(mdDir).filter((f) => f.endsWith('.md'));
    for (const file of mdFiles) {
      const filePath = path.join(mdDir, file);
      const result = await testFile(filePath, 'markdown');
      results.push(result);
    }
  }

  // 测试 PDF 文件
  const pdfDir = path.join(TEST_RESUMES_DIR, 'pdf');
  if (fs.existsSync(pdfDir)) {
    const pdfFiles = fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'));
    for (const file of pdfFiles) {
      const filePath = path.join(pdfDir, file);
      const result = await testFile(filePath, 'pdf');
      results.push(result);
    }
  }

  // 生成测试报告
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;
  const successRate =
    totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '0';

  console.log(`总测试文件数: ${totalCount}`);
  console.log(`成功解析: ${successCount}`);
  console.log(`失败解析: ${totalCount - successCount}`);
  console.log(`成功率: ${successRate}%`);

  if (results.length > 0) {
    const avgTime =
      results.reduce((sum, r) => sum + (r.parseTime || 0), 0) / results.length;
    console.log(`平均解析时间: ${avgTime.toFixed(1)}ms`);

    const avgConfidence =
      results
        .filter((r) => r.success && r.confidence !== undefined)
        .reduce((sum, r) => sum + (r.confidence || 0), 0) / successCount;

    if (successCount > 0) {
      console.log(`平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    }
  }

  // 详细结果
  console.log('\n📋 详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const confidence = result.confidence
      ? `${(result.confidence * 100).toFixed(1)}%`
      : 'N/A';
    const sections =
      result.sectionsCount !== undefined
        ? `${result.sectionsCount}章节`
        : 'N/A';

    console.log(`${index + 1}. ${status} ${result.file} (${result.fileType})`);
    console.log(
      `   解析时间: ${result.parseTime}ms | 置信度: ${confidence} | ${sections}`
    );

    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }

    if (result.basicInfo?.name) {
      console.log(`   姓名: ${result.basicInfo.name}`);
    }
  });

  console.log('\n✨ 测试完成!');

  // 如果有失败的测试，退出码为1
  if (successCount < totalCount) {
    process.exit(1);
  }
}

// 运行测试
runTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
