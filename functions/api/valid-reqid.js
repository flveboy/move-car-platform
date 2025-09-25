// 多平台兼容的验证ID API
// 支持 Vercel、Netlify、Cloudflare

// 平台检测函数
function detectPlatform() {
  // 1. 优先使用环境变量
  if (process.env.DEPLOY_PLATFORM) {
    return process.env.DEPLOY_PLATFORM.toLowerCase();
  }
  
  // 2. 检测 Netlify 环境
  if (process.env.NETLIFY === 'true' || process.env.NETLIFY_SITE_ID) {
    return 'netlify';
  }
  
  // 3. 检测 Cloudflare Workers 环境
  if (typeof addEventListener !== 'undefined' && typeof caches !== 'undefined') {
    return 'cloudflare';
  }
  
  // 4. 检测 Vercel 环境
  if (process.env.VERCEL === '1' || process.env.NOW_REGION) {
    return 'vercel';
  }
  
  // 5. 默认返回 vercel
  return 'vercel';
}

const platform = detectPlatform();
console.log(`Detected platform: ${platform}`);

// Vercel 处理器 (CommonJS 格式)
function vercelHandler(req, res) {
  try {
    const validReqId = process.env.VALID_REQ_ID;
    
    if (!validReqId) {
      return res.status(500).json({
        error: "VALID_REQ_ID环境变量未设置",
        platform: platform
      });
    }
    
    return res.status(200).json({
      validReqId: validReqId,
      platform: platform
    });
  } catch (error) {
    console.error(`[${platform}] Error:`, error);
    return res.status(500).json({
      error: "服务器内部错误",
      platform: platform
    });
  }
}

// Netlify 处理器 (CommonJS 格式)
function netlifyHandler(event, context) {
  const validReqId = process.env.VALID_REQ_ID;
  
  if (!validReqId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "VALID_REQ_ID环境变量未设置",
        platform: platform
      })
    };
  }
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      validReqId: validReqId,
      platform: platform
    })
  };
}

// Cloudflare 处理器
function cloudflareHandler(request, env) {
  const validReqId = env.VALID_REQ_ID || process.env.VALID_REQ_ID;
  
  if (!validReqId) {
    return new Response(JSON.stringify({
      error: "VALID_REQ_ID环境变量未设置",
      platform: platform
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    validReqId: validReqId,
    platform: platform
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

// 根据平台导出对应的处理器
switch (platform) {
  case 'netlify':
    // Netlify 导出格式
    exports.handler = async (event, context) => {
      return netlifyHandler(event, context);
    };
    break;
    
  case 'cloudflare':
    // Cloudflare 导出格式
    if (typeof addEventListener !== 'undefined') {
      addEventListener('fetch', event => {
        event.respondWith(cloudflareHandler(event.request, {}));
      });
    } else {
      // 模块导出供构建工具使用
      module.exports = {
        onRequest: cloudflareHandler
      };
    }
    break;
    
  case 'vercel':
  default:
    // Vercel 导出格式 (CommonJS)
    module.exports = vercelHandler;
    break;
}

// 如果是主模块运行，显示平台信息
if (require.main === module) {
  console.log(`valid-reqid.js loaded for platform: ${platform}`);
  console.log('Environment variables check:');
  console.log('- DEPLOY_PLATFORM:', process.env.DEPLOY_PLATFORM);
  console.log('- VALID_REQ_ID:', process.env.VALID_REQ_ID ? '已设置' : '未设置');
  console.log('- NETLIFY:', process.env.NETLIFY);
  console.log('- VERCEL:', process.env.VERCEL);
}
