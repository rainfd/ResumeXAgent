'use client';

import React, { useState, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CompanyAnalysis,
  CompanyTag,
  TagCategory,
  CompanySize,
  Industry,
  CultureValue,
  WorkStyle,
  ManagementStyle,
  TeamAtmosphere,
  WorkIntensity,
  CompanyScore,
  BasicBenefit,
  SpecialBenefit,
  DevelopmentBenefit,
} from '@/lib/types/company.types';

interface CompanyAnalysisProps {
  analysis: CompanyAnalysis;
  className?: string;
  mode?: 'full' | 'compact';
  showComparison?: boolean;
}

// 公司基本信息卡片组件
const CompanyBasicCard: React.FC<{
  basicInfo: CompanyAnalysis['basicInfo'];
}> = ({ basicInfo }) => {
  const getSizeColor = (size: CompanySize): string => {
    const colors: Record<CompanySize, string> = {
      [CompanySize.STARTUP]:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [CompanySize.SMALL]:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [CompanySize.MEDIUM]:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [CompanySize.LARGE]:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [CompanySize.UNICORN]:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [CompanySize.PUBLIC]:
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[size] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏢</span>
          公司基本信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              公司规模
            </label>
            <div className="mt-1">
              <Badge className={getSizeColor(basicInfo.size)}>
                {basicInfo.size}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              发展阶段
            </label>
            <div className="mt-1">
              <Badge variant="outline">{basicInfo.stage}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              企业性质
            </label>
            <div className="mt-1">
              <Badge variant="secondary">{basicInfo.nature}</Badge>
            </div>
          </div>

          {basicInfo.headquarters && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                总部地点
              </label>
              <div className="mt-1 text-sm">{basicInfo.headquarters}</div>
            </div>
          )}

          {basicInfo.founded && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                成立时间
              </label>
              <div className="mt-1 text-sm">{basicInfo.founded}年</div>
            </div>
          )}

          {basicInfo.employees && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                员工规模
              </label>
              <div className="mt-1 text-sm">{basicInfo.employees}</div>
            </div>
          )}
        </div>

        {basicInfo.industry.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              所属行业
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {basicInfo.industry.map((industry, index) => (
                <Badge key={index} variant="default">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 企业文化雷达图组件
const CultureRadarChart: React.FC<{
  culture: CompanyAnalysis['culture'];
}> = ({ culture }) => {
  const radarData = useMemo(() => {
    const valueScores: Record<CultureValue, number> = {
      [CultureValue.INNOVATION]: 0,
      [CultureValue.COLLABORATION]: 0,
      [CultureValue.CUSTOMER_FOCUS]: 0,
      [CultureValue.RESULTS_DRIVEN]: 0,
      [CultureValue.INTEGRITY]: 0,
      [CultureValue.LEARNING]: 0,
      [CultureValue.DIVERSITY]: 0,
      [CultureValue.WORK_LIFE_BALANCE]: 0,
      [CultureValue.EXCELLENCE]: 0,
      [CultureValue.RESPONSIBILITY]: 0,
      [CultureValue.OPENNESS]: 0,
      [CultureValue.EFFICIENCY]: 0,
    };

    // 根据识别到的价值观设置分数
    culture.values.forEach((value) => {
      valueScores[value] = 8;
    });

    return Object.entries(valueScores)
      .filter(([_, score]) => score > 0)
      .map(([value, score]) => ({
        name: value,
        value: score,
        fullMark: 10,
      }));
  }, [culture.values]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span>
          企业文化雷达图
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">文化评分: {culture.cultureScore}/10</Badge>
          <Badge variant="secondary">{culture.management}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={0} domain={[0, 10]} />
              <Radar
                name="文化价值观"
                dataKey="value"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {culture.workStyle.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground">
              工作风格
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {culture.workStyle.map((style, index) => (
                <Badge key={index} variant="outline">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {culture.evidence.length > 0 && (
          <div className="mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  查看文化证据 ({culture.evidence.length}条)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[500px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>企业文化相关证据</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {culture.evidence.map((evidence, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{evidence}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 福利待遇对比图组件
const BenefitsComparison: React.FC<{
  benefits: CompanyAnalysis['benefits'];
}> = ({ benefits }) => {
  const benefitsData = [
    {
      category: '基础福利',
      count: benefits.basicBenefits.length,
      color: '#3B82F6',
    },
    {
      category: '特色福利',
      count: benefits.specialBenefits.length,
      color: '#10B981',
    },
    {
      category: '发展福利',
      count: benefits.developmentBenefits.length,
      color: '#8B5CF6',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span>
          福利待遇分析
        </CardTitle>
        <Badge variant="outline">福利评分: {benefits.benefitsScore}/10</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benefitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-blue-600 mb-2">基础福利</h4>
            <div className="space-y-1">
              {benefits.basicBenefits.map((benefit, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="block text-center"
                >
                  {benefit.name}
                </Badge>
              ))}
              {benefits.basicBenefits.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无信息</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-green-600 mb-2">特色福利</h4>
            <div className="space-y-1">
              {benefits.specialBenefits.map((benefit, index) => (
                <Badge
                  key={index}
                  variant="default"
                  className="block text-center"
                >
                  {benefit.name}
                </Badge>
              ))}
              {benefits.specialBenefits.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无信息</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-600 mb-2">发展福利</h4>
            <div className="space-y-1">
              {benefits.developmentBenefits.map((benefit, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="block text-center"
                >
                  {benefit.name}
                </Badge>
              ))}
              {benefits.developmentBenefits.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无信息</p>
              )}
            </div>
          </div>
        </div>

        {(benefits.compensation.baseSalary ||
          benefits.compensation.performance ||
          benefits.compensation.bonus) && (
          <div>
            <h4 className="font-medium mb-2">薪酬结构</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {benefits.compensation.baseSalary && (
                <div>
                  <strong>基本工资:</strong> {benefits.compensation.baseSalary}
                </div>
              )}
              {benefits.compensation.performance && (
                <div>
                  <strong>绩效奖金:</strong> {benefits.compensation.performance}
                </div>
              )}
              {benefits.compensation.bonus && (
                <div>
                  <strong>年终奖:</strong> {benefits.compensation.bonus}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 公司标签云组件
const CompanyTagCloud: React.FC<{
  tags: CompanyTag[];
}> = ({ tags }) => {
  const getTagSize = (weight: number) => {
    return Math.max(12, Math.min(24, weight * 16));
  };

  const getCategoryIcon = (category: TagCategory) => {
    const icons: Record<TagCategory, string> = {
      [TagCategory.SIZE]: '📏',
      [TagCategory.INDUSTRY]: '🏭',
      [TagCategory.CULTURE]: '🎨',
      [TagCategory.STAGE]: '📈',
      [TagCategory.ENVIRONMENT]: '🏢',
      [TagCategory.BENEFITS]: '💎',
      [TagCategory.DEVELOPMENT]: '🚀',
      [TagCategory.NATURE]: '🏛️',
    };
    return icons[category] || '🏷️';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏷️</span>
          公司特征标签
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          标签大小反映重要性，颜色代表不同分类
        </p>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] flex flex-wrap justify-center items-center gap-2 p-4">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full border transition-all hover:scale-110 cursor-pointer"
              style={{
                fontSize: `${getTagSize(tag.weight)}px`,
                borderColor: tag.color,
                color: tag.color,
              }}
              title={`分类: ${tag.category} | 权重: ${tag.weight} | 置信度: ${tag.confidence}`}
            >
              <span>{getCategoryIcon(tag.category)}</span>
              <span>{tag.name}</span>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              暂无标签数据
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 综合评分仪表盘组件
const CompanyScoreGauge: React.FC<{
  scores: CompanyScore;
}> = ({ scores }) => {
  const scoreData = [
    { name: '文化评分', score: scores.cultureScore, color: '#3B82F6' },
    { name: '福利评分', score: scores.benefitsScore, color: '#10B981' },
    { name: '环境评分', score: scores.environmentScore, color: '#F59E0B' },
    { name: '发展评分', score: scores.developmentScore, color: '#8B5CF6' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          综合评分仪表盘
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div
            className={cn('text-4xl font-bold', getScoreColor(scores.total))}
          >
            {scores.total}/10
          </div>
          <p className="text-muted-foreground">综合评分</p>
        </div>

        <div className="space-y-3">
          {scoreData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.name}</span>
                <span className={getScoreColor(item.score)}>
                  {item.score}/10
                </span>
              </div>
              <Progress value={(item.score / 10) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 工作环境分析组件
const WorkEnvironmentCard: React.FC<{
  environment: CompanyAnalysis['workEnvironment'];
}> = ({ environment }) => {
  const getIntensityColor = (intensity: WorkIntensity) => {
    const colors: Record<WorkIntensity, string> = {
      [WorkIntensity.RELAXED]: 'bg-green-100 text-green-800',
      [WorkIntensity.MODERATE]: 'bg-blue-100 text-blue-800',
      [WorkIntensity.INTENSE]: 'bg-yellow-100 text-yellow-800',
      [WorkIntensity.HIGH_PRESSURE]: 'bg-red-100 text-red-800',
      [WorkIntensity.FLEXIBLE]: 'bg-purple-100 text-purple-800',
      [WorkIntensity.NINE_NINE_SIX]: 'bg-gray-100 text-gray-800',
      [WorkIntensity.NORMAL_HOURS]: 'bg-green-100 text-green-800',
      [WorkIntensity.OVERTIME]: 'bg-orange-100 text-orange-800',
    };
    return colors[intensity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏢</span>
          工作环境分析
        </CardTitle>
        <Badge variant="outline">
          环境评分: {environment.environmentScore}/10
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              办公环境
            </label>
            <div className="mt-1">
              <Badge variant="outline">{environment.officeSetup}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              工作强度
            </label>
            <div className="mt-1">
              <Badge className={getIntensityColor(environment.workIntensity)}>
                {environment.workIntensity}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              沟通风格
            </label>
            <div className="mt-1">
              <Badge variant="secondary">{environment.communication}</Badge>
            </div>
          </div>
        </div>

        {environment.teamAtmosphere.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              团队氛围
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {environment.teamAtmosphere.map((atmosphere, index) => (
                <Badge key={index} variant="default">
                  {atmosphere}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {environment.teamActivities.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              团队活动
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {environment.teamActivities.map((activity, index) => (
                <Badge key={index} variant="outline">
                  {activity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 主组件
const CompanyAnalysis: React.FC<CompanyAnalysisProps> = ({
  analysis,
  className,
  mode = 'full',
  showComparison = false,
}) => {
  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">暂无公司分析数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 公司基本信息 */}
      <CompanyBasicCard basicInfo={analysis.basicInfo} />

      {mode === 'full' && (
        <>
          {/* 综合评分仪表盘 */}
          <CompanyScoreGauge scores={analysis.overallScore} />

          {/* 企业文化雷达图 */}
          <CultureRadarChart culture={analysis.culture} />

          {/* 福利待遇对比 */}
          <BenefitsComparison benefits={analysis.benefits} />

          {/* 工作环境分析 */}
          <WorkEnvironmentCard environment={analysis.workEnvironment} />

          {/* 公司标签云 */}
          <CompanyTagCloud tags={analysis.companyTags} />
        </>
      )}

      {mode === 'compact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CompanyScoreGauge scores={analysis.overallScore} />
          <CompanyTagCloud tags={analysis.companyTags.slice(0, 8)} />
        </div>
      )}

      {/* 分析元数据 */}
      {analysis.analysisMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">分析信息</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              分析时间:{' '}
              {new Date(
                analysis.analysisMetadata.analysisDate
              ).toLocaleString()}
            </div>
            <div>AI模型: {analysis.analysisMetadata.aiModel}</div>
            <div>分析质量: {analysis.analysisMetadata.extractionQuality}</div>
            <div>
              置信度: {(analysis.analysisMetadata.confidence * 100).toFixed(1)}%
            </div>
            {analysis.analysisMetadata.processingTime && (
              <div>处理时间: {analysis.analysisMetadata.processingTime}ms</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyAnalysis;
