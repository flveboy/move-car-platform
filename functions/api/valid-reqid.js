// 适配 Cloudflare (onRequest)、Netlify (handler)、Vercel (handler)
export async function onRequest(context) {
  return handleRequest(context.env, context.request);
}

export default async function handler(event, context) {
  // Netlify/Vercel 环境下，环境变量在 process.env 中
  return handleRequest(process.env, event);
}

// 核心逻辑封装
async function handleRequest(env, request) {
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
