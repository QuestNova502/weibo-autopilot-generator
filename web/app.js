// Weibo Autopilot Generator - Frontend Logic

let currentStep = 1;

// Step Navigation
function nextStep(step) {
  if (validateStep(currentStep)) {
    showStep(step);
  }
}

function prevStep(step) {
  showStep(step);
}

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));

  // Show target step
  document.getElementById(`step${step}`).classList.remove('hidden');

  // Update progress indicators
  document.querySelectorAll('.step').forEach(el => {
    const stepNum = parseInt(el.dataset.step);
    const circle = el.querySelector('div');
    const text = el.querySelector('span');

    if (stepNum <= step) {
      circle.classList.add('step-active');
      circle.classList.remove('bg-gray-700');
      text.classList.remove('text-gray-500');
      text.classList.add('font-medium');
    } else {
      circle.classList.remove('step-active');
      circle.classList.add('bg-gray-700');
      text.classList.add('text-gray-500');
      text.classList.remove('font-medium');
    }
  });

  currentStep = step;

  // Update summary if on step 4
  if (step === 4) {
    updateConfigSummary();
  }
}

function validateStep(step) {
  if (step === 1) {
    const skillName = document.getElementById('skillName').value.trim();
    if (!skillName) {
      alert('请输入 Skill 名称');
      return false;
    }
    // Validate skill name format
    if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
      alert('Skill 名称只能包含字母、数字、下划线和连字符');
      return false;
    }
  }
  return true;
}

// Toggle group input visibility
document.querySelectorAll('input[name="contentSource"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const groupInput = document.getElementById('groupInput');
    if (e.target.value === 'group') {
      groupInput.classList.remove('hidden');
    } else {
      groupInput.classList.add('hidden');
    }
  });
});

// Get configuration from form
function getConfig() {
  return {
    skillName: document.getElementById('skillName').value.trim() || 'my-weibo-autopilot',
    weiboUser: document.getElementById('weiboUser').value.trim(),
    topics: document.getElementById('topics').value.split(',').map(t => t.trim()).filter(t => t),

    // Learning sources
    learnPosts: document.getElementById('learnPosts').checked,
    learnComments: document.getElementById('learnComments').checked,
    learnReposts: document.getElementById('learnReposts').checked,
    learnLikes: document.getElementById('learnLikes').checked,

    // Actions
    actionRepost: document.getElementById('actionRepost').checked,
    actionComment: document.getElementById('actionComment').checked,
    actionLike: document.getElementById('actionLike').checked,

    // Content source
    contentSource: document.querySelector('input[name="contentSource"]:checked').value,
    groupNames: document.getElementById('groupNames').value.split(',').map(g => g.trim()).filter(g => g),

    // Settings
    interval: parseInt(document.getElementById('interval').value) || 10,
    addSignature: document.getElementById('addSignature').checked,
  };
}

// Update config summary display
function updateConfigSummary() {
  const config = getConfig();
  const summary = document.getElementById('configSummary');

  const learnSources = [];
  if (config.learnPosts) learnSources.push('主页发帖');
  if (config.learnComments) learnSources.push('评论');
  if (config.learnReposts) learnSources.push('转发');
  if (config.learnLikes) learnSources.push('点赞');

  const actions = [];
  if (config.actionRepost) actions.push('转发');
  if (config.actionComment) actions.push('评论');
  if (config.actionLike) actions.push('点赞');

  summary.innerHTML = `
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">Skill 名称</span>
      <span class="font-medium">${config.skillName}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">微博用户</span>
      <span class="font-medium">${config.weiboUser || '(未设置)'}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">兴趣话题</span>
      <span class="font-medium">${config.topics.length > 0 ? config.topics.join(', ') : '(未设置)'}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">学习来源</span>
      <span class="font-medium">${learnSources.join(', ') || '无'}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">自动操作</span>
      <span class="font-medium">${actions.join(', ') || '无'}</span>
    </div>
    <div class="flex justify-between py-2 border-b border-gray-700">
      <span class="text-gray-400">内容来源</span>
      <span class="font-medium">${config.contentSource === 'home' ? '首页 Feed' : '分组: ' + config.groupNames.join(', ')}</span>
    </div>
    <div class="flex justify-between py-2">
      <span class="text-gray-400">执行间隔</span>
      <span class="font-medium">${config.interval} 分钟</span>
    </div>
  `;
}

