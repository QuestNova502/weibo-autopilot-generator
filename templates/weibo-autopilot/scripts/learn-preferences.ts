import process from 'node:process';
import {
  launchWeiboBrowser,
  navigateTo,
  evaluateScript,
  waitForElement,
  scrollDown,
  loadJsonFile,
  saveJsonFile,
  sleep,
  type WeiboBrowser,
} from './weibo-cdp.ts';

interface UserConfig {
  weiboUid?: string;
  weiboUser?: string;
  customPrompt?: string;
  [key: string]: unknown;
}

// 判断是否为纯数字 UID
function isNumericUid(value: string): boolean {
  return /^\d+$/.test(value);
}

// 通过微博搜索解析昵称获取 UID
async function resolveNicknameToUid(browser: WeiboBrowser, nickname: string): Promise<string> {
  console.log(`[learn] Resolving nickname "${nickname}" to UID via search...`);

  // 导航到用户搜索页
  await navigateTo(browser, `https://s.weibo.com/user?q=${encodeURIComponent(nickname)}`);
  await sleep(3000);

  // 等待搜索结果加载
  try {
    await waitForElement(browser, '.card-wrap, .m-error', 15000);
  } catch {
    throw new Error(`搜索超时，请检查网络连接`);
  }

  // 从搜索结果中提取第一个用户的 UID
  const result = await evaluateScript<{ uid: string | null; foundName: string | null }>(browser, `
    (function() {
      // 查找用户卡片中的链接
      const userCard = document.querySelector('.card-wrap .card-user-b, .card-wrap .card');
      if (!userCard) return { uid: null, foundName: null };

      // 获取用户名用于确认
      const nameEl = userCard.querySelector('.name, .title a');
      const foundName = nameEl?.textContent?.trim() || null;

      // 获取用户主页链接
      const link = userCard.querySelector('a[href*="/u/"]');
      if (!link) return { uid: null, foundName };

      const href = link.getAttribute('href') || '';
      const match = href.match(/\\/u\\/(\\d+)/);
      return { uid: match ? match[1] : null, foundName };
    })()
  `);

  if (!result.uid) {
    throw new Error(
      `未找到昵称为 "${nickname}" 的用户。\n` +
      '请确认昵称是否正确，或直接使用 UID。'
    );
  }

  console.log(`[learn] Found user: ${result.foundName || nickname}, UID: ${result.uid}`);
  return result.uid;
}

// 获取用户配置
async function getUserConfig(): Promise<{ weiboUser: string; isUid: boolean }> {
  const config = await loadJsonFile<UserConfig>('user-config.json', {});

  // 优先使用 weiboUid（纯数字）
  if (config.weiboUid) {
    return { weiboUser: config.weiboUid, isUid: true };
  }

  // 其次使用 weiboUser（可能是昵称或 UID）
  if (config.weiboUser) {
    return {
      weiboUser: config.weiboUser,
      isUid: isNumericUid(config.weiboUser),
    };
  }

  // 如果都没有配置，抛出错误提示用户
  throw new Error(
    '请先在 data/user-config.json 中配置你的微博昵称或 UID (weiboUser 字段)。\n' +
    '昵称: 你的微博名字\n' +
    'UID: 纯数字，可从微博主页 URL (weibo.com/u/xxx) 获取'
  );
}

const COMMENT_OUTBOX_URL = 'https://weibo.com/comment/outbox';

interface UserProfile {
  lastUpdated: string;
  interests: string[];
  topics: string[];
  postingStyle: {
    averageLength: number;
    usesEmoji: boolean;
    tone: string; // 'casual' | 'formal' | 'humorous' | etc.
    commonPhrases: string[];
  };
  commentStyle: {
    averageLength: number;
    tone: string;
    commonPhrases: string[];
  };
  recentPosts: Array<{
    content: string;
    timestamp: string;
  }>;
  recentComments: Array<{
    content: string;
    originalPost: string;
    timestamp: string;
  }>;
}

async function extractPostsFromProfile(browser: WeiboBrowser): Promise<Array<{ content: string; timestamp: string }>> {
  console.log('[learn] Extracting posts from user profile...');

  const posts: Array<{ content: string; timestamp: string }> = [];

  // Scroll and collect posts
  for (let i = 0; i < 5; i++) {
    const newPosts = await evaluateScript<Array<{ content: string; timestamp: string }>>(browser, `
      (function() {
        const posts = [];
        const feedItems = document.querySelectorAll('[class*="Feed_body"], [class*="card-wrap"], .WB_detail');

        feedItems.forEach(item => {
          const textEl = item.querySelector('[class*="detail_wbtext"], .WB_text, [class*="text"]');
          const timeEl = item.querySelector('[class*="head_time"], .WB_from, time, [class*="time"]');

          if (textEl) {
            posts.push({
              content: textEl.textContent?.trim() || '',
              timestamp: timeEl?.textContent?.trim() || new Date().toISOString()
            });
          }
        });

        return posts;
      })()
    `);

    for (const post of newPosts) {
      if (post.content && !posts.some(p => p.content === post.content)) {
        posts.push(post);
      }
    }

    await scrollDown(browser, 800);
    await sleep(2000);
  }

  console.log(`[learn] Found ${posts.length} posts`);
  return posts.slice(0, 50); // Limit to 50 most recent
}

