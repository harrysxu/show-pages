# 新工程验收证据

所有证据产生于 2026-10-01 的迁移验证。最终状态见 [验收报告](../07-新工程最终验收报告.md)。

| 位置 | 内容 |
|---|---|
| `simulator/` | 最终 iPhone 14 模拟器流程截图与附件 manifest |
| `device/` | iPhone 14 真机完整 UI suite 截图、附件 manifest 与命名映射 |
| `device-conflict/` | 真机重名冲突、取消、重试、应用到全部及保留两者输出截图 |
| `ipad/` | iPad 两步创建、英文深色、输出位置截图 |
| `prototype/` | Safari 中原始 HTML 原型截图与手机区域裁剪 |
| `system/` | 系统文件选择、分享、默认解压设置的专项截图 |
| `media/` | 合成照片/视频选择、导入、打包与大字体截图 |
| `providers/` | 系统 Files 中真实导入测试 ZIP 的专项截图 |
| `results/` | 持久保存的 XCTest 结果包；包括真实失败/阻塞事实 |
| `*-summary.json`、`*-tests.json` | xcresulttool 导出的实际测试统计与列表 |
| `source-sha256.json` | 本次交付 Swift、工程、资源与依赖锁文件的哈希 |
| `release-final-build.log`、`release-final-install.log`、`release-final-launch.log` | 最新 Release 构建、安装与启动结果 |
| `device-final-engine.log`、`device-final-ui.log`、`device-conflict.log` | 最新真机引擎、完整界面 suite 与补充冲突回归日志 |
| `device-ui-blocked.log`、`device-unlocked-auth-blocked.log` | Device Hub 建立屏幕连接前的历史初始化失败，后续已实际运行通过 |
| `visual-test-summary.json`、`selection-test-summary.json` | 全量通过后的局部调整复测：3 项视觉 UI、23 项引擎与密码/选中目录用例 |

最新真机结果：`results/iPhone14-engine-final.xcresult` 为 21/21 通过，`iPhone14-ui-final.xcresult` 为 12 项通过、1 项媒体用例跳过、0 失败，`iPhone14-conflict-final.xcresult` 为补充冲突 UI 1/1 通过。补充冲突在模拟器的结果为 `conflict-simulator-final.xcresult`，1/1 通过。后续修改仅修正英文四项冲突文案及测试选择器；运行上述补充测试并重新构建 Release 后更新源码哈希。

`iPhone14-engine-passed.xcresult` 的 20 项通过和 `iPhone14-ui-blocked.xcresult` 的 runner 失败是历史记录。用户解锁后仍曾认证超时；退出 iPhone 镜像并通过 Apple Device Hub 建立屏幕会话后，完整 UI suite 正常运行。补充用例过程中还遇到一次 runner 安装/启动信任状态异常，重新安装同一有效签名 runner 后正常启动，未更改证书或安全设置。

媒体是专用模拟器内生成的测试 PNG/MP4；分享未发送给第三方。界面中出现的文件大小和目录来自测试样本，不是设计稿的虚构内容。

查看结果包可以用 Xcode 打开，或执行：

```sh
xcrun xcresulttool get test-results summary --path docs/migration-evidence/results/simulator-final.xcresult --format json
```
