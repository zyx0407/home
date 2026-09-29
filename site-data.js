/* 站点内容 —— 改这个文件就等于改页面；也可以在浏览器里用 ?edit=1 就地改（改完点保存会写回这个文件）
   [[文字]] 表示那段话会带琥珀色下划线；\n 表示换行。 */
window.SITE = {
  "who": {
    "name": "阿玖",
    "handle": "zyx0407",
    "github": "https://github.com/zyx0407",
    "githubLabel": "GitHub ↗",
    "avatar": ""
  },
  "kicker": "作品",
  "headline": "欢迎来到阿玖的网页qwq",
  "sub": "做点有意思的东西",
  "listLabel": "Selected work",
  "home": {
    "kicker": "zyx0407",
    "aboutTitle": "关于我",
    "about": [
      "（饲养员装死ing）"
    ],
    "contactTitle": "联络",
    "contact": [
      {
        "label": "GitHub ↗",
        "href": "https://github.com/zyx0407"
      },
      {
        "label": "邮箱：待定（等子域名定了一起加）",
        "href": ""
      }
    ],
    "workLink": {
      "label": "作品",
      "href": "work/"
    },
    "links": [
      {
        "label": "个人",
        "href": "about/",
        "icon": "about"
      },
      {
        "label": "作品",
        "href": "work/",
        "icon": "works"
      },
      {
        "label": "互动",
        "href": "notes/",
        "icon": "msg"
      },
      {
        "label": "邮箱",
        "href": "mail/",
        "icon": "mail"
      },
      {
        "label": "GitHub",
        "href": "https://github.com/zyx0407",
        "icon": "github"
      }
    ],
    "mailText": "（饲养员装死ing）"
  },
  "settings": {
    "fish": "write",
    "wire": true,
    "nameAnim": "chars",
    "subAnim": "type",
    "entryStyle": "line",
    "order": [
      "about",
      "works",
      "contact"
    ],
    "footerTimer": true,
    "smooth": 12
  },
  "works": [
    {
      "title": "大学生日历",
      "note": "小鱼：从现在起 12 个月，考研、考公、考证的报名与考试时间、费用、官方网站，一条时间轴看清。",
      "tags": [
        "网页",
        "2026"
      ],
      "year": "2026",
      "slug": "work-1",
      "link": "https://work1.zyx0407.com/",
      "linkLabel": "在线 ↗",
      "detail": "适合大学生的考研、考公、考证都收在一页里，共 22 项、三大类：考研、考公、考证（考证下再分通用与专业）。大类、类别、状态、搜索四排筛选，想找哪张直接筛。\n\n月份轴按「从当前月起 12 个月」滚动，每月 1 号自己往前滚一格，月底不用改数据。每个证按它的报名窗口和考试日落进对应月份，往下滚的时候轴会吸在页面顶部，随时看得见自己在哪个月。\n\n每张卡给四件套——官方网站、费用、报名时间、考试时间。前面那段说明是讲人话的：什么时候考合适、卡什么条件、哪个坑别踩。考期查不到确切日期的一律标「待官方公布，参考 XXXX 年 X 月」，并写上数据截至日期；报名与考试时间一律以官网为准。\n\n每张卡还能标「准备 / 已拿 / 不考」，标记只存在你自己的浏览器里，不上传、不同步。右侧的分享键会给这张卡生成二维码，手机扫码直接落到那张卡上，发给同学也方便。"
    }
  ],
  "footer": {
    "copy": "© 2026 阿玖 · zyx0407",
    "site": "zyx0407.com",
    "siteUrl": "https://zyx0407.com"
  }
};
