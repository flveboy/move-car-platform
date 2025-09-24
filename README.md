# 适配netlify、vercel、cloudflare：
  - DINGTALK_SECRET
  - DINGTALK_WEBHOOK
  - 默认关键词是“挪车”
    这两个可以在钉钉群机器人里面获取。
  - VALID_REQ_ID
  - DEPLOY_PLATFORM （vercel、netlify、cloudflare）
  - WECOM_WEBHOOK 企微里面获取。
  - public
    -加入了简单的安全验证，避免网友随便输入网址，访问到该网址，然后触发挪车通知，这个页面里面还是保留了挪车电话，要是不想要挪车电话，可以删掉。需要在 cloudflare 配置VALID_REQ_ID。
      <img width="1054" height="1402" alt="image" src="https://github.com/user-attachments/assets/b677ccba-8271-493c-98c1-16de30f73fa6" />


