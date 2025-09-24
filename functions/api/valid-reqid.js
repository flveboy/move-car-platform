// 从环境变量获取部署平台标识
const deployPlatform = process?.env?.DEPLOY_PLATFORM || 
                      (typeof addEventListener !== 'undefined' ? 'cloudflare' : null);

// 核心业务逻辑
async function getValidReqId(env) {
  const validReqId = env.VALID_REQ_ID;
  
  if (!validReqId) {
    return {
      status: 500,
      data: { error: "VALID_REQ_ID 环境变量未设置" }
    };
  }
  
  return {
    status: 200,
    data: { validReqId }
  };
}

// 根据部署平台导出相应的处理函数
switch (deployPlatform) {
  // Vercel 适配（Node.js 环境）
  case 'vercel':
    module.exports = async (req, res) => {
      const result = await getValidReqId(process.env);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.status(result.status).json(result.data);
    };
    break;

  // Netlify 适配（Node.js 环境）
  case 'netlify':
    exports.handler = async (event, context) => {
      const result = await getValidReqId(process.env);
      return {
        statusCode: result.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify(result.data)
      };
    };
    break;

  // Cloudflare Workers 适配
  case 'cloudflare':
  default: // 默认假设为Cloudflare环境
    addEventListener('fetch', (event) => {
      event.respondWith(handleCloudflareRequest(event.request));
    });

    async function handleCloudflareRequest(request) {
      // 获取 Cloudflare 环境变量
      const env = request.cf?.env || self;
      const result = await getValidReqId(env);
      
      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
    break;
}