// Generate skill files content
function generateSkillFiles(config) {
  // Generate user-config.json
  const userConfig = {
    skillName: config.skillName,
    weiboUser: config.weiboUser,
    topics: config.topics,
    learningSources: {
      posts: config.learnPosts,
      comments: config.learnComments,
      reposts: config.learnReposts,
      likes: config.learnLikes,
    },
    actions: {
      repost: config.actionRepost,
      comment: config.actionComment,
      like: config.actionLike,
    },
    contentSource: {
      type: config.contentSource,
      groups: config.groupNames,
    },
    settings: {
      intervalMinutes: config.interval,
      addSignature: config.addSignature,
    },
    createdAt: new Date().toISOString(),
  };

  // Generate user-profile.json template
  const userProfile = {
    lastUpdated: new Date().toISOString(),
    interests: config.topics,
    topics: config.topics,
    postingStyle: {
      averageLength: 100,
      usesEmoji: false,
      tone: 'neutral',
      commonPhrases: [],
    },
    commentStyle: {
      averageLength: 30,
      tone: 'friendly',
      commonPhrases: [],
    },
    recentPosts: [],
    recentComments: [],
  };

  // Generate skill.md
  const skillMd = `---
name: ${config.skillName}
description: Weibo autopilot skill for automatic reposting and engagement
version: 1.0.0
---

# ${config.skillName}

微博自动化 Skill，用于自动转发和互动。

## 功能

${config.actionRepost ? '- 自动转发感兴趣的内容' : ''}
${config.actionComment ? '- 自动评论' : ''}
${config.actionLike ? '- 自动点赞' : ''}

## 配置

- 内容来源: ${config.contentSource === 'home' ? '首页 Feed' : '分组 (' + config.groupNames.join(', ') + ')'}
- 执行间隔: ${config.interval} 分钟
- 兴趣话题: ${config.topics.join(', ')}

## 使用方法

1. 首次运行学习偏好:
   \`\`\`bash
   cd scripts && bun learn-preferences.ts
   \`\`\`

2. 启动自动运行:
   \`\`\`bash
   bun autopilot.ts
   \`\`\`

3. 带参数运行:
   \`\`\`bash
   bun autopilot.ts --interval 15 --group "科技"
   \`\`\`

## 注意事项

- 首次运行需要在浏览器中登录微博
- 建议设置合理的间隔时间，避免频繁操作
- 所有转发内容会带有 AI 标识
`;

  // Generate README.md
  const readmeMd = `# ${config.skillName}

基于 Claude Code 的微博自动化 Skill。

## 安装

1. 将此文件夹移动到 \`~/.agents/skills/\` 目录
2. 首次运行学习脚本: \`cd scripts && bun learn-preferences.ts\`
3. 启动自动运行: \`bun autopilot.ts\`

## 配置说明

配置文件位于 \`data/user-config.json\`，可以手动修改以下设置:

- \`topics\`: 感兴趣的话题
- \`settings.intervalMinutes\`: 执行间隔（分钟）
- \`contentSource.groups\`: 要浏览的分组

## 文件结构

\`\`\`
${config.skillName}/
├── scripts/
│   ├── weibo-cdp.ts      # Chrome DevTools Protocol 封装
│   ├── browse-feed.ts    # 浏览 Feed 并收集帖子
│   ├── repost.ts         # 转发功能
│   ├── learn-preferences.ts  # 学习用户偏好
│   └── autopilot.ts      # 主自动化脚本
├── data/
│   ├── user-config.json  # 用户配置
│   └── user-profile.json # 学习到的用户画像
├── skill.md
└── README.md
\`\`\`

## 许可

MIT License
`;

  return {
    userConfig,
    userProfile,
    skillMd,
    readmeMd,
  };
}

