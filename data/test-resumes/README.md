# 测试简历文件

这个目录包含了用于测试简历解析器的样本文件。

## 目录结构

```
test-resumes/
├── pdf/          # PDF格式测试简历
├── markdown/     # Markdown格式测试简历
├── txt/          # 纯文本格式测试简历
└── README.md     # 说明文件
```

## 现有测试文件

### Markdown格式

- `sample-resume-zh.md` - 中文简历样本（张三）
  - 包含完整的简历结构：基本信息、教育经历、工作经历、项目经历、技能
  - 测试Markdown解析器对中文内容和格式的处理能力

### 纯文本格式

- `sample-resume-en.txt` - 英文简历样本（John Smith）

  - Google高级软件工程师简历
  - 包含教育背景、工作经验、项目、技能、证书等完整信息
  - 测试纯文本解析器对英文简历的结构识别能力

- `sample-resume-zh.txt` - 中文简历样本（李明）
  - 阿里巴巴Java开发工程师简历
  - 包含中文特色的简历格式和内容
  - 测试纯文本解析器对中文简历的处理能力

## 如何添加更多测试文件

如果你有 `/home/rainfd/projects/ResumeAgent/data/resumes` 目录中的测试文件，可以使用以下命令复制：

```bash
# 复制所有PDF文件
cp /home/rainfd/projects/ResumeAgent/data/resumes/*.pdf ./pdf/

# 复制所有Markdown文件
cp /home/rainfd/projects/ResumeAgent/data/resumes/*.md ./markdown/

# 复制所有文本文件
cp /home/rainfd/projects/ResumeAgent/data/resumes/*.txt ./txt/
```

## 测试建议

1. **功能测试**：使用这些文件测试解析器的基本功能
2. **格式测试**：验证不同文件格式的解析准确性
3. **语言测试**：确保中英文内容都能正确处理
4. **边界测试**：测试大文件、特殊字符、格式错误等边界情况

## 验证解析结果

运行解析器后，检查以下方面：

- 基本信息提取是否准确（姓名、邮箱、电话等）
- 教育经历和工作经历是否完整
- 技能列表是否正确分类
- 项目经历是否结构化良好
- 中文字符是否正确处理
