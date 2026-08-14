# 伴学课堂 VIP 解锁脚本

针对伴学课堂（banxueketang.com）App 的会员/VIP 功能解锁脚本。基于对 Android v1.6.6（内部 1.6.82）APK 反编译 + iOS 版真实接口抓包分析编写。

## 脚本列表（正式版）

| 文件 | 适用工具 | 说明 |
|---|---|---|
| `banxueketang.egern.js` | Egern | iOS 主用版本（ctx API） |
| `banxueketang.vip.js` | QuantumultX / Surge / Loon / Shadowrocket | 标准版本（$response/$done API） |

> 调试脚本已清理，正式版即最新逻辑。

## 解锁能力（完整清单）

- ✅ 课程/视频/音频/书籍列表解锁（`isLock` / `isHave` / `trialTopNum`）
- ✅ VIP/SVIP 身份（`isVip` / `memberCardCode` / `vipStatus` / `isUpSVip` / `notAnyVip`）
- ✅ 会员有效期拉满（`vipTime` / `svipTime` / `expireTime`）
- ✅ 全部 SKU 权益功能：投屏 / 同步课程 / 音频字幕 / 音频设置 / 在线听写 / 手写听写 / 点读跟读 / 古诗背诵 / 练习打印 / 导出错题本 / 会员卡
- ✅ 资源包数量（`resourceCount`）
- ⚠️ 周卡/月卡领取等**服务端硬校验**无法通过改写实现

## 关键修复记录（投屏问题的完整链路）

1. **安卓/iOS 接口名差异**：安卓 `getFunctionsSkuIsRights`，iOS 多 `User` → `getFunctionsSkuUserIsRights`。匹配逻辑用 `getFunctionsSku` 前缀兼容两者。
2. **iOS 响应结构差异**：iOS 版 SKU 接口不返回 `appUserVipRightsApiDTO`（用户权益字段缺失）→ 脚本强制注入。
3. **真正的数据源**：iOS 版播放页权益数据来自 **`selectSyncCourseInfo`**（同步课程信息）接口，同时返回：
   - `data.isVip`（会员状态）
   - `appUserVipRightsApiDTO.isRights`（用户权益）← 投屏判定关键
   - `skuVipRightsApiDTO.isRights`（功能要求）
4. **最终修复**：`unlock()` 对**任何接口**识别特殊键并强制改写：
   - `appUserVipRightsApiDTO` → `isRights:true`、`vipStatus:2`、`memberCardCode:"svip"`（用户持有权益）
   - `skuVipRightsApiDTO` → `isRights:false`（功能非付费）
   - 顶层 `isVip` → `true`

## 配置方法

### Egern（推荐 iOS）

```yaml
scriptings:
  - http_response:
      name: "伴学课堂 VIP 解锁"
      match: "^https://api\\.banxueketang\\.com/api/classpal/app/v1"
      script_url: "https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/banxueketang.egern.js"
      body_required: true
      timeout: 10

mitm:
  hostnames:
    includes:
      - "api.banxueketang.com"
```

注意：`body_required` 必须为 `true`；需安装并信任 CA 证书（设置 → 通用 → 关于本机 → 证书信任设置）。

### Quantumult X

```
[rewrite_local]
^https?:\/\/api\.banxueketang\.com\/api\/classpal\/app\/v1 url script-response-body https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/banxueketang.vip.js

[mitm]
hostname = api.banxueketang.com
```

完整基础配置见根目录 `QuantumultX_simple.conf`（含节点/分流/去广告/伴学课堂，可直接导入）。

## 使用流程

1. 开启代理工具（VPN 状态）
2. 安装并信任 CA 证书
3. 确认 MITM hostname 包含 `api.banxueketang.com`
4. 打开伴学课堂 → 退出登录 → 重新登录（清除旧缓存）
5. 无效时点一次「恢复购买」

## 免责声明

仅供学习交流，请于下载后 24 小时内删除，禁止商用传播。
