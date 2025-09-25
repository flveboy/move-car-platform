// 多平台兼容通知API
// 支持 Vercel、Netlify、Cloudflare
// 钉钉 + 企业微信

const platform = (() => {
  const p = process.env.DEPLOY_PLATFORM;
  if (p) return p.toLowerCase();
  if (process.env.NETLIFY === 'true') return 'netlify';
  if (typeof addEventListener !== 'undefined') return 'cloudflare';
  if (process.env.VERCEL === '1') return 'vercel';
  return 'vercel';
})();

// 工具函数：统一响应
function createResponse(data, status = 200) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const body = JSON.stringify(data);
  if (platform === 'cloudflare') {
    return new Response(body, { status, headers });
  }
  return { statusCode: status, headers, body };
}

// 工具函数：解析请求
async function parseRequest(req) {
  try {
    if (platform === 'vercel') {
      return { method: req.method, body: req.body };
    }
    const body = req.body ? JSON.parse(req.body) : await req.json();
    return { method: req.method || req.httpMethod, body };
  } catch {
    return { error: '无效的请求体' };
  }
}

// 工具函数：钉钉签名
async function generateDingtalkSignature(timestamp, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}\n${secret}`);
  return hmac.digest('base64');
}

// 核心业务
async function handleNotification(body, env) {
  const { message, type = 'dingtalk' } = body;
  if (!message) return createResponse({ error: '消息内容不能为空' }, 400);

  const content = `🚗 挪车通知\n\n通知内容：${message}\n\n通知时间：${new Date().toLocaleString('zh-CN')}\n\n请及时处理挪车请求！`;

  try {
    const fetch = (await import('node-fetch')).default;

    if (type === 'dingtalk') {
      const webhook = env.DINGTALK_WEBHOOK;
      const secret = env.DINGTALK_SECRET;
      if (!webhook) return createResponse({ error: '钉钉Webhook未配置' }, 500);

      let url = webhook;
      if (secret) {
        const ts = Date.now();
        const sign = await generateDingtalkSignature(ts, secret);
        url += `&timestamp=${ts}&sign=${encodeURIComponent(sign)}`;
      }

      const rsp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content } }),
      });
      const data = await rsp.json();
      if (data.errcode === 0) return createResponse({ success: true, message: '钉钉通知发送成功' });
      return createResponse({ error: '钉钉发送失败', detail: data.errmsg }, 500);
    }

    // ✅ 企业微信通知
    if (type === 'wecom') {
      const webhook = env.WECOM_WEBHOOK;
      if (!webhook) return createResponse({ error: '企业微信Webhook未配置' }, 500);

      const rsp = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content } }),
      });
      const data = await rsp.json();
      if (data.errcode === 0) return createResponse({ success: true, message: '企业微信通知发送成功' });
      return createResponse({ error: '企业微信发送失败', detail: data.errmsg }, 500);
    }

    return createResponse({ error: '未知通知类型' }, 400);
  } catch (e) {
    console.error('通知异常:', e);
    return createResponse({ error: '服务器内部错误', detail: e.message }, 500);
  }
}

// 平台处理器
async function vercelHandler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  const { method, body, error } = await parseRequest(req);
  if (error) return res.status(400).json({ error });
  if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const result = await handleNotification(body, process.env);
  Object.keys(result.headers).forEach(k => res.setHeader(k, result.headers[k]));
  return res.status(result.statusCode).json(JSON.parse(result.body));
}

async function netlifyHandler(event) {
  const { method, body, error } = await parseRequest(event);
  if (error) return createResponse({ error }, 400);
  if (method === 'OPTIONS') return createResponse(null, 200);
  return handleNotification(body, process.env);
}

async function cloudflareHandler(context) {
  const { method, body, error } = await parseRequest(context.request);
  if (error) return createResponse({ error }, 400);
  if (method === 'OPTIONS') return createResponse(null, 200);
  return handleNotification(body, context.env);
}

// CommonJS 导出
if (platform === 'netlify') {
  exports.handler = netlifyHandler;
} else if (platform === 'cloudflare') {
  addEventListener('fetch', event => {
    event.respondWith(cloudflareHandler({ request: event.request, env: {} }));
  });
} else {
  module.exports = vercelHandler;
}
