'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  JobContentAnalysis,
  Responsibility,
  WorkTypeAnalysis,
  WorkType,
  ResponsibilityCategory,
  ImportanceLevel,
  FrequencyLevel,
  ExperienceLevel,
  ComplexityLevel,
  CareerPath,
  ImpactScope,
  BusinessDomain,
} from '@/lib/types/job.types';

interface JobContentAnalysisProps {
  analysis: JobContentAnalysis;
  className?: string;
  showDetails?: boolean;
}

// 职责列表组件
interface ResponsibilityListProps {
  responsibilities: Responsibility[];
}

const ResponsibilityList: React.FC<ResponsibilityListProps> = ({
  responsibilities,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    ResponsibilityCategory | 'all'
  >('all');

  const filteredResponsibilities = responsibilities.filter(
    (resp) => selectedCategory === 'all' || resp.category === selectedCategory
  );

  const getCategoryBadgeVariant = (category: ResponsibilityCategory) => {
    switch (category) {
      case ResponsibilityCategory.CORE:
        return 'default';
      case ResponsibilityCategory.SUPPORT:
        return 'secondary';
      case ResponsibilityCategory.OCCASIONAL:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getImportanceBadgeVariant = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.HIGH:
        return 'destructive';
      case ImportanceLevel.MEDIUM:
        return 'default';
      case ImportanceLevel.LOW:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getFrequencyText = (frequency: FrequencyLevel) => {
    switch (frequency) {
      case FrequencyLevel.DAILY:
        return '每日';
      case FrequencyLevel.WEEKLY:
        return '每周';
      case FrequencyLevel.MONTHLY:
        return '每月';
      case FrequencyLevel.OCCASIONAL:
        return '偶尔';
      default:
        return '未知';
    }
  };

  const getCategoryText = (category: ResponsibilityCategory) => {
    switch (category) {
      case ResponsibilityCategory.CORE:
        return '核心职责';
      case ResponsibilityCategory.SUPPORT:
        return '辅助职责';
      case ResponsibilityCategory.OCCASIONAL:
        return '临时任务';
      default:
        return '未知';
    }
  };

  const getImportanceText = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.HIGH:
        return '重要';
      case ImportanceLevel.MEDIUM:
        return '一般';
      case ImportanceLevel.LOW:
        return '次要';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-4">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory('all')}
        >
          全部 ({responsibilities.length})
        </Badge>
        {Object.values(ResponsibilityCategory).map((category) => {
          const count = responsibilities.filter(
            (r) => r.category === category
          ).length;
          return (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryText(category)} ({count})
            </Badge>
          );
        })}
      </div>

      {/* 职责列表 */}
      <div className="space-y-3">
        {filteredResponsibilities.map((resp, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={getCategoryBadgeVariant(resp.category)}>
                  {getCategoryText(resp.category)}
                </Badge>
                <Badge variant={getImportanceBadgeVariant(resp.importance)}>
                  {getImportanceText(resp.importance)}
                </Badge>
                <Badge variant="outline">
                  {getFrequencyText(resp.frequency)}
                </Badge>
              </div>
            </div>
            <p className="text-sm mb-2">{resp.description}</p>
            {resp.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resp.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResponsibilities.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {selectedCategory === 'all' ? '暂无职责数据' : '该分类下暂无职责'}
        </div>
      )}
    </div>
  );
};

// 工作类型分布图表组件
interface WorkTypeChartProps {
  workTypes: WorkTypeAnalysis[];
}

const WorkTypeChart: React.FC<WorkTypeChartProps> = ({ workTypes }) => {
  const chartData = workTypes.map((wt, index) => ({
    name: wt.type,
    percentage: wt.percentage,
    description: wt.description,
    level: wt.level,
    fill: getWorkTypeColor(wt.type, index),
  }));

  function getWorkTypeColor(type: WorkType, index: number): string {
    const colors = [
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#F59E0B',
      '#06B6D4',
      '#EF4444',
      '#EC4899',
      '#6366F1',
    ];
    return colors[index % colors.length];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 饼图 */}
      <div>
        <h4 className="text-lg font-semibold mb-4">工作类型占比</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, '占比']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 柱状图 */}
      <div>
        <h4 className="text-lg font-semibold mb-4">工作类型详情</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value}%`,
                  '占比',
                  props.payload.description,
                ]}
              />
              <Bar dataKey="percentage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 成长空间雷达图组件
interface GrowthRadarChartProps {
  analysis: JobContentAnalysis;
}

const GrowthRadarChart: React.FC<GrowthRadarChartProps> = ({ analysis }) => {
  const { growthAssessment, techStackAnalysis } = analysis;

  const radarData = [
    {
      dimension: '学习机会',
      score: growthAssessment.learningOpportunities,
      fullMark: 10,
    },
    {
      dimension: '挑战程度',
      score: growthAssessment.challengeLevel,
      fullMark: 10,
    },
    {
      dimension: '成长潜力',
      score: growthAssessment.growthPotential,
      fullMark: 10,
    },
    {
      dimension: '技术现代化',
      score: techStackAnalysis.modernization,
      fullMark: 10,
    },
    {
      dimension: '影响范围',
      score: getImpactScopeScore(growthAssessment.impactScope),
      fullMark: 10,
    },
  ];

  function getImpactScopeScore(scope: ImpactScope): number {
    switch (scope) {
      case ImpactScope.TEAM:
        return 3;
      case ImpactScope.DEPARTMENT:
        return 6;
      case ImpactScope.COMPANY:
        return 8;
      case ImpactScope.INDUSTRY:
        return 10;
      default:
        return 3;
    }
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <PolarRadiusAxis domain={[0, 10]} />
          <Radar
            name="成长空间评分"
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 协作关系网络图组件
interface CollaborationNetworkProps {
  analysis: JobContentAnalysis;
}

const CollaborationNetwork: React.FC<CollaborationNetworkProps> = ({
  analysis,
}) => {
  const { collaborationRequirements } = analysis;

  const getFrequencyScore = (frequency: FrequencyLevel): number => {
    switch (frequency) {
      case FrequencyLevel.DAILY:
        return 4;
      case FrequencyLevel.WEEKLY:
        return 3;
      case FrequencyLevel.MONTHLY:
        return 2;
      case FrequencyLevel.OCCASIONAL:
        return 1;
      default:
        return 1;
    }
  };

  const getFrequencyColor = (frequency: FrequencyLevel): string => {
    switch (frequency) {
      case FrequencyLevel.DAILY:
        return 'bg-red-500';
      case FrequencyLevel.WEEKLY:
        return 'bg-orange-500';
      case FrequencyLevel.MONTHLY:
        return 'bg-yellow-500';
      case FrequencyLevel.OCCASIONAL:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFrequencyText = (frequency: FrequencyLevel): string => {
    switch (frequency) {
      case FrequencyLevel.DAILY:
        return '每日协作';
      case FrequencyLevel.WEEKLY:
        return '每周协作';
      case FrequencyLevel.MONTHLY:
        return '每月协作';
      case FrequencyLevel.OCCASIONAL:
        return '偶尔协作';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collaborationRequirements.map((collab, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{collab.department}</h4>
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  getFrequencyColor(collab.frequency)
                )}
                title={getFrequencyText(collab.frequency)}
              />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">
                {getFrequencyText(collab.frequency)}
              </Badge>
              <p className="text-sm text-muted-foreground">{collab.depth}</p>
              {collab.requirements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">具体要求：</p>
                  <ul className="text-xs space-y-1">
                    {collab.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {collaborationRequirements.length === 0 && (
        <div className="text-center text-gray-500 py-8">暂无协作要求数据</div>
      )}
    </div>
  );
};

// 技术复杂度指示器组件
interface TechComplexityIndicatorProps {
  analysis: JobContentAnalysis;
}

const TechComplexityIndicator: React.FC<TechComplexityIndicatorProps> = ({
  analysis,
}) => {
  const { techStackAnalysis } = analysis;

  const getComplexityScore = (complexity: ComplexityLevel): number => {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return 25;
      case ComplexityLevel.MEDIUM:
        return 50;
      case ComplexityLevel.HIGH:
        return 75;
      case ComplexityLevel.EXPERT:
        return 100;
      default:
        return 50;
    }
  };

  const getComplexityText = (complexity: ComplexityLevel): string => {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return '简单';
      case ComplexityLevel.MEDIUM:
        return '中等';
      case ComplexityLevel.HIGH:
        return '复杂';
      case ComplexityLevel.EXPERT:
        return '专家级';
      default:
        return '未知';
    }
  };

  const complexityScore = getComplexityScore(techStackAnalysis.techComplexity);

  return (
    <div className="space-y-6">
      {/* 技术复杂度总览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-2">技术复杂度</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">
                {getComplexityText(techStackAnalysis.techComplexity)}
              </span>
              <span className="text-sm font-medium">{complexityScore}%</span>
            </div>
            <Progress value={complexityScore} className="h-2" />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-2">技术现代化</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">现代化程度</span>
              <span className="text-sm font-medium">
                {techStackAnalysis.modernization}/10
              </span>
            </div>
            <Progress
              value={techStackAnalysis.modernization * 10}
              className="h-2"
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-2">项目规模</h4>
          <div className="space-y-1 text-sm">
            <div>团队：{techStackAnalysis.projectScale.teamSize}</div>
            <div>周期：{techStackAnalysis.projectScale.projectDuration}</div>
            <div>用户：{techStackAnalysis.projectScale.userScale}</div>
          </div>
        </div>
      </div>

      {/* 业务领域 */}
      {techStackAnalysis.domain.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">业务领域</h4>
          <div className="flex flex-wrap gap-2">
            {techStackAnalysis.domain.map((domain, index) => (
              <Badge key={index} variant="secondary">
                {domain}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 技术挑战 */}
      {techStackAnalysis.challenges.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">技术挑战</h4>
          <div className="space-y-2">
            {techStackAnalysis.challenges.map((challenge, index) => (
              <div key={index} className="p-3 border rounded bg-card">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="font-medium">{challenge.type}</h5>
                  <Badge variant="outline">
                    {getComplexityText(challenge.complexity)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {challenge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 主组件
const JobContentAnalysisComponent: React.FC<JobContentAnalysisProps> = ({
  analysis,
  className,
  showDetails = true,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'responsibilities'
    | 'workTypes'
    | 'growth'
    | 'collaboration'
    | 'tech'
  >('overview');

  return (
    <div className={cn('space-y-6', className)}>
      {/* 概览摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>工作内容分析概览</CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              分析日期: {new Date(analysis.analysisDate).toLocaleDateString()}
            </span>
            <span>置信度: {(analysis.confidenceScore * 100).toFixed(0)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">工作概述</h4>
              <p className="text-sm">{analysis.summary.overview}</p>
            </div>

            {analysis.summary.highlights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">关键亮点</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.summary.highlights.map((highlight, index) => (
                    <Badge key={index} variant="secondary">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.summary.keywords.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">关键词</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.summary.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <>
          {/* 导航标签 */}
          <div className="flex flex-wrap gap-2 border-b">
            {[
              { key: 'overview', label: '概览' },
              { key: 'responsibilities', label: '工作职责' },
              { key: 'workTypes', label: '工作类型' },
              { key: 'growth', label: '成长空间' },
              { key: 'collaboration', label: '协作关系' },
              { key: 'tech', label: '技术分析' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 标签内容 */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <Card>
                <CardHeader>
                  <CardTitle>整体分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-semibold mb-2">职责数量</h4>
                      <p className="text-2xl font-bold">
                        {analysis.responsibilities.length}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-semibold mb-2">工作类型</h4>
                      <p className="text-2xl font-bold">
                        {analysis.workTypes.length}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-semibold mb-2">成长潜力</h4>
                      <p className="text-2xl font-bold">
                        {analysis.growthAssessment.growthPotential}/10
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-semibold mb-2">协作部门</h4>
                      <p className="text-2xl font-bold">
                        {analysis.collaborationRequirements.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'responsibilities' && (
              <Card>
                <CardHeader>
                  <CardTitle>工作职责详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsibilityList
                    responsibilities={analysis.responsibilities}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'workTypes' && (
              <Card>
                <CardHeader>
                  <CardTitle>工作类型分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkTypeChart workTypes={analysis.workTypes} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'growth' && (
              <Card>
                <CardHeader>
                  <CardTitle>成长空间评估</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <GrowthRadarChart analysis={analysis} />
                    <div>
                      <h4 className="font-semibold mb-3">职业发展路径</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.growthAssessment.careerPath.map(
                          (path, index) => (
                            <Badge key={index} variant="default">
                              {path}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'collaboration' && (
              <Card>
                <CardHeader>
                  <CardTitle>协作关系分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <CollaborationNetwork analysis={analysis} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'tech' && (
              <Card>
                <CardHeader>
                  <CardTitle>技术栈分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <TechComplexityIndicator analysis={analysis} />
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default JobContentAnalysisComponent;