async function extractCommentsFromOutbox(browser: WeiboBrowser): Promise<Array<{ content: string; originalPost: string; timestamp: string }>> {
  console.log('[learn] Extracting comments from outbox...');

  const comments: Array<{ content: string; originalPost: string; timestamp: string }> = [];

  // Wait for comment list to load
  await sleep(3000);

  // Scroll and collect comments
  for (let i = 0; i < 3; i++) {
    const newComments = await evaluateScript<Array<{ content: string; originalPost: string; timestamp: string }>>(browser, `
      (function() {
        const comments = [];
        const commentItems = document.querySelectorAll('[class*="comment"], .list_li, [class*="Card"]');

        commentItems.forEach(item => {
          const contentEl = item.querySelector('[class*="text"], [class*="content"], .WB_text');
          const originalEl = item.querySelector('[class*="original"], [class*="source"], .WB_info');
          const timeEl = item.querySelector('[class*="time"], .WB_from, time');

          if (contentEl) {
            comments.push({
              content: contentEl.textContent?.trim() || '',
              originalPost: originalEl?.textContent?.trim() || '',
              timestamp: timeEl?.textContent?.trim() || new Date().toISOString()
            });
          }
        });

        return comments;
      })()
    `);

    for (const comment of newComments) {
      if (comment.content && !comments.some(c => c.content === comment.content)) {
        comments.push(comment);
      }
    }

    await scrollDown(browser, 600);
    await sleep(2000);
  }

  console.log(`[learn] Found ${comments.length} comments`);
  return comments.slice(0, 30); // Limit to 30 most recent
}

function analyzePostingStyle(posts: Array<{ content: string }>): UserProfile['postingStyle'] {
  if (posts.length === 0) {
    return {
      averageLength: 0,
      usesEmoji: false,
      tone: 'neutral',
      commonPhrases: [],
    };
  }

  const lengths = posts.map(p => p.content.length);
  const averageLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const usesEmoji = posts.some(p => emojiRegex.test(p.content));

  // Simple tone analysis
  let tone = 'neutral';
  const allText = posts.map(p => p.content).join(' ');
  if (allText.includes('哈哈') || allText.includes('😂') || allText.includes('笑')) {
    tone = 'humorous';
  } else if (allText.includes('认为') || allText.includes('分析') || allText.includes('观点')) {
    tone = 'analytical';
  } else if (allText.includes('！') && allText.split('！').length > posts.length) {
    tone = 'enthusiastic';
  }

  // Extract common phrases (simple n-gram analysis)
  const phrases: Record<string, number> = {};
  for (const post of posts) {
    const words = post.content.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join('');
      if (phrase.length >= 4) {
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }
  }

  const commonPhrases = Object.entries(phrases)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  return {
    averageLength,
    usesEmoji,
    tone,
    commonPhrases,
  };
}

function analyzeCommentStyle(comments: Array<{ content: string }>): UserProfile['commentStyle'] {
  if (comments.length === 0) {
    return {
      averageLength: 0,
      tone: 'neutral',
      commonPhrases: [],
    };
  }

  const lengths = comments.map(c => c.content.length);
  const averageLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  // Simple tone analysis
  let tone = 'neutral';
  const allText = comments.map(c => c.content).join(' ');
  if (allText.includes('同意') || allText.includes('赞') || allText.includes('好')) {
    tone = 'supportive';
  } else if (allText.includes('不同意') || allText.includes('但是') || allText.includes('不过')) {
    tone = 'critical';
  }

  // Extract common phrases
  const phrases: Record<string, number> = {};
  for (const comment of comments) {
    const content = comment.content;
    // Look for common expressions
    const patterns = ['哈哈', '确实', '同意', '有道理', '不错', '厉害', '赞', '支持'];
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        phrases[pattern] = (phrases[pattern] || 0) + 1;
      }
    }
  }

  const commonPhrases = Object.entries(phrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  return {
    averageLength,
    tone,
    commonPhrases,
  };
}

function extractInterestsAndTopics(posts: Array<{ content: string }>, comments: Array<{ content: string }>): { interests: string[]; topics: string[] } {
  const allText = [...posts.map(p => p.content), ...comments.map(c => c.content)].join(' ');

  // Topic keywords detection
  const topicPatterns: Record<string, string[]> = {
    '科技': ['AI', '人工智能', '技术', '编程', '代码', 'Claude', 'OpenAI', 'GPT', '互联网', '软件'],
    '足球': ['足球', '比赛', '球队', '进球', '联赛', '世界杯', '欧冠', '球员'],
    '国际新闻': ['国际', '美国', '欧洲', '政治', '经济', '外交', '军事'],
    '军事': ['军事', '军队', '武器', '战争', '国防'],
    '财经': ['股票', '投资', '经济', '金融', '市场'],
    '生活': ['生活', '美食', '旅行', '日常'],
  };

  const interests: string[] = [];
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    const matchCount = keywords.filter(kw => allText.includes(kw)).length;
    if (matchCount >= 2) {
      topics.push(topic);
    }
    if (matchCount >= 1) {
      interests.push(...keywords.filter(kw => allText.includes(kw)));
    }
  }

  return {
    interests: [...new Set(interests)].slice(0, 20),
    topics: [...new Set(topics)],
  };
}

