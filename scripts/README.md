# 伴学课堂 VIP 解锁脚本

针对伴学课堂（banxueketang.com）App 的会员/VIP 功能解锁脚本，基于对 Android v1.6.6（内部版本 1.6.82）APK 反编译分析编写。

## 脚本列表

| 文件 | 适用工具 | 说明 |
|---|---|---|
| `banxueketang.vip.js` | QuantumultX / Surge / Loon / Shadowrocket | 标准版（`$response`/`$done` API） |
| `banxueketang.egern.js` | Egern | 标准版（`ctx` API，无通知） |
| `banxueketang.egern.debug.js` | Egern | 调试版：脚本触发时弹通知（显示请求 URL） |
| `banxueketang.egern.sku-debug.js` | Egern | SKU 调试版：输出投屏等权益接口的响应结构快照 |

## 解锁能力

- ✅ 课程/视频/音频列表解锁（`isLock` / `isHave` / `trialTopNum`）
- ✅ VIP/SVIP 状态（`isVip` / `memberCardCode` / `vipStatus` / `isUpSVip`）
- ✅ 有效期拉满（`vipTime` / `svipTime` / `expireTime`）
- ✅ SKU 权益功能（投屏等，`isRights` / `isRightsAvailable`）
- ⚠️ 投屏等"用户权益"功能**需要登录态**：未登录时 App 不请求权益接口，脚本无法改写

## 配置方法

### Egern

```yaml
scriptings:
  - http_response:
      name: "伴学课堂 VIP 解锁"
      match: "^https://api\\.banxueketang\\.com/api/classpal/app/v1"
      script_url: "https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/banxueketang.egern.js"
      body_required: true
      timeout: 10

mitm:
  ca_p12: ""            # 按实际填写
  ca_passphrase: ""     # 按实际填写
  hostnames:
    includes:
      - "api.banxueketang.com"
```

注意：`body_required` 必须为 `true`；需安装并信任 CA 证书。

### Quantumult X

```
[rewrite_local]
^https?:\/\/api\.banxueketang\.com\/api\/classpal\/app\/v1 url script-response-body https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/banxueketang.vip.js

[mitm]
hostname = api.banxueketang.com
```

## 使用流程

1. 开启代理工具（VPN 状态）
2. 安装并信任 CA 证书（设置 → 通用 → 关于本机 → 证书信任设置）
3. 确认 MITM hostname 包含 `api.banxueketang.com`
4. 打开伴学课堂 → 退出登录 → 重新登录（清除旧缓存）
5. 无效时点一次「恢复购买」

## 更新记录

- **v1**：基于 @liul0ng 原版 bxkt.js 增强（深度递归解锁 + 类型兼容）
- **v2**：适配 v1.6+ 新版 VIP 判定字段（`memberCardCode` / `vipStatus` / `isUpSVip` / `notAnyVip` 等）
- **v3**：SKU 权益解锁（`isRights` / `isRightsAvailable`）—— 投屏等 VIP 专属功能
- **v3.1**：投屏 SKU 接口（`functions/product/getFunctionsSkuIsRights`）强制注入解锁

## 免责声明

仅供学习交流，请于下载后 24 小时内删除，禁止商用传播。
