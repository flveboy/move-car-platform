// 多平台兼容的通知API
// 支持 Vercel、Netlify、Cloudflare

// 平台检测
const isVercel = typeof process !== 'undefined' && process.env.VERCEL;
const isNetlify = typeof NETLIFY !== 'undefined';
const isCloudflare = typeof Request !== 'undefined' && typeof Response !== 'undefined' && !isVercel && !isNetlify;

// 工具函数：统一请求解析
async function parseRequest(request) {
  try {
    let method, body;
    
    if (isVercel) {
      // Vercel 环境
      method = request.method;
      body = request.body;
    } else {
      // Netlify/Cloudflare 环境
      method = request.method || request.httpMethod;
      body = method === 'POST' 
        ? (request.body ? JSON.parse(request.body) : await request.json())
        : {};
    }
    
    return { method, body };
  } catch (e) {
    return { error: '无效的请求体' };
  }
}

// 工具函数：统一响应处理
function createResponse(data, status = 200) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const body = JSON.stringify(data);
  
  // 不同平台的响应格式
  if (isVercel) {
    return {
      statusCode: status,
      headers: corsHeaders,
      body
    };
  } else if (isNetlify) {
    return {
      statusCode: status,
      headers: corsHeaders,
      body
    };
  } else {
    return new Response(body, {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 签名生成（兼容Node.js环境）
async function generateDingtalkSignature(timestamp, secret) {
  if (isCloudflare) {
    // Cloudflare Workers环境
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${timestamp}\n${secret}`)
    );
    const signatureArray = new Uint8Array(signature);
    let base64Signature = '';
    for (let i = 0; i < signatureArray.length; i++) {
      base64Signature += String.fromCharCode(signatureArray[i]);
    }
    return btoa(base64Signature);
  } else {
    // Node.js环境 (Vercel/Netlify)
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${timestamp}\n${secret}`);
    return hmac.digest('base64');
  }
}

// 核心业务逻辑
async function handleNotification(body, env) {
  const { message, requestTime = Date.now(), type = 'dingtalk' } = body;

  // 验证消息
  if (!message || typeof message !== 'string') {
    return createResponse({ error: '消息内容不能为空' }, 400);
  }

  // 格式化时间
  const formattedTime = new Date(requestTime).toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai' 
  });

  // 构建消息内容
  const content = `🚗 挪车通知\n\n通知内容：${message}\n\n通知时间：${formattedTime}\n\n请及时处理挪车请求！`;

  try {
    if (type === 'dingtalk') {
      // 钉钉通知处理
      const webhook = env.DINGTALK_WEBHOOK;
      const secret = env.DINGTALK_SECRET;
      
      if (!webhook) {
        return createResponse({ error: '钉钉Webhook未配置' }, 500);
      }

      // 生成签名
      let signedUrl = webhook;
      if (secret) {
        const timestamp = Date.now();
        const signature = await generateDingtalkSignature(timestamp, secret);
        signedUrl = `${webhook}&timestamp=${timestamp}&sign=${encodeURIComponent(signature)}`;
      }

      // 发送请求
      const fetchModule = isCloudflare ? fetch : (await import('node-fetch')).default;
      const response = await fetchModule(
        signedUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: "text",
            text: { content },
            at: { isAtAll: false }
          })
        }
      );

      const data = await response.json();
      if (data.errcode === 0) {
        return createResponse({ success: true, message: '钉钉通知发送成功' });
      } else {
        return createResponse({ 
          error: '发送通知失败', 
          detail: data.errmsg 
        }, 500);
      }

    } else if (type === 'wecom') {
      // 企业微信通知处理
      const webhook = env.WECOM_WEBHOOK;
      
      if (!webhook) {
        return createResponse({ error: '企业微信Webhook未配置' }, 500);
      }

      // 发送请求
      const fetchModule = isCloudflare ? fetch : (await import('node-fetch')).default;
      const response = await fetchModule(
        webhook,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: "text",
            text: { content }
          })
        }
      );

      const data = await response.json();
      if (data.errcode === 0) {
        return createResponse({ success: true, message: '企业微信通知发送成功' });
      } else {
        return createResponse({ 
          error: '发送通知失败', 
          detail: data.errmsg 
        }, 500);
      }
    } else {
      return createResponse({ error: '未知通知类型' }, 400);
    }
  } catch (error) {
    return createResponse({
      error: '服务器内部错误',
      detail: error.message
    }, 500);
  }
}

// Vercel 处理器
async function vercelHandler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    const { method, body, error } = await parseRequest(req);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const result = await handleNotification(body, process.env);
    
    // Set CORS headers
    Object.keys(result.headers).forEach(key => {
      res.setHeader(key, result.headers[key]);
    });
    
    return res.status(result.statusCode).send(JSON.parse(result.body));
  } catch (error) {
    console.error('Error in notification:', error);
    return res.status(500).json({
      error: '服务器内部错误',
      detail: error.message
    });
  }
}

// Netlify 处理器
async function netlifyHandler(event) {
  const { method, body, error } = await parseRequest(event);
  
  if (error) {
    return createResponse({ error }, 400);
  }
  
  if (method === 'OPTIONS') {
    return createResponse(null, 200);
  }
  
  return handleNotification(body, process.env);
}

// Cloudflare 处理器
async function cloudflareHandler(context) {
  const { method, body, error } = await parseRequest(context.request);
  
  if (error) {
    return createResponse({ error }, 400);
  }
  
  if (method === 'OPTIONS') {
    return createResponse(null, 200);
  }
  
  return handleNotification(body, context.env);
}

// 根据平台导出不同的处理器
if (isVercel) {
  // Vercel 导出
  export default vercelHandler;
} else if (isNetlify) {
  // Netlify 导出
  exports.handler = netlifyHandler;
} else {
  // Cloudflare 导出
  export async function onRequest(context) {
    return cloudflareHandler(context);
  }
}
