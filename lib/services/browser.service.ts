import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { logger } from '../utils/logger'
import { IJobData } from '../types/job.types'
import { browserRateLimiter } from '../utils/browser-rate-limiter'

export interface IJobInfo {
  title: string
  company: string
  location?: string
  salary_range?: string
  experience_required?: string
  education_required?: string
  raw_description: string
}

export interface IBrowserResult {
  success: boolean
  data?: IJobInfo
  error?: string
  needsUserAction?: boolean
  message?: string
}

export class BrowserService {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null

  constructor() {
    // 初始化服务
  }

  async initBrowser(): Promise<void> {
    try {
      logger.info('启动浏览器...')
      
      this.browser = await chromium.launch({
        headless: false, // 有头模式
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ],
        slowMo: 1000 // 减慢操作速度，方便用户观察
      })

      this.context = await this.browser.newContext({
        viewport: null, // 使用全屏视口
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      })

      this.page = await this.context.newPage()
      
      logger.info('浏览器启动成功')
    } catch (error) {
      logger.error('浏览器启动失败', 'BrowserService', error instanceof Error ? error : undefined)
      throw new Error(`浏览器启动失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async fetchJobPage(url: string): Promise<IBrowserResult> {
    try {
      // 从URL提取域名用于频率限制
      let domain: string;
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname;
      } catch (urlError) {
        return {
          success: false,
          error: 'URL格式无效'
        };
      }

      // 检查并等待频率限制
      logger.info(`检查访问频率限制: ${domain}`, 'BrowserService');
      await browserRateLimiter.waitAndAllow(domain);
      
      const status = browserRateLimiter.getStatus(domain);
      logger.info(
        `频率限制状态: ${status.requestsInWindow}/${status.maxRequests} 请求在窗口内`,
        'BrowserService'
      );

      if (!this.page) {
        await this.initBrowser()
      }

      if (!this.page) {
        throw new Error('页面初始化失败')
      }

      logger.info(`正在访问页面: ${url}`)
      
      // 设置超时和导航选项
      await this.page.setDefaultTimeout(30000)
      
      // 导航到页面
      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })

      if (!response || !response.ok()) {
        return {
          success: false,
          error: `页面加载失败: HTTP ${response?.status()}`
        }
      }

      // 等待页面加载完成
      await this.page.waitForLoadState('networkidle', { timeout: 10000 })

      // 检查页面是否存在（404或其他错误页面）
      const pageNotFound = await this.checkPageNotFound()
      if (pageNotFound) {
        return {
          success: false,
          error: '页面不存在或已被删除'
        }
      }

      // 检查是否需要登录验证
      const needsVerification = await this.checkForVerification()
      if (needsVerification) {
        return {
          success: false,
          needsUserAction: true,
          message: '检测到需要登录或验证，请在浏览器中手动完成验证后继续'
        }
      }

      // 提取岗位信息
      const jobInfo = await this.extractJobInfo()
      
      return {
        success: true,
        data: jobInfo
      }

    } catch (error) {
      logger.error('获取岗位页面失败', 'BrowserService', error instanceof Error ? error : undefined)
      return {
        success: false,
        error: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private async checkPageNotFound(): Promise<boolean> {
    if (!this.page) return false

    try {
      // 检查Boss直聘特有的404页面元素
      const notFoundSelectors = [
        'text=页面不存在',
        'text=找不到页面',
        'text=404',
        'text=岗位不存在',
        'text=职位已下线',
        'text=职位已失效',
        '.error-page',
        '.not-found',
        '[class*="404"]',
        '[class*="not-found"]',
        '[class*="error"]'
      ]

      for (const selector of notFoundSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            const isVisible = await element.isVisible()
            if (isVisible) {
              logger.info(`检测到页面不存在元素: ${selector}`)
              return true
            }
          }
        } catch (selectorError) {
          // 继续检查其他选择器
          continue
        }
      }

      // 检查页面标题是否包含错误信息
      try {
        const title = await this.page.title()
        const errorTitles = ['404', '页面不存在', '找不到', '错误', '失效']
        for (const errorTitle of errorTitles) {
          if (title.includes(errorTitle)) {
            logger.info(`页面标题包含错误信息: ${title}`)
            return true
          }
        }
      } catch (titleError) {
        logger.warn('无法获取页面标题')
      }

      // 检查是否有关键的岗位信息元素，如果完全没有则可能是404
      try {
        const hasJobContent = await this.page.$('.job-title, .position-head, .job-name, h1, .job-sec, .job-detail')
        if (!hasJobContent) {
          // 再检查是否有任何Boss直聘的正常页面元素
          const hasBossElements = await this.page.$('.header, .nav, .footer, [class*="boss"], [class*="zhipin"]')
          if (!hasBossElements) {
            logger.info('页面缺少关键内容元素，可能是404页面')
            return true
          }
        }
      } catch (contentError) {
        logger.warn('检查页面内容时出错')
      }

      return false
    } catch (error) {
      logger.error('检查页面不存在状态失败', 'BrowserService', error instanceof Error ? error : undefined)
      return false
    }
  }

  private async checkForVerification(): Promise<boolean> {
    if (!this.page) return false

    try {
      // 检查常见的验证元素
      const verificationSelectors = [
        '.login-dialog',
        '.verify-slider',
        '.captcha-container',
        '[class*="verify"]',
        '[class*="login"]',
        'iframe[src*="captcha"]'
      ]

      for (const selector of verificationSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            const isVisible = await element.isVisible()
            if (isVisible) {
              logger.info(`检测到验证元素: ${selector}`)
              return true
            }
          }
        } catch (selectorError) {
          // 某个选择器失败时继续检查其他选择器
          continue
        }
      }

      // 检查URL是否跳转到登录页面
      try {
        const currentUrl = this.page.url()
        if (currentUrl.includes('login') || currentUrl.includes('verify')) {
          logger.info('页面跳转到登录/验证页面')
          return true
        }
      } catch (urlError) {
        logger.warn('无法获取当前页面URL，可能页面已销毁')
      }

      return false
    } catch (error) {
      logger.error('检查验证状态失败', 'BrowserService', error instanceof Error ? error : undefined)
      // 如果页面已销毁，返回 true 以触发用户验证流程
      return error instanceof Error && error.message.includes('Execution context was destroyed')
    }
  }

  async waitForUserVerification(): Promise<boolean> {
    if (!this.page) return false

    try {
      logger.info('等待用户完成验证...')
      
      // 等待页面URL变化或特定元素出现，表示验证完成
      await this.page.waitForFunction(() => {
        // 检查是否有岗位相关的内容出现
        const jobTitle = document.querySelector('.job-title, .position-head, .job-name, h1')
        const jobDescription = document.querySelector('.job-sec, .job-detail, .job-description')
        
        return (jobTitle && jobTitle.textContent?.trim()) || 
               (jobDescription && jobDescription.textContent?.trim())
      }, { timeout: 120000 }) // 2分钟超时

      logger.info('用户验证完成')
      return true
    } catch (error) {
      logger.error('等待用户验证超时', 'BrowserService', error instanceof Error ? error : undefined)
      return false
    }
  }

  async extractJobInfo(): Promise<IJobInfo> {
    if (!this.page) {
      throw new Error('页面未初始化')
    }

    try {
      logger.info('开始提取岗位信息...')

      // 等待关键内容加载
      await this.page.waitForTimeout(2000)

      const jobInfo = await this.page.evaluate(() => {
        // Boss直聘页面选择器
        const getTextContent = (selectors: string[]): string => {
          for (const selector of selectors) {
            const element = document.querySelector(selector)
            if (element && element.textContent?.trim()) {
              return element.textContent.trim()
            }
          }
          return ''
        }

        const getAllTextContent = (selectors: string[]): string => {
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector)
            if (elements.length > 0) {
              return Array.from(elements)
                .map(el => el.textContent?.trim())
                .filter(text => text)
                .join('\n')
            }
          }
          return ''
        }

        // 提取职位标题
        const title = getTextContent([
          '.job-title',
          '.position-head h1',
          '.job-name',
          'h1[class*="job"]',
          'h1'
        ])

        // 提取公司名称
        const company = getTextContent([
          '.company-name',
          '.company-info h3',
          '.name',
          '[class*="company"] a',
          '.company a'
        ])

        // 提取工作地点
        const location = getTextContent([
          '.job-area',
          '.location',
          '.job-location',
          '[class*="location"]'
        ])

        // 提取薪资范围
        const salary_range = getTextContent([
          '.salary',
          '.job-salary',
          '[class*="salary"]',
          '.price'
        ])

        // 提取经验要求
        const experience_required = getTextContent([
          '.job-experience',
          '[class*="experience"]',
          '.job-require .experience',
          '.job-detail .experience'
        ])

        // 提取学历要求
        const education_required = getTextContent([
          '.job-education',
          '[class*="education"]',
          '.job-require .education',
          '.job-detail .education'
        ])

        // 提取岗位描述
        const raw_description = getAllTextContent([
          '.job-sec',
          '.job-detail',
          '.job-description',
          '.detail-content',
          '[class*="job-detail"]',
          '.text'
        ])

        return {
          title,
          company,
          location,
          salary_range,
          experience_required,
          education_required,
          raw_description
        }
      })

      logger.info('岗位信息提取完成', 'BrowserService', { title: jobInfo.title, company: jobInfo.company })
      
      if (!jobInfo.title || !jobInfo.company) {
        throw new Error('未能提取到关键岗位信息（标题或公司名称）')
      }

      return jobInfo
    } catch (error) {
      logger.error('提取岗位信息失败', 'BrowserService', error instanceof Error ? error : undefined)
      throw new Error(`信息提取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async closeBrowser(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }
      
      if (this.context) {
        await this.context.close()
        this.context = null
      }
      
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      
      logger.info('浏览器已关闭')
    } catch (error) {
      logger.error('关闭浏览器失败', 'BrowserService', error instanceof Error ? error : undefined)
    }
  }

  // 获取当前页面截图（用于调试）
  async takeScreenshot(path?: string): Promise<Buffer | null> {
    if (!this.page) return null

    try {
      const screenshot = await this.page.screenshot({
        path: path || `screenshot-${Date.now()}.png`,
        fullPage: true
      })
      return screenshot
    } catch (error) {
      logger.error('截图失败', 'BrowserService', error instanceof Error ? error : undefined)
      return null
    }
  }
}