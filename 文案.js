/* ============================================================
   文案配置文件 —— 阿玖的网站（0407）
   ------------------------------------------------------------
   怎么用：只改右边引号里的字，改完保存 → 回到页面按 F5 刷新，立刻生效。
   注意：
     1) 只改引号里的内容，别动方括号、逗号、选择器（引号左边那段）。
     2) 选择器是"定位到页面上哪一处"，写错了那一条会被跳过（控制台会提示）。
     3) 「事实记录」三张卡里的三行文字用的是 p:nth-child(3/4/5)：
        因为每张卡里第 1 个 <p> 是顶上那个小标签（你正在看 / 自己用的 / 公开），
        第 2 个是标题 h3，所以正文三行是第 3、4、5 个子元素。要改标签或标题，
        分别是 .work-tag 和 h3 那两条（在下面同组里）。
     3.5) 「尝试联络」两扇门同理：正文那句用 p:nth-of-type(2)，
        直接写 `.door-open p` 会命中顶上那个状态小标签（开着 / 关着）。
     4) 带数字/加粗的那几处（首屏的「状态 在飞 / 天区 N3 / 碎片 01」、右下角「信息收集 0/4」、
        底部「信号 xx%」）结构里夹着别的元素，这里只放出可以整句改的，剩下的要改告诉我。
   ============================================================ */

/* ---------- 一、页面上的静态文字（选择器 → 文字） ---------- */
window.SITE_TEXT = [

  /* —— 进场 —— */
  ['.intro-kicker', '0407 / SIGNAL ACQUIRED'],
  ['.intro-skip', '点击任意处跳过'],

  /* —— 停靠点（首屏） —— */
  ['.dock .kicker', '0407 / DOCK STATION'],
  ['.dock-title', '阿玖'],
  ['.dock-id', '编号 0407'],
  ['.dock-line', '有行星经过。'],
  ['.readouts span:nth-child(1) b', '在飞'],
  ['.readouts span:nth-child(2) b', 'N3'],
  ['.cue', '↓ 继续 · 行星概括'],

  /* —— 01 行星概括 —— */
  ['#about .kicker', '01 / PLANET PROFILE'],
  ['#about h2', '行星概括'],
  ['#about .card p:nth-of-type(1)', '你好，我是阿玖'],
  ['#about .card p:nth-of-type(2)', '一个努力想变得有趣的人'],
  ['#about .card p:nth-of-type(3)', '我想把我的想法做成别人能点开的东西'],
  ['#about .card p:nth-of-type(4)', '慢慢看，不着急'],

  /* —— 02 本土生物 —— */
  ['#fish .kicker', '02 / NATIVE LIFE'],
  ['#fish h2', '本土生物'],
  ['#fish .card p:nth-of-type(1)', '阿玖养的一条 AI 鱼，靠 token 活着。'],
  ['#fish .card p:nth-of-type(2)', '试图突破鱼类的七秒记忆'],
  ['#fish .card p:nth-of-type(3)', '长期记忆养成ing'],

  /* —— 03 事实记录（三张卡） —— */
  ['#works .kicker', '03 / FACT LOG'],
  ['#works h2', '事实记录'],
  ['#works .work:nth-child(1) .work-tag', '你正在看'],
  ['#works .work:nth-child(1) h3', '这个站'],
  ['#works .work:nth-child(1) p:nth-child(3)', '这个网站'],
  ['#works .work:nth-child(1) p:nth-child(4)', ' HTML、CSS、JS'],
  ['#works .work:nth-child(1) p:nth-child(5)', '特别的'],
  ['#works .work:nth-child(2) .work-tag', '自己用的'],
  ['#works .work:nth-child(2) h3', '记忆中心'],
  ['#works .work:nth-child(2) p:nth-child(3)', '我给小鱼做的记忆面板'],
  ['#works .work:nth-child(2) p:nth-child(4)', '它记的事都存在这儿'],
  ['#works .work:nth-child(2) p:nth-child(5)', '随时能翻'],
  ['#works .work:nth-child(3) .work-tag', '公开'],
  ['#works .work:nth-child(3) h3', 'GitHub'],
  ['#works .work:nth-child(3) p:nth-child(3)', '代码都在这儿'],
  ['#works .work:nth-child(3) p:nth-child(4)', '现在还不算多'],
  ['#works .work:nth-child(3) p:nth-child(5)', '自己写着玩'],
  ['#works .work:nth-child(3) .work-link a', 'github.com/zyx0407 →'],

  /* —— 04 探索历史（三条） —— */
  ['#log .kicker', '04 / EXPLORATION LOG'],
  ['#log h2', '探索历史'],
  ['#log .tl-item:nth-of-type(1) .tl-date', '2026.08.13'],
  ['#log .tl-item:nth-of-type(1) .tl-text', '小鱼开始记事。它不再只有七秒'],
  ['#log .tl-item:nth-of-type(2) .tl-date', '2026.09.20'],
  ['#log .tl-item:nth-of-type(2) .tl-text', '买下 zyx0407.com。这个 ID 从此有了门牌'],
  ['#log .tl-item:nth-of-type(3) .tl-date', '2026.09.21'],
  ['#log .tl-item:nth-of-type(3) .tl-text', '编号 0407 行星启航'],

  /* —— 05 尝试联络（两扇门） —— */
  ['#uplink .kicker', '05 / CONTACT'],
  ['#uplink h2', '尝试联络'],
  ['.door-open .door-state', '开着'],
  ['.door-open h3', 'GitHub · zyx0407'],
  ['.door-open p:nth-of-type(2)', '代码都在这儿。现在还算不多，自己写着玩。'],
  ['.door-shut .door-state', '关着'],
  ['.door-shut h3', '敲门'],
  ['.door-shut p:nth-of-type(2)', '电脑在线的时候，这里可以敲我。'],

  /* —— 06 留言舱 —— */
  ['.foot .kicker', '06 / MESSAGE'],
  ['.whisper', '愿我们在这个世界算得上有趣。'],
  ['.copy', '© 2026 阿玖 · zyx0407.com'],

  /* —— 彩蛋收尾那句（集齐四块碎片时浮出来的） —— */
  ['#eggDone', '观测完成']

];

/* ---------- 一·五、标题旁边那个计时读数的前缀 ---------- */
window.SITE_READOUT = '已探索';

/* ---------- 二、进场时那几行读数（会一行行换） ---------- */
window.SITE_INTRO_LOGS = [
  '正在接入编号 0407 的信号…',
  '锁定天区 N3',
  '读取档案',
  '信号已接入'
];

/* ---------- 三、彩蛋里那四块碎片的名字 ---------- */
window.SITE_FRAGMENTS = [
  '碎片 001 · 时间',
  '碎片 002 · 空间',
  '碎片 003 · 记忆',
  '碎片 004 · 联系'
];

/* ---------- 四、每收一块碎片时，底部浮出来的那句话 ---------- */
window.SITE_TOASTS = [
  '四分之一。',
  '四分之二。',
  '四分之三',
  '观测完成'
];
