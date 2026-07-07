# Egern 代理配置（精简版）

基于 [ClashConnectRules/Egern](https://github.com/ClashConnectRules/Egern) 精简优化，适合手机日常使用。

## 配置地址

```
https://raw.githubusercontent.com/funit1858/egern-config/main/egern.yaml
```

## 策略组

| 类型 | 分组 |
|------|------|
| 地区 | 香港、台湾、日本、新加坡、美国 |
| 服务 | Apple、AI (ChatGPT等)、Microsoft、Telegram、WeChat、X、Bilibili、YouTube、Speedtest |
| 功能 | 自动 (Automatic)、代理 (Proxy)、直连 (Mainland)、NoAuto |

## 已剔除

Netflix / Disney+ / TikTok / UK / Korea / 其他地区 / OneDrive

## 使用方式

1. 打开 Egern App，进入配置页面
2. 添加配置，URL 填入上面的配置地址
3. 在 `AllServer` 策略组中填入你的个人订阅链接
4. 开启 VPN 即可使用

## 说明

- 需要科学上网环境，规则集从 GitHub raw 拉取
- 订阅链接不在配置文件中保存，请自行在 Egern 中添加
- AllServer 自动过滤关键词：官网、套餐、去除、剩余、距离、重置、流量
- 支持 IPv6
- MITM 功能默认开启（用于去广告等），需安装证书
