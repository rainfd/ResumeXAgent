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
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  SkillAnalysis,
  SkillCategory,
  SoftSkillCategory,
  SkillPriority,
  ProficiencyLevel,
  TechnicalSkill,
  SoftSkill,
} from '@/lib/types/skill.types';

interface SkillVisualizationProps {
  skillAnalysis: SkillAnalysis;
  className?: string;
  mode?: 'full' | 'compact';
  showComparison?: boolean;
  userSkills?: string[]; // 用户技能列表，用于对比
}

// 技能云图组件
interface SkillCloudItemProps {
  skill: TechnicalSkill | SoftSkill;
  onClick?: (skill: TechnicalSkill | SoftSkill) => void;
  isSelected?: boolean;
}

const SkillCloudItem: React.FC<SkillCloudItemProps> = ({
  skill,
  onClick,
  isSelected = false,
}) => {
  const weight = 'weight' in skill ? skill.weight : skill.importance;
  const fontSize = Math.max(12, Math.min(24, weight * 2.5));

  const getSkillColor = (skill: TechnicalSkill | SoftSkill) => {
    if ('category' in skill) {
      // 技术技能颜色
      const techColors: Record<SkillCategory, string> = {
        [SkillCategory.PROGRAMMING_LANGUAGE]:
          'text-blue-600 dark:text-blue-400',
        [SkillCategory.FRAMEWORK]: 'text-green-600 dark:text-green-400',
        [SkillCategory.DATABASE]: 'text-purple-600 dark:text-purple-400',
        [SkillCategory.TOOL]: 'text-orange-600 dark:text-orange-400',
        [SkillCategory.CLOUD]: 'text-cyan-600 dark:text-cyan-400',
        [SkillCategory.OPERATING_SYSTEM]: 'text-gray-600 dark:text-gray-400',
        [SkillCategory.VERSION_CONTROL]: 'text-pink-600 dark:text-pink-400',
        [SkillCategory.TESTING]: 'text-yellow-600 dark:text-yellow-400',
        [SkillCategory.DEVOPS]: 'text-indigo-600 dark:text-indigo-400',
        [SkillCategory.OTHER]: 'text-slate-600 dark:text-slate-400',
      };
      return techColors[skill.category as SkillCategory] || 'text-gray-600';
    } else {
      // 软技能颜色
      return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  const getBorderColor = (priority: SkillPriority) => {
    switch (priority) {
      case SkillPriority.REQUIRED:
        return 'border-red-300 dark:border-red-700';
      case SkillPriority.PREFERRED:
        return 'border-yellow-300 dark:border-yellow-700';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      className={cn(
        'inline-block m-1 px-2 py-1 rounded-lg border-2 cursor-pointer transition-all hover:scale-110 select-none',
        getSkillColor(skill),
        getBorderColor(skill.priority),
        isSelected && 'bg-primary/10 border-primary',
        'hover:shadow-md'
      )}
      style={{ fontSize: `${fontSize}px` }}
      onClick={() => onClick?.(skill)}
      title={`${skill.name} - 权重: ${weight}/10 - 优先级: ${skill.priority}`}
    >
      {skill.name}
      {skill.priority === SkillPriority.REQUIRED && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </div>
  );
};

// 技能详情面板
interface SkillDetailsPanelProps {
  skill: TechnicalSkill | SoftSkill | null;
  onClose: () => void;
}

const SkillDetailsPanel: React.FC<SkillDetailsPanelProps> = ({
  skill,
  onClose,
}) => {
  if (!skill) return null;

  const isTechnicalSkill = 'proficiency' in skill;
  const weight = isTechnicalSkill ? skill.weight : skill.importance;

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{skill.name}</CardTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {isTechnicalSkill ? skill.category : skill.category}
          </Badge>
          <Badge
            variant={
              skill.priority === SkillPriority.REQUIRED
                ? 'destructive'
                : skill.priority === SkillPriority.PREFERRED
                  ? 'default'
                  : 'secondary'
            }
          >
            {skill.priority === SkillPriority.REQUIRED
              ? '必需'
              : skill.priority === SkillPriority.PREFERRED
                ? '优先'
                : '可选'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>权重评分:</strong> {weight}/10
          </div>
          {isTechnicalSkill && (
            <>
              <div>
                <strong>熟练度:</strong>{' '}
                {skill.proficiency === ProficiencyLevel.EXPERT
                  ? '精通'
                  : skill.proficiency === ProficiencyLevel.PROFICIENT
                    ? '熟练'
                    : skill.proficiency === ProficiencyLevel.FAMILIAR
                      ? '熟悉'
                      : skill.proficiency === ProficiencyLevel.BASIC
                        ? '了解'
                        : '未知'}
              </div>
              {skill.version && (
                <div>
                  <strong>版本要求:</strong> {skill.version}
                </div>
              )}
              {skill.yearRequirement && (
                <div>
                  <strong>年限要求:</strong> {skill.yearRequirement}年
                </div>
              )}
            </>
          )}
        </div>

        {isTechnicalSkill && skill.context && (
          <div className="text-sm">
            <strong>上下文:</strong>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {skill.context}
            </p>
          </div>
        )}

        {!isTechnicalSkill && skill.description && (
          <div className="text-sm">
            <strong>具体要求:</strong>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {skill.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SkillVisualization: React.FC<SkillVisualizationProps> = ({
  skillAnalysis,
  className,
  mode = 'full',
  showComparison = false,
  userSkills = [],
}) => {
  const [selectedSkill, setSelectedSkill] = useState<
    TechnicalSkill | SoftSkill | null
  >(null);

  // 准备图表数据
  const chartData = useMemo(() => {
    // 技能分类分布数据
    const categoryData = new Map<string, { count: number; weight: number }>();

    skillAnalysis.technicalSkills.forEach((skill) => {
      const category = skill.category;
      if (!categoryData.has(category)) {
        categoryData.set(category, { count: 0, weight: 0 });
      }
      const data = categoryData.get(category)!;
      data.count += 1;
      data.weight += skill.weight;
    });

    const pieData = Array.from(categoryData.entries()).map(
      ([category, data]) => ({
        name: category,
        value: data.count,
        weight: data.weight,
        fill: getCategoryColor(category as SkillCategory),
      })
    );

    // 熟练度雷达图数据
    const proficiencyData = [
      ProficiencyLevel.EXPERT,
      ProficiencyLevel.PROFICIENT,
      ProficiencyLevel.FAMILIAR,
      ProficiencyLevel.BASIC,
    ].map((level) => {
      const count = skillAnalysis.technicalSkills.filter(
        (skill) => skill.proficiency === level
      ).length;
      return {
        proficiency:
          level === ProficiencyLevel.EXPERT
            ? '精通'
            : level === ProficiencyLevel.PROFICIENT
              ? '熟练'
              : level === ProficiencyLevel.FAMILIAR
                ? '熟悉'
                : '了解',
        count,
        fullMark: Math.max(10, skillAnalysis.technicalSkills.length / 4),
      };
    });

    // 优先级分布数据
    const priorityData = [
      SkillPriority.REQUIRED,
      SkillPriority.PREFERRED,
      SkillPriority.OPTIONAL,
    ].map((priority) => {
      const techCount = skillAnalysis.technicalSkills.filter(
        (skill) => skill.priority === priority
      ).length;
      const softCount = skillAnalysis.softSkills.filter(
        (skill) => skill.priority === priority
      ).length;
      return {
        priority:
          priority === SkillPriority.REQUIRED
            ? '必需'
            : priority === SkillPriority.PREFERRED
              ? '优先'
              : '可选',
        technical: techCount,
        soft: softCount,
        total: techCount + softCount,
      };
    });

    return { pieData, proficiencyData, priorityData };
  }, [skillAnalysis]);

  const getCategoryColor = (category: SkillCategory): string => {
    const colors: Record<SkillCategory, string> = {
      [SkillCategory.PROGRAMMING_LANGUAGE]: '#3B82F6',
      [SkillCategory.FRAMEWORK]: '#10B981',
      [SkillCategory.DATABASE]: '#8B5CF6',
      [SkillCategory.TOOL]: '#F59E0B',
      [SkillCategory.CLOUD]: '#06B6D4',
      [SkillCategory.OPERATING_SYSTEM]: '#6B7280',
      [SkillCategory.VERSION_CONTROL]: '#EC4899',
      [SkillCategory.TESTING]: '#EAB308',
      [SkillCategory.DEVOPS]: '#6366F1',
      [SkillCategory.OTHER]: '#64748B',
    };
    return colors[category] || '#64748B';
  };

  const allSkills = [
    ...skillAnalysis.technicalSkills,
    ...skillAnalysis.softSkills,
  ];
  const sortedSkills = allSkills.sort((a, b) => {
    const aWeight = 'weight' in a ? a.weight : a.importance;
    const bWeight = 'weight' in b ? b.weight : b.importance;
    return bWeight - aWeight;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* 技能云图 */}
      <Card>
        <CardHeader>
          <CardTitle>技能要求云图</CardTitle>
          <p className="text-sm text-muted-foreground">
            字体大小反映技能权重，颜色区分技能分类，红色星号表示必需技能
          </p>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] flex flex-wrap justify-center items-center p-4">
            {sortedSkills.map((skill, index) => (
              <SkillCloudItem
                key={`${skill.name}-${index}`}
                skill={skill}
                onClick={setSelectedSkill}
                isSelected={selectedSkill?.name === skill.name}
              />
            ))}
          </div>
          {sortedSkills.length === 0 && (
            <div className="text-center text-gray-500 py-8">暂无技能数据</div>
          )}
        </CardContent>
      </Card>

      {mode === 'full' && (
        <>
          {/* 技能分类分布饼图 */}
          <Card>
            <CardHeader>
              <CardTitle>技能分类分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 熟练度雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle>技能熟练度分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={chartData.proficiencyData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="proficiency" />
                    <PolarRadiusAxis />
                    <Radar
                      name="技能数量"
                      dataKey="count"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 优先级分布柱状图 */}
          <Card>
            <CardHeader>
              <CardTitle>技能优先级分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="technical"
                      stackId="a"
                      fill="#3B82F6"
                      name="技术技能"
                    />
                    <Bar
                      dataKey="soft"
                      stackId="a"
                      fill="#10B981"
                      name="软技能"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 技能对比模式 */}
      {showComparison && userSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>技能匹配分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">匹配技能</h4>
                <div className="space-y-1">
                  {allSkills
                    .filter((skill) => userSkills.includes(skill.name))
                    .map((skill) => (
                      <Badge
                        key={skill.name}
                        variant="default"
                        className="mr-1 mb-1"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 mb-2">缺失技能</h4>
                <div className="space-y-1">
                  {allSkills
                    .filter((skill) => !userSkills.includes(skill.name))
                    .slice(0, 10)
                    .map((skill) => (
                      <Badge
                        key={skill.name}
                        variant="destructive"
                        className="mr-1 mb-1"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">额外技能</h4>
                <div className="space-y-1">
                  {userSkills
                    .filter(
                      (userSkill) =>
                        !allSkills.some((skill) => skill.name === userSkill)
                    )
                    .slice(0, 10)
                    .map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="mr-1 mb-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 技能详情面板 */}
      <SkillDetailsPanel
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
      />
    </div>
  );
};

export default SkillVisualization;
