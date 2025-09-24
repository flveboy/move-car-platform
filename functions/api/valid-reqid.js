export async function onRequest(context) {
  try {
    // 从环境变量获取reqId
    const validReqId = context.env.VALID_REQ_ID;
    
    if (!validReqId) {
      return new Response(JSON.stringify({ 
        error: "VALID_REQ_ID环境变量未设置" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // 返回有效的reqId
    return new Response(JSON.stringify({ 
      validReqId 
    }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // 防止缓存
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
