// 延迟时间（单位：分钟）
// 该变量接收从 Shortcuts 传入的参数，用于设定从当前时间开始延迟发送通知的分钟数。
// 例如，如果期望延迟 9 小时 15 分钟，则应在 Shortcuts 中传递 555（9 * 60 + 15）。
// 如果未提供该参数，脚本将默认使用 540 分钟的延迟时间。
let delayMinutes = args.shortcutParameter || 540;

// 获取当前日期的字符串表示，例如 "2024-11-07"
let today = new Date().toISOString().split("T")[0];

// 尝试从 Keychain 中获取上次记录的日期
let lastRunOffWorkDate = null;  // 初始化为 null
try {
  lastRunOffWorkDate = Keychain.get("lastRunOffWorkDate");
} catch (error) {
  lastRunOffWorkDate = null;  // 如果键不存在，将 lastRunOffWorkDate 设为 null
}

// 检查是否已经记录过今天的日期
if (lastRunOffWorkDate === today) {
  console.log("今天的通知已经设置，不再重复设置。");
} else {
  // 记录今天的日期
  Keychain.set("lastRunOffWorkDate", today);

  // 获取当前时间
  let currentTime = new Date();

  // 计算延迟后的通知时间
  let reminderTime = new Date(currentTime.getTime() + delayMinutes * 60 * 1000);

  // 计划在下班时发送一条通知
  let scheduledOffWorkNotification = new Notification();
  scheduledOffWorkNotification.title = "下班啦";
  scheduledOffWorkNotification.body = "时间到了，可以下班了！";
  scheduledOffWorkNotification.setTriggerDate(reminderTime);
  await scheduledOffWorkNotification.schedule();

  console.log("通知已设置，将在 " + reminderTime.toLocaleString() + " 提醒你下班。");

  // 设置完计划通知后，立即发送一次确认通知，告知当日下班时间
  let immediateConfirmNotification = new Notification();
  immediateConfirmNotification.title = "下班时间已设置";
  immediateConfirmNotification.body = "今天的下班时间是：" + reminderTime.toLocaleString();
  await immediateConfirmNotification.schedule();
}

Script.complete();