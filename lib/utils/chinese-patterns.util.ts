// 中文简历模式匹配工具

// 常见中文姓氏（前100个高频姓氏）
const CHINESE_SURNAMES = [
  '王',
  '李',
  '张',
  '刘',
  '陈',
  '杨',
  '黄',
  '赵',
  '周',
  '吴',
  '徐',
  '孙',
  '朱',
  '马',
  '胡',
  '郭',
  '林',
  '何',
  '高',
  '梁',
  '郑',
  '罗',
  '宋',
  '谢',
  '唐',
  '韩',
  '冯',
  '于',
  '董',
  '萧',
  '程',
  '曹',
  '袁',
  '邓',
  '许',
  '傅',
  '沈',
  '曾',
  '彭',
  '吕',
  '苏',
  '卢',
  '蒋',
  '蔡',
  '贾',
  '丁',
  '魏',
  '薛',
  '叶',
  '阎',
  '余',
  '潘',
  '杜',
  '戴',
  '夏',
  '钟',
  '汪',
  '田',
  '任',
  '姜',
  '范',
  '方',
  '石',
  '姚',
  '谭',
  '廖',
  '邹',
  '熊',
  '金',
  '陆',
  '郝',
  '孔',
  '白',
  '崔',
  '康',
  '毛',
  '邱',
  '秦',
  '江',
  '史',
  '顾',
  '侯',
  '邵',
  '孟',
  '龙',
  '万',
  '段',
  '漕',
  '钱',
  '汤',
  '尹',
  '黎',
  '易',
  '常',
  '武',
  '乔',
  '贺',
  '赖',
  '龚',
  '文',
];

// 复姓
const COMPOUND_SURNAMES = [
  '欧阳',
  '太史',
  '端木',
  '上官',
  '司马',
  '东方',
  '独孤',
  '南宫',
  '万俟',
  '闻人',
  '夏侯',
  '诸葛',
  '尉迟',
  '公羊',
  '赫连',
  '澹台',
  '皇甫',
  '宗政',
  '濮阳',
  '公冶',
  '太叔',
  '申屠',
  '公孙',
  '慕容',
  '仲孙',
  '钟离',
  '长孙',
  '宇文',
  '司徒',
  '鲜于',
  '司空',
  '闾丘',
  '子车',
  '亓官',
  '司寇',
  '巫马',
  '公西',
  '颛孙',
  '壤驷',
  '公良',
  '漆雕',
  '乐正',
  '宰父',
  '谷梁',
  '拓跋',
  '夹谷',
  '轩辕',
  '令狐',
  '段干',
  '百里',
  '呼延',
  '东郭',
  '南门',
  '羊舌',
  '微生',
  '公户',
  '公玉',
  '公仪',
  '梁丘',
  '公仲',
  '公上',
  '公门',
  '公山',
  '公坚',
];

// 985/211高校关键词
const KEY_UNIVERSITIES = [
  '清华',
  '北大',
  '北京大学',
  '清华大学',
  '复旦',
  '上海交大',
  '浙大',
  '中科大',
  '南京大学',
  '华中科技',
  '中山大学',
  '吉林大学',
  '四川大学',
  '北京理工',
  '华南理工',
  '大连理工',
  '西北工业',
  '重庆大学',
  '电子科技',
  '武汉大学',
  '哈工大',
  '北京航空航天',
  '同济大学',
  '厦门大学',
  '北京师范',
  '南开大学',
  '天津大学',
  '华东师范',
  '中南大学',
  '山东大学',
  '中国海洋',
  '湖南大学',
  '东北大学',
  '兰州大学',
  '华东理工',
  '中国农业',
  '北京科技',
  '西交大',
  '华北电力',
  '北京化工',
  '中国石油',
  '中央民族',
  '上海大学',
  '苏州大学',
  '南京理工',
  '南京航空航天',
  '华中师范',
  '西南大学',
  '陕西师范',
  '东北师范',
  '长安大学',
  '河海大学',
  '中国矿业',
  '江南大学',
  '合肥工业',
  '北京工业',
  '北京邮电',
  '中国政法',
  '中央财经',
  '上海财经',
  '对外经贸',
];