// Generate and download customized skill
async function generateAndDownload() {
  const config = getConfig();
  const files = generateSkillFiles(config);

  // Create ZIP file
  const zip = new JSZip();
  const folder = zip.folder(config.skillName);

  // Add config files
  folder.folder('data').file('user-config.json', JSON.stringify(files.userConfig, null, 2));
  folder.folder('data').file('user-profile.json', JSON.stringify(files.userProfile, null, 2));

  // Add documentation
  folder.file('skill.md', files.skillMd);
  folder.file('README.md', files.readmeMd);

  // Add scripts (fetched from templates)
  const scripts = folder.folder('scripts');

  // Fetch template scripts
  const scriptFiles = [
    'weibo-cdp.ts',
    'browse-feed.ts',
    'repost.ts',
    'learn-preferences.ts',
    'autopilot.ts',
  ];

  for (const scriptName of scriptFiles) {
    try {
      const response = await fetch(`../templates/weibo-autopilot/scripts/${scriptName}`);
      if (response.ok) {
        let content = await response.text();
        // Customize autopilot.ts with user config
        if (scriptName === 'autopilot.ts') {
          // Update default interval
          content = content.replace(
            /const intervalMinutes = intervalIndex >= 0 \? parseInt\(args\[intervalIndex \+ 1\]\) : \d+;/,
            `const intervalMinutes = intervalIndex >= 0 ? parseInt(args[intervalIndex + 1]) : ${config.interval};`
          );
        }
        scripts.file(scriptName, content);
      }
    } catch (e) {
      console.error(`Failed to fetch ${scriptName}:`, e);
    }
  }

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${config.skillName}.zip`);
}

// Download default template
async function downloadDefault() {
  const zip = new JSZip();
  const folder = zip.folder('weibo-autopilot');

  // Default config
  const defaultConfig = {
    skillName: 'weibo-autopilot',
    weiboUser: '',
    topics: ['科技', '新闻'],
    learningSources: {
      posts: true,
      comments: true,
      reposts: false,
      likes: false,
    },
    actions: {
      repost: true,
      comment: false,
      like: false,
    },
    contentSource: {
      type: 'home',
      groups: [],
    },
    settings: {
      intervalMinutes: 10,
      addSignature: true,
    },
    createdAt: new Date().toISOString(),
  };

  const defaultProfile = {
    lastUpdated: new Date().toISOString(),
    interests: ['科技', '新闻'],
    topics: ['科技', '新闻'],
    postingStyle: {
      averageLength: 100,
      usesEmoji: false,
      tone: 'neutral',
      commonPhrases: [],
    },
    commentStyle: {
      averageLength: 30,
      tone: 'friendly',
      commonPhrases: [],
    },
    recentPosts: [],
    recentComments: [],
  };

  folder.folder('data').file('user-config.json', JSON.stringify(defaultConfig, null, 2));
  folder.folder('data').file('user-profile.json', JSON.stringify(defaultProfile, null, 2));

  // Add documentation
  folder.file('skill.md', `---
name: weibo-autopilot
description: Weibo autopilot skill for automatic reposting
version: 1.0.0
---

# Weibo Autopilot

微博自动化 Skill - 通用模板

## 快速开始

1. 编辑 \`data/user-config.json\` 配置你的偏好
2. 运行 \`cd scripts && bun learn-preferences.ts\` 学习你的风格
3. 运行 \`bun autopilot.ts\` 启动自动化

详细说明请查看 README.md
`);

  folder.file('README.md', `# Weibo Autopilot

基于 Claude Code 的微博自动化 Skill。

## 安装

1. 解压并移动到 \`~/.agents/skills/weibo-autopilot\`
2. 编辑 \`data/user-config.json\` 设置你的偏好
3. 运行学习脚本: \`cd scripts && bun learn-preferences.ts\`
4. 启动: \`bun autopilot.ts\`

## 配置

编辑 \`data/user-config.json\`:

- \`topics\`: 感兴趣的话题（用于筛选内容）
- \`settings.intervalMinutes\`: 执行间隔
- \`contentSource.type\`: 'home' 或 'group'
- \`contentSource.groups\`: 分组名称列表

## 命令

\`\`\`bash
# 学习偏好
bun learn-preferences.ts

# 启动自动化
bun autopilot.ts

# 指定分组
bun autopilot.ts --group "科技"

# 设置间隔
bun autopilot.ts --interval 15

# 试运行（不实际转发）
bun autopilot.ts --dry-run
\`\`\`

## 许可

MIT License
`);

  // Add scripts
  const scripts = folder.folder('scripts');
  const scriptFiles = [
    'weibo-cdp.ts',
    'browse-feed.ts',
    'repost.ts',
    'learn-preferences.ts',
    'autopilot.ts',
  ];

  for (const scriptName of scriptFiles) {
    try {
      const response = await fetch(`../templates/weibo-autopilot/scripts/${scriptName}`);
      if (response.ok) {
        const content = await response.text();
        scripts.file(scriptName, content);
      }
    } catch (e) {
      console.error(`Failed to fetch ${scriptName}:`, e);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'weibo-autopilot.zip');
}

// Helper to download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showStep(1);
});
