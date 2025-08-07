import { initializeApp, seedDatabase, shutdown } from './init';
import { ResumeRepository } from '../repositories/resume.repository';
import { JobRepository } from '../repositories/job.repository';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { MatchRepository } from '../repositories/match.repository';
import { dbHelpers } from './helpers';
import { logger } from '../utils/logger';

async function testDatabaseOperations(): Promise<void> {
  console.log('🚀 开始数据库功能测试...\n');

  try {
    // 1. 初始化数据库
    console.log('1️⃣ 初始化数据库...');
    const initResult = await initializeApp();
    if (!initResult.success) {
      throw new Error(`初始化失败: ${initResult.errors.join(', ')}`);
    }
    console.log(`✅ 数据库初始化成功，创建了 ${initResult.tablesCreated.length} 个表`);
    console.log(`   表: ${initResult.tablesCreated.join(', ')}`);
    console.log(`   应用了 ${initResult.migrationsApplied} 个迁移\n`);

    // 2. 测试健康检查
    console.log('2️⃣ 测试数据库健康检查...');
    const health = await dbHelpers.checkHealth();
    if (!health.isOpen || !health.canRead || !health.canWrite || !health.tablesExist) {
      throw new Error(`健康检查失败: ${health.lastError}`);
    }
    console.log('✅ 数据库健康检查通过\n');

    // 3. 测试 Repository 基本操作
    console.log('3️⃣ 测试 Repository 基本 CRUD 操作...');
    
    // Resume Repository 测试
    const resumeRepo = new ResumeRepository();
    const testResume = resumeRepo.create({
      original_filename: 'test_resume.txt',
      file_type: 'txt',
      raw_text: 'Test resume content',
      basic_info: {
        name: 'Test User',
        email: 'test@example.com'
      }
    });
    console.log(`✅ 简历创建成功: ${testResume.id}`);

    const foundResume = resumeRepo.findById(testResume.id);
    if (!foundResume || foundResume.original_filename !== 'test_resume.txt') {
      throw new Error('简历查询失败');
    }
    console.log('✅ 简历查询成功');

    // Job Repository 测试
    const jobRepo = new JobRepository();
    const testJob = jobRepo.create({
      title: 'Test Developer',
      company: 'Test Company',
      raw_description: 'Test job description',
      technical_skills: ['JavaScript', 'Node.js']
    });
    console.log(`✅ 岗位创建成功: ${testJob.id}`);

    // Analysis Repository 测试
    const analysisRepo = new AnalysisRepository();
    const testAnalysis = analysisRepo.create({
      resume_id: testResume.id,
      job_id: testJob.id,
      analysis_type: 'optimization',
      ai_model: 'test-model',
      results: { test: 'data' },
      score: 85
    });
    console.log(`✅ 分析记录创建成功: ${testAnalysis.id}`);

    // Match Repository 测试
    const matchRepo = new MatchRepository();
    const testMatch = matchRepo.create({
      resume_id: testResume.id,
      job_id: testJob.id,
      match_score: 78.5,
      strengths: ['JavaScript skills', 'Experience match'],
      gaps: ['Missing AWS experience']
    });
    console.log(`✅ 匹配记录创建成功: ${testMatch.id}`);

    // 4. 测试关联查询
    console.log('\n4️⃣ 测试关联查询...');
    const resumeAnalyses = analysisRepo.findByResumeId(testResume.id);
    if (resumeAnalyses.length !== 1) {
      throw new Error('简历分析关联查询失败');
    }
    console.log('✅ 简历分析关联查询成功');

    const jobMatches = matchRepo.findByJobId(testJob.id);
    if (jobMatches.length !== 1) {
      throw new Error('岗位匹配关联查询失败');
    }
    console.log('✅ 岗位匹配关联查询成功');

    // 5. 测试更新操作
    console.log('\n5️⃣ 测试更新操作...');
    const updatedResume = resumeRepo.update(testResume.id, {
      basic_info: {
        name: 'Updated Test User',
        email: 'updated@example.com'
      }
    });
    if (!updatedResume || updatedResume.basic_info?.name !== 'Updated Test User') {
      throw new Error('简历更新失败');
    }
    console.log('✅ 简历更新成功');

    // 6. 测试统计功能
    console.log('\n6️⃣ 测试统计功能...');
    const stats = dbHelpers.getDatabaseStats();
    console.log('✅ 数据库统计:', stats);

    // 7. 测试删除操作
    console.log('\n7️⃣ 测试删除操作...');
    const deleteResult = resumeRepo.delete(testResume.id);
    if (!deleteResult) {
      throw new Error('简历删除失败');
    }
    console.log('✅ 简历删除成功（级联删除相关分析和匹配记录）');

    // 验证级联删除
    const deletedAnalyses = analysisRepo.findByResumeId(testResume.id);
    if (deletedAnalyses.length > 0) {
      throw new Error('级联删除失败 - 分析记录仍存在');
    }
    console.log('✅ 级联删除验证成功');

    // 8. 清理测试数据
    jobRepo.delete(testJob.id);
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 所有数据库功能测试通过！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function testSeedData(): Promise<void> {
  console.log('\n🌱 测试种子数据创建...');
  
  try {
    await seedDatabase();
    console.log('✅ 种子数据创建成功');
    
    // 验证种子数据
    const resumeRepo = new ResumeRepository();
    const jobRepo = new JobRepository();
    const analysisRepo = new AnalysisRepository();
    
    const resumeCount = resumeRepo.count();
    const jobCount = jobRepo.count();
    const analysisCount = analysisRepo.count();
    
    console.log(`📊 种子数据统计:`);
    console.log(`   简历: ${resumeCount} 条`);
    console.log(`   岗位: ${jobCount} 条`);
    console.log(`   分析: ${analysisCount} 条`);
    
  } catch (error) {
    console.error('❌ 种子数据测试失败:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// 主测试函数
async function runAllTests(): Promise<void> {
  try {
    await testDatabaseOperations();
    await testSeedData();
    console.log('\n🏆 所有测试完成！数据库配置正确。');
  } catch (error) {
    console.error('\n💥 测试执行失败:', error);
    process.exit(1);
  } finally {
    shutdown();
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

export { testDatabaseOperations, testSeedData, runAllTests };