// 公司类型识别词
const COMPANY_TYPE_KEYWORDS = {
  state_owned: [
    '集团',
    '总公司',
    '总部',
    '央企',
    '国企',
    '中国',
    '国家',
    '银行',
    '石油',
    '电力',
  ],
  private: ['有限公司', '股份', '科技', '信息', '网络', '互联网', '电商'],
  foreign: [
    '外企',
    '合资',
    '独资',
    '国际',
    '全球',
    '亚洲',
    '欧洲',
    '美国',
    '日本',
    '韩国',
  ],
  startup: ['创业', '初创', '新兴', '孵化', '天使', 'VC', 'PE', '轮融资'],
};

// 职位层级关键词
const POSITION_LEVELS = {
  senior: [
    '总监',
    '副总',
    '总裁',
    '总经理',
    '首席',
    'CTO',
    'CEO',
    'CFO',
    'COO',
    '合伙人',
  ],
  middle: [
    '经理',
    '主管',
    '组长',
    '负责人',
    '项目经理',
    'PM',
    '产品经理',
    '技术经理',
  ],
  junior: ['专员', '助理', '实习生', '毕业生', '初级', '新人', '培训生'],
};

// 技能分类
const SKILL_CATEGORIES = {
  programming: [
    'Java',
    'Python',
    'JavaScript',
    'C++',
    'C#',
    'Go',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
  ],
  framework: [
    'Spring',
    'Django',
    'React',
    'Vue',
    'Angular',
    'Express',
    'Laravel',
    'Rails',
  ],
  database: [
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Oracle',
    'SQLServer',
    'Elasticsearch',
  ],
  tools: [
    'Git',
    'Docker',
    'Kubernetes',
    'Jenkins',
    'Maven',
    'Gradle',
    'Nginx',
    'Apache',
  ],
  cloud: ['AWS', '阿里云', '腾讯云', 'Azure', '华为云', 'Docker', 'Kubernetes'],
};

// 联系方式正则表达式
export const CONTACT_PATTERNS = {
  // 中国手机号（11位数字，1开头）
  phone: /(?:(?:\+86[-\s]?)?1[3-9]\d{9})/g,

  // 邮箱
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // 微信号（字母数字下划线，6-20位）
  wechat: /(?:微信[：:]\s*)?([a-zA-Z0-9_-]{6,20})/g,

  // QQ号（5-12位数字）
  qq: /(?:QQ[：:]\s*)?(\d{5,12})/g,

  // LinkedIn
  linkedin: /(?:linkedin\.com\/in\/|领英[：:]\s*)([a-zA-Z0-9-]+)/gi,

  // GitHub
  github: /(?:github\.com\/|GitHub[：:]\s*)([a-zA-Z0-9-]+)/gi,
};

// 地址模式（省市区）
export const ADDRESS_PATTERNS = {
  // 省份
  province:
    /(北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆|台湾|香港|澳门)(?:省|市|自治区|特别行政区)?/g,

  // 城市
  city: /(市|区|县|盟|州)/g,

  // 完整地址模式
  full_address:
    /(?:地址[：:]?\s*)?([^,，。\n]+(?:省|市|自治区|特别行政区)[^,，。\n]*(?:市|区|县|盟|州)[^,，。\n]*)/g,
};

