import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '上传简历',
  description:
    '上传您的简历文档，支持PDF、Markdown和文本格式，AI将智能分析简历内容。',
  keywords: ['简历上传', '文档上传', 'AI分析', '简历解析'],
};

import ResumeUploadClient from './upload-client';

export default function ResumeUploadPage(): JSX.Element {
  return <ResumeUploadClient />;
}
