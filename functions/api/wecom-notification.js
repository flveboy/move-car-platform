// 企业微信通知函数
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 添加 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    
    // 解析请求体
    let message,requestTime;
    try {
      const body = await request.json();
      message = body.message;
      requestTime = body.requestTime || Date.now();
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: '无效的请求体',
        detail: '请提供有效的JSON数据'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 检查消息内容
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ 
        error: '消息内容不能为空',
        detail: '请提供有效的消息内容'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 从环境变量获取配置
    const WECOM_WEBHOOK = env.WECOM_WEBHOOK;
    
    if (!WECOM_WEBHOOK) {
      return new Response(JSON.stringify({ 
        error: '企业微信Webhook未配置',
        detail: '请在环境变量中设置WECOM_WEBHOOK'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
     // 格式化时间
    const formattedTime = new Date(requestTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    // 构建企业微信消息
    const wecomMessage = {
      msgtype: "text",
      text: {
        content: `🚗 挪车通知\n\n通知内容：${message}\n\n通知时间：${formattedTime}\n\n请及时处理挪车请求！`
      }
    };
    
    // 发送消息到企业微信
    const response = await fetch(WECOM_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wecomMessage)
    });
    
    const data = await response.json();
    
    // 企业微信成功响应是 { "errcode": 0, "errmsg": "ok" }
    if (data.errcode === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: '企业微信通知发送成功' 
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } else {
      console.error('企业微信API错误:', data);
      return new Response(JSON.stringify({ 
        error: '发送通知失败', 
        detail: data.errmsg || '未知错误'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } catch (error) {
    console.error('服务器错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误', 
      detail: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
