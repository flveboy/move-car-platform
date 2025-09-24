# main分支部署在netlify

## 现在配置的是钉钉的webhook，需要配置
  - DINGTALK_SECRET
  - DINGTALK_WEBHOOK
    这两个可以在钉钉群机器人里面获取。


# feature分支部署在 cloudflare（要添加 functions 文件夹，把 js 放在 functions 文件夹。）
## 现在配置的是钉钉的webhook，需要配置
  - DINGTALK_SECRET
  - DINGTALK_WEBHOOK
  - 默认关键词是“挪车”
    这两个可以在钉钉群机器人里面获取。
只有发送 钉钉通知 和 打电话
<img width="1006" height="1308" alt="image" src="https://github.com/user-attachments/assets/0919d1ac-32be-4c0a-afe2-130fb33d5624" />


# feature_wecom加入了企微的版本
  - DINGTALK_SECRET
  - DINGTALK_WEBHOOK
  - 默认关键词是“挪车”
    这两个可以在钉钉群机器人里面获取。

  - WECOM_WEBHOOK 企微里面获取。
  - public 下面有三个页面
    - carnotify: <img width="1088" height="982" alt="image" src="https://github.com/user-attachments/assets/c73af62f-d69e-48b0-9b67-9d72c7eafd37" />
    - index: <img width="1098" height="1288" alt="image" src="https://github.com/user-attachments/assets/7616ce8a-67dc-492c-a96b-2334bc6f4a07" />
    - notify: 加入了简单的安全验证，避免网友随便输入网址，访问到该网址，然后触发挪车通知，这个页面里面还是保留了挪车电话，要是不想要挪车电话，可以删掉。需要在 cloudflare 配置VALID_REQ_ID。
      <img width="1054" height="1402" alt="image" src="https://github.com/user-attachments/assets/b677ccba-8271-493c-98c1-16de30f73fa6" />