async function learnPreferences(forceRefresh: boolean = false): Promise<void> {
  // Check if we have recent data
  if (!forceRefresh) {
    const existing = await loadJsonFile<UserProfile | null>('user-profile.json', null);
    if (existing) {
      const lastUpdated = new Date(existing.lastUpdated);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        console.log(`[learn] User profile was updated ${daysSinceUpdate.toFixed(1)} days ago. Use --refresh to force update.`);
        return;
      }
    }
  }

  console.log('[learn] Starting preference learning...');

  // 获取用户配置
  const { weiboUser, isUid } = await getUserConfig();
  console.log(`[learn] User input: ${weiboUser} (${isUid ? 'UID' : 'nickname'})`);

  let browser: Awaited<ReturnType<typeof launchWeiboBrowser>> | null = null;

  try {
    // 先打开微博首页以便登录
    browser = await launchWeiboBrowser('https://weibo.com');

    // Wait for page to load
    console.log('[learn] Waiting for Weibo to load...');
    await sleep(5000);

    // Check if logged in
    const isLoggedIn = await evaluateScript<boolean>(browser, `
      !document.querySelector('[class*="LoginBtn"]') && !window.location.href.includes('passport')
    `);

    if (!isLoggedIn) {
      console.log('[learn] Please log in to Weibo in the browser window...');
      await waitForElement(browser, '[class*="Feed"], [class*="card"]', 120_000);
    }

    // 确定用户主页 URL
    let userProfileUrl: string;
    if (isUid) {
      userProfileUrl = `https://weibo.com/u/${weiboUser}`;
    } else {
      // 通过搜索解析昵称获取 UID
      const uid = await resolveNicknameToUid(browser, weiboUser);
      userProfileUrl = `https://weibo.com/u/${uid}`;
    }

    console.log(`[learn] Navigating to user profile: ${userProfileUrl}`);
    await navigateTo(browser, userProfileUrl);
    await sleep(3000);

    // Extract posts from profile
    const posts = await extractPostsFromProfile(browser);

    // Navigate to comment outbox
    console.log('[learn] Navigating to comment outbox...');
    await navigateTo(browser, COMMENT_OUTBOX_URL);
    await sleep(3000);

    // Extract comments
    const comments = await extractCommentsFromOutbox(browser);

    // Analyze data
    console.log('[learn] Analyzing posting patterns...');
    const postingStyle = analyzePostingStyle(posts);
    const commentStyle = analyzeCommentStyle(comments);
    const { interests, topics } = extractInterestsAndTopics(posts, comments);

    // Build user profile
    const userProfile: UserProfile = {
      lastUpdated: new Date().toISOString(),
      interests,
      topics,
      postingStyle,
      commentStyle,
      recentPosts: posts.slice(0, 20),
      recentComments: comments.slice(0, 15),
    };

    // Save profile
    await saveJsonFile('user-profile.json', userProfile);
    console.log('[learn] User profile saved successfully!');

    console.log('\n=== Learned Profile Summary ===');
    console.log(`Topics of interest: ${topics.join(', ') || 'Not identified'}`);
    console.log(`Keywords: ${interests.slice(0, 10).join(', ') || 'Not identified'}`);
    console.log(`Posting style: ${postingStyle.tone}, avg ${postingStyle.averageLength} chars`);
    console.log(`Comment style: ${commentStyle.tone}, avg ${commentStyle.averageLength} chars`);
    console.log(`Posts analyzed: ${posts.length}`);
    console.log(`Comments analyzed: ${comments.length}`);

  } catch (error) {
    console.error(`[learn] Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--refresh') || args.includes('-r');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Learn user posting and commenting preferences from Weibo

Usage:
  npx -y bun learn-preferences.ts [options]

Options:
  --refresh, -r   Force refresh (ignore cached data)
  --help, -h      Show this help

Data Sources:
  - User profile: 从 data/user-config.json 中的 weiboUser 读取
  - Comment outbox: ${COMMENT_OUTBOX_URL}

Note:
  请确保在 data/user-config.json 中配置了你的微博昵称或 UID (weiboUser 字段)。
  支持两种格式：
  - 昵称: 你的微博名字
  - UID: 纯数字，可从微博主页 URL (weibo.com/u/xxx) 获取
`);
    process.exit(0);
  }

  await learnPreferences(forceRefresh);
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
