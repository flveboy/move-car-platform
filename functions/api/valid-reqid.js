// 多平台兼容的验证ID API
// 支持 Vercel、Netlify、Cloudflare

// 通过环境变量 DEPLOY_PLATFORM 检测平台
const platform = process.env.DEPLOY_PLATFORM || 
  (typeof NETLIFY !== 'undefined' ? 'netlify' : 
   typeof Request !== 'undefined' && typeof Response !== 'undefined' ? 'cloudflare' : 'unknown');

// Vercel 处理器
async function vercelHandler(req, res) {
  try {
    const validReqId = process.env.VALID_REQ_ID;
    
    if (!validReqId) {
      return res.status(500).json({ 
        error: "VALID_REQ_ID环境变量未设置" 
      });
    }
    
    return res.status(200).json({ validReqId });
  } catch (error) {
    console.error('Error in valid-reqid:', error);
    return res.status(500).json({ 
      error: "服务器内部错误" 
    });
  }
}

// Netlify/Cloudflare 处理器
async function universalHandler(env, request) {
  try {
    const validReqId = env.VALID_REQ_ID;
    
    if (!validReqId) {
      return new Response(JSON.stringify({ 
        error: "VALID_REQ_ID环境变量未设置" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return new Response(JSON.stringify({ validReqId }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "服务器内部错误" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

// 根据平台导出不同的处理器
if (platform === 'vercel') {
  // Vercel 导出
  export default vercelHandler;
} else if (platform === 'netlify') {
  // Netlify 导出
  exports.handler = async (event) => {
    return universalHandler(process.env, event);
  };
} else if (platform === 'cloudflare') {
  // Cloudflare 导出
  export async function onRequest(context) {
    return universalHandler(context.env, context.request);
  };
} else {
  // 未知平台，默认使用 Vercel 格式
  export default vercelHandler;
}
