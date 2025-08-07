import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
    template: '%s | ResumeXAgent',
  },
  description:
    '帮助求职者提升简历质量，精准匹配心仪岗位。通过AI技术深度分析简历内容，智能匹配岗位要求，提供专业的优化建议，让您在求职路上更加从容自信。',
  keywords: [
    'AI简历分析',
    '简历优化',
    '岗位匹配',
    '求职助手',
    'STAR法则',
    '简历工具',
    '职业规划',
    '面试准备',
    '求职分析',
    '智能匹配',
  ],
  authors: [{ name: 'ResumeXAgent Team' }],
  creator: 'ResumeXAgent',
  publisher: 'ResumeXAgent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://resumexagent.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://resumexagent.com',
    title: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
    description:
      '帮助求职者提升简历质量，精准匹配心仪岗位。通过AI技术深度分析简历内容，智能匹配岗位要求，提供专业的优化建议。',
    siteName: 'ResumeXAgent',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
    description:
      '帮助求职者提升简历质量，精准匹配心仪岗位。通过AI技术深度分析简历内容，智能匹配岗位要求，提供专业的优化建议。',
    images: ['/images/twitter-image.png'],
    creator: '@ResumeXAgent',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0066CC',
      },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#0066CC',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'ResumeXAgent',
              description:
                '智能简历分析与岗位匹配工具，帮助求职者提升简历质量，精准匹配心仪岗位',
              url: 'https://resumexagent.com',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CNY',
              },
              featureList: [
                'AI简历分析',
                '岗位智能匹配',
                'STAR法则检测',
                '面试问题预测',
                '薪资分析建议',
              ],
              author: {
                '@type': 'Organization',
                name: 'ResumeXAgent Team',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