// 姓名提取模式
export const NAME_PATTERNS = {
  // 中文姓名（2-4个汉字）
  chinese_name: /(?:姓名[：:]?\s*)?([一-龯]{2,4})(?!\w)/g,

  // 英文姓名
  english_name: /(?:Name[：:]?\s*)?([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
};

// 时间模式
export const DATE_PATTERNS = {
  // 年份
  year: /(\d{4})[年\-\.\/]?/g,

  // 年月
  year_month: /(\d{4})[年\-\.\/](\d{1,2})[月\-\.\/]?/g,

  // 完整日期
  full_date: /(\d{4})[年\-\.\/](\d{1,2})[月\-\.\/](\d{1,2})[日]?/g,

  // 时间范围
  date_range:
    /(\d{4}(?:[年\-\.\/]\d{1,2})?(?:[月\-\.\/]\d{1,2})?)\s*[-~至到]\s*(\d{4}(?:[年\-\.\/]\d{1,2})?(?:[月\-\.\/]\d{1,2})?|至今|现在|目前)/g,
};

// 工具函数
export class ChinesePatternsUtil {
  /**
   * 检查是否为中文姓氏
   */
  static isChineseSurname(char: string): boolean {
    return (
      CHINESE_SURNAMES.includes(char) ||
      COMPOUND_SURNAMES.some((surname) => char.startsWith(surname))
    );
  }

  /**
   * 提取中文姓名
   */
  static extractChineseName(text: string): string[] {
    const names: string[] = [];

    // 查找复姓
    for (const surname of COMPOUND_SURNAMES) {
      const pattern = new RegExp(`${surname}([一-龯]{1,2})`, 'g');
      const matches = text.match(pattern);
      if (matches) {
        names.push(...matches);
      }
    }

    // 查找单姓
    for (const surname of CHINESE_SURNAMES) {
      const pattern = new RegExp(`${surname}([一-龯]{1,3})`, 'g');
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (match.length >= 2 && match.length <= 4) {
            names.push(match);
          }
        });
      }
    }

    return [...new Set(names)]; // 去重
  }

  /**
   * 检查是否为985/211高校
   */
  static isKeyUniversity(schoolName: string): boolean {
    return KEY_UNIVERSITIES.some((keyword) => schoolName.includes(keyword));
  }

  /**
   * 识别公司类型
   */
  static identifyCompanyType(
    companyName: string
  ): 'state_owned' | 'private' | 'foreign' | 'startup' | 'other' {
    for (const [type, keywords] of Object.entries(COMPANY_TYPE_KEYWORDS)) {
      if (keywords.some((keyword) => companyName.includes(keyword))) {
        return type as
          | 'state_owned'
          | 'private'
          | 'foreign'
          | 'startup'
          | 'other';
      }
    }
    return 'other';
  }

  /**
   * 识别职位层级
   */
  static identifyPositionLevel(position: string): string {
    for (const [level, keywords] of Object.entries(POSITION_LEVELS)) {
      if (keywords.some((keyword) => position.includes(keyword))) {
        return level;
      }
    }
    return 'other';
  }

  /**
   * 分类技能
   */
  static categorizeSkill(skill: string): string {
    for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
      if (skills.some((s) => skill.toLowerCase().includes(s.toLowerCase()))) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * 标准化地址格式
   */
  static normalizeAddress(address: string): {
    province?: string;
    city?: string;
    full_address: string;
  } {
    const provinceMatch = address.match(ADDRESS_PATTERNS.province);
    const cityMatch = address.match(/([\u4e00-\u9fa5]+市)/);

    return {
      province: provinceMatch?.[0],
      city: cityMatch?.[0],
      full_address: address.trim(),
    };
  }

  /**
   * 解析时间范围
   */
  static parseDateRange(dateStr: string): {
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
  } {
    const currentKeywords = ['至今', '现在', '目前'];
    const isCurrent = currentKeywords.some((keyword) =>
      dateStr.includes(keyword)
    );

    const rangeMatch = dateStr.match(DATE_PATTERNS.date_range);
    if (rangeMatch) {
      return {
        start_date: rangeMatch[1],
        end_date: isCurrent ? undefined : rangeMatch[2],
        is_current: isCurrent,
      };
    }

    return { start_date: dateStr, is_current: false };
  }

  /**
   * 验证联系方式格式
   */
  static validateContact(
    type: 'phone' | 'email' | 'wechat' | 'qq',
    value: string
  ): boolean {
    switch (type) {
      case 'phone':
        return /^1[3-9]\d{9}$/.test(value.replace(/[-\s]/g, ''));
      case 'email':
        return CONTACT_PATTERNS.email.test(value);
      case 'wechat':
        return /^[a-zA-Z0-9_-]{6,20}$/.test(value);
      case 'qq':
        return /^\d{5,12}$/.test(value);
      default:
        return false;
    }
  }
}

export {
  CHINESE_SURNAMES,
  COMPOUND_SURNAMES,
  KEY_UNIVERSITIES,
  COMPANY_TYPE_KEYWORDS,
  POSITION_LEVELS,
  SKILL_CATEGORIES,
};
