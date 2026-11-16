/**
 * 内置词表：没有配置 LLM Key 时也能提取 PortSwigger / 渗透测试常见术语。
 * 只用于粗略提取，释义保持一句话，方便朗读。
 */
export const GLOSSARY = [
  // 漏洞
  { term: 'SQL injection', zh: 'SQL 注入：把恶意 SQL 语句注入输入点，改变数据库查询逻辑。', tag: '漏洞' },
  { term: 'cross-site scripting', zh: '跨站脚本（XSS）：把恶意脚本注入页面，在其他用户浏览器中执行。', tag: '漏洞' },
  { term: 'XSS', zh: '跨站脚本的缩写；分为反射型、存储型和 DOM 型。', tag: '漏洞' },
  { term: 'CSRF', zh: '跨站请求伪造：诱使已登录用户在自己不知情时发出状态变更请求。', tag: '漏洞' },
  { term: 'SSRF', zh: '服务端请求伪造：让服务器访问攻击者指定的内网或云元数据地址。', tag: '漏洞' },
  { term: 'IDOR', zh: '不安全的直接对象引用：修改对象标识符越权访问他人数据。', tag: '漏洞' },
  { term: 'XXE', zh: 'XML 外部实体注入：利用 XML 解析器读取文件或发起内网请求。', tag: '漏洞' },
  { term: 'SSTI', zh: '服务端模板注入：把恶意模板表达式注入服务端模板引擎并执行。', tag: '漏洞' },
  { term: 'OS command injection', zh: '操作系统命令注入：把 shell 命令注入应用执行流程。', tag: '漏洞' },
  { term: 'path traversal', zh: '路径穿越：用 ../ 等序列读取预期目录之外的文件。', tag: '漏洞' },
  { term: 'directory traversal', zh: '目录穿越：路径穿越的另一种叫法。', tag: '漏洞' },
  { term: 'business logic vulnerabilities', zh: '业务逻辑漏洞：利用业务流程设计缺陷获取不当利益。', tag: '漏洞' },
  { term: 'race condition', zh: '条件竞争：利用并发时序差让检查与使用不一致。', tag: '漏洞' },
  { term: 'HTTP request smuggling', zh: 'HTTP 请求走私：利用前后端对请求边界解析不一致夹带请求。', tag: '漏洞' },
  { term: 'web cache poisoning', zh: 'Web 缓存投毒：把恶意响应写入共享缓存，影响其他用户。', tag: '漏洞' },
  { term: 'web cache deception', zh: 'Web 缓存欺骗：诱使缓存把敏感动态页面当作静态资源存储。', tag: '漏洞' },
  { term: 'clickjacking', zh: '点击劫持：用透明 iframe 诱导用户点击隐藏的目标。', tag: '漏洞' },
  { term: 'CORS misconfiguration', zh: 'CORS 配置错误：错误的跨域策略让恶意站点读取敏感响应。', tag: '漏洞' },
  { term: 'DOM-based XSS', zh: 'DOM 型 XSS：漏洞发生在浏览器端 JavaScript 处理 DOM 的过程中。', tag: '漏洞' },
  { term: 'reflected XSS', zh: '反射型 XSS：恶意脚本随请求参数即时反射回页面。', tag: '漏洞' },
  { term: 'stored XSS', zh: '存储型 XSS：恶意脚本被持久化保存，访问页面时执行。', tag: '漏洞' },
  { term: 'blind SQL injection', zh: '盲注：看不到查询结果，靠真假条件或时间延迟推断数据。', tag: '漏洞' },
  { term: 'NoSQL injection', zh: 'NoSQL 注入：向 NoSQL 查询注入操作符或结构改变查询语义。', tag: '漏洞' },
  { term: 'prototype pollution', zh: '原型链污染：污染 JavaScript 对象原型，影响后续对象行为。', tag: '漏洞' },
  { term: 'open redirect', zh: '开放重定向：应用把用户重定向到攻击者可控的外部地址。', tag: '漏洞' },
  { term: 'insecure deserialization', zh: '不安全的反序列化：反序列化不可信数据导致对象注入或远程代码执行。', tag: '漏洞' },
  { term: 'session fixation', zh: '会话固定：攻击者预置会话 ID，诱导受害者登录后沿用该会话。', tag: '漏洞' },
  { term: 'password reset poisoning', zh: '密码重置投毒：篡改 Host 头等让重置链接指向攻击者域名。', tag: '漏洞' },
  { term: 'Host header injection', zh: 'Host 头注入：滥用 Host 头影响生成的链接、缓存或路由。', tag: '漏洞' },
  { term: 'HTTP parameter pollution', zh: 'HTTP 参数污染：重复参数让前后端解析出不同值。', tag: '漏洞' },
  { term: 'privilege escalation', zh: '权限提升：从低权限获取更高权限，分水平和垂直两类。', tag: '漏洞' },
  { term: 'subdomain takeover', zh: '子域接管：失效的 DNS 记录指向可被攻击者注册的服务。', tag: '漏洞' },
  { term: 'file upload vulnerabilities', zh: '文件上传漏洞：绕过类型或内容校验上传可执行或危险文件。', tag: '漏洞' },
  { term: 'server-side template injection', zh: '服务端模板注入（SSTI 全称）。', tag: '漏洞' },

  // 认证与协议
  { term: 'authentication', zh: '认证：验证用户身份的过程，如登录、会话与多因素认证。', tag: '概念' },
  { term: 'access control', zh: '访问控制：决定已认证用户能做什么、能看哪些资源。', tag: '概念' },
  { term: 'JWT', zh: 'JSON Web Token：常用于无状态认证的签名令牌，需校验签名与算法。', tag: '协议' },
  { term: 'OAuth', zh: '开放授权框架：让第三方在用户授权下获得有限访问权限。', tag: '协议' },
  { term: 'SAML', zh: '企业单点登录常用的 XML 断言协议。', tag: '协议' },
  { term: 'GraphQL', zh: '由客户端指定查询字段的 API 查询语言，注意内省与批量查询风险。', tag: '概念' },
  { term: 'API', zh: '应用程序编程接口；测试重点是认证、授权、速率限制与对象级权限。', tag: '概念' },
  { term: 'WebSocket', zh: '全双工通信协议；注意跨站 WebSocket 劫持与消息授权。', tag: '协议' },
  { term: 'MFA', zh: '多因素认证：密码之外再要求第二因素。', tag: '概念' },
  { term: '2FA', zh: '双因素认证，MFA 的常见形式。', tag: '概念' },
  { term: 'brute-force', zh: '暴力破解：穷举口令、验证码或令牌。', tag: '攻击' },
  { term: 'credential stuffing', zh: '撞库：用泄露的账号密码批量尝试其他站点。', tag: '攻击' },
  { term: 'CSRF token', zh: '一次性随机令牌，用于证明请求来自受信任页面。', tag: '防护' },
  { term: 'SameSite', zh: 'Cookie 属性，限制跨站请求携带 Cookie，缓解 CSRF。', tag: '防护' },
  { term: 'Content Security Policy', zh: '内容安全策略：用响应头限制页面可加载或执行的资源来源。', tag: '防护' },
  { term: 'CSP', zh: '内容安全策略的缩写，常以 Content-Security-Policy 响应头下发。', tag: '防护' },
  { term: 'CORS', zh: '跨域资源共享：控制浏览器能否跨源读取响应。', tag: '协议' },
  { term: 'TLS', zh: '传输层安全：为 HTTP 提供加密与身份校验。', tag: '协议' },
  { term: 'DNS', zh: '域名系统：把域名解析为 IP，常关注解析差异与 DNS 重绑定。', tag: '协议' },
  { term: 'HTTP', zh: '超文本传输协议：Web 请求与响应的基础。', tag: '协议' },
  { term: 'HTTPS', zh: 'HTTP over TLS：加密的 HTTP。', tag: '协议' },

  // 工具
  { term: 'Burp Suite', zh: 'PortSwigger 出品的 Web 渗透测试集成平台。', tag: '工具' },
  { term: 'Burp Proxy', zh: 'Burp 代理：拦截并修改浏览器与服务器之间的 HTTP(S) 流量。', tag: '工具' },
  { term: 'Burp Repeater', zh: 'Repeater：手动修改并重放单个请求，观察响应差异。', tag: '工具' },
  { term: 'Burp Intruder', zh: 'Intruder：自动化批量发包，用于爆破、枚举与模糊测试。', tag: '工具' },
  { term: 'Burp Scanner', zh: 'Burp 自带漏洞扫描器，Professional 版功能。', tag: '工具' },
  { term: 'Burp Collaborator', zh: '带外交互服务器，用于检测盲注、SSRF 等外带流量。', tag: '工具' },
  { term: 'Decoder', zh: 'Burp 的编码与解码工具，支持 URL、Base64、Hex 等。', tag: '工具' },
  { term: 'Comparer', zh: 'Burp 的请求与响应差异对比工具。', tag: '工具' },
  { term: 'Sequencer', zh: '分析令牌随机性的 Burp 工具，如会话 ID 与 CSRF token。', tag: '工具' },
  { term: 'BApp Store', zh: 'Burp 扩展商店。', tag: '工具' },
  { term: 'fscan', zh: '内网综合扫描工具：存活、端口、漏洞与常见服务爆破。', tag: '工具' },
  { term: 'Nmap', zh: '网络发现与端口、服务扫描工具。', tag: '工具' },
  { term: 'ffuf', zh: '快速 Web 模糊测试工具，常用于目录与参数发现。', tag: '工具' },
  { term: 'Gobuster', zh: '目录、子域与虚拟主机枚举工具。', tag: '工具' },
  { term: 'sqlmap', zh: '自动化 SQL 注入检测与利用工具。', tag: '工具' },
  { term: 'Nuclei', zh: '基于模板的漏洞扫描器，模板由 YAML 描述。', tag: '工具' },
  { term: 'Caido', zh: '轻量 Web 安全测试代理，Burp 的替代品之一。', tag: '工具' },
  { term: 'OWASP ZAP', zh: '开源 Web 应用扫描与代理工具。', tag: '工具' },
  { term: 'Wireshark', zh: '网络协议抓包与分析工具。', tag: '工具' },
  { term: 'Metasploit', zh: '渗透测试框架，提供漏洞利用与载荷模块。', tag: '工具' },

  // 通用概念
  { term: 'payload', zh: '载荷：注入到请求中的恶意数据或代码片段。', tag: '概念' },
  { term: 'endpoint', zh: '端点：应用暴露的具体 API 或 URL 处理入口。', tag: '概念' },
  { term: 'request', zh: 'HTTP 请求：方法、路径、头与正文组成的客户端消息。', tag: '概念' },
  { term: 'response', zh: 'HTTP 响应：状态码、头与正文组成的服务端消息。', tag: '概念' },
  { term: 'header', zh: 'HTTP 头：携带元数据的键值对，如 Host、Cookie、CORS。', tag: '概念' },
  { term: 'cookie', zh: '浏览器保存并随请求发送的小段状态数据。', tag: '概念' },
  { term: 'parameter', zh: '请求参数：URL 查询串、表单或 JSON 中的输入字段。', tag: '概念' },
  { term: 'proxy', zh: '代理：位于客户端与服务器之间、可拦截和修改流量的中间人。', tag: '概念' },
  { term: 'intercept', zh: '拦截：暂停请求或响应以便检查与修改。', tag: '概念' },
  { term: 'scope', zh: '测试范围：被授权测试的主机、路径与功能边界。', tag: '概念' },
  { term: 'crawl', zh: '爬取：自动遍历站点发现链接、表单与接口。', tag: '概念' },
  { term: 'fuzz', zh: '模糊测试：用变异或字典输入观察异常行为。', tag: '概念' },
  { term: 'wordlist', zh: '字典：爆破与枚举用的候选词列表。', tag: '概念' },
  { term: 'bypass', zh: '绕过：规避校验、过滤、认证或防护机制。', tag: '概念' },
  { term: 'exploit', zh: '利用：把漏洞转化为实际影响的过程或代码。', tag: '概念' },
  { term: 'PoC', zh: '概念验证：证明漏洞存在的最小化复现步骤或脚本。', tag: '概念' },
  { term: 'CVE', zh: '公开漏洞编号体系，如 CVE-2024-12345。', tag: '概念' },
  { term: 'CVSS', zh: '漏洞严重性评分框架，分数范围 0 到 10。', tag: '概念' },
  { term: 'bug bounty', zh: '漏洞赏金：厂商对合规漏洞报告给予奖励的项目。', tag: '概念' },
  { term: 'WAF', zh: 'Web 应用防火墙：按规则拦截恶意请求，常需测试绕过。', tag: '防护' },
  { term: 'CDN', zh: '内容分发网络：缓存与加速内容，也会影响源站识别与缓存测试。', tag: '概念' },
  { term: 'reverse proxy', zh: '反向代理：代表源站接收请求，常见于负载均衡与缓存层。', tag: '概念' },
  { term: 'load balancer', zh: '负载均衡器：把流量分发到多个后端实例。', tag: '概念' },
  { term: 'URL encoding', zh: '百分号编码：把特殊字符转成 %XX 形式。', tag: '概念' },
  { term: 'Base64', zh: '用 64 个字符表示二进制数据的编码方式，不是加密。', tag: '概念' },
  { term: 'HTML entity', zh: 'HTML 实体编码，例如 &lt; 表示小于号。', tag: '概念' },
  { term: 'sanitization', zh: '清洗：移除或转义输入中的危险内容。', tag: '防护' },
  { term: 'allowlist', zh: '白名单：只允许明确列出的值或来源。', tag: '防护' },
  { term: 'denylist', zh: '黑名单：只拦截已知危险值，容易被绕过。', tag: '防护' },
  { term: 'escaping', zh: '转义：把特殊字符转换为不会被执行的形式。', tag: '防护' },
];

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

export function escapeRegex(text) {
  return String(text).replace(ESCAPE_RE, '\\$&');
}

/** 生成支持多词、忽略大小写的术语正则（带零宽边界）。 */
export function termRegex(term, flags = 'gi') {
  const body = String(term)
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join('\\s+');
  // 现代浏览器均支持后行断言；不支持时降级为普通匹配，仍可用。
  try {
    return new RegExp(`(?<![A-Za-z0-9])${body}(?![A-Za-z0-9])`, flags);
  } catch {
    return new RegExp(body, flags);
  }
}

function tidySentence(raw) {
  let s = String(raw)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]+/g, ' ')
    .replace(/^\s*(?:[-+•]|\d+\.)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > 240) s = `${s.slice(0, 237).trim()}…`;
  return s;
}

/** 从正文中找包含该术语的句子，作为例句。 */
export function sentenceFor(text, term) {
  const sentences = String(text).match(/[^.!?。！？\n]+[.!?。！？]?/g) || [];
  const re = termRegex(term, 'i');
  for (const sentence of sentences) {
    if (re.test(sentence)) {
      const tidy = tidySentence(sentence);
      if (tidy.length >= 12) return tidy;
    }
  }
  return '';
}
