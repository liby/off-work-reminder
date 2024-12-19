// 解析从 Shortcuts 传入的参数
const parseInput = (input) => {
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch (error) {
    // 如果解析失败，使用默认值
    return {
      workEndTime: '18:00',
      lunchBreakAdvanceMinute: 0
    };
  }
};

// 格式化时间显示
const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 计算实际下班时间
const calculateActualEndTime = (currentTime, params) => {
  const now = new Date(currentTime);
  const noon = new Date(currentTime).setHours(12, 0, 0, 0);

  // 如果是 12 点后连接 WiFi，直接使用设定的下班时间
  if (now.getTime() > noon) {
    const [hours, minutes] = params.workEndTime.split(':');
    const endTime = new Date(currentTime);
    endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return endTime;
  }

  // 如果是 12 点前，需要补足提前午休的时间
  const [hours, minutes] = params.workEndTime.split(':');
  const endTime = new Date(currentTime);
  endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return new Date(endTime.getTime() + (params.lunchBreakAdvanceMinute * 60 * 1000));
};

// 获取当前日期的字符串表示
let today = new Date().toISOString().split("T")[0];

// 尝试从 Keychain 中获取上次记录的日期，初始化为 null
let lastRunOffWorkDate = null;
try {
  lastRunOffWorkDate = Keychain.get("lastRunOffWorkDate");
} catch (error) {
  // 如果键不存在，将 lastRunOffWorkDate 设为 null
  lastRunOffWorkDate = null;
}

// 检查是否已经记录过今天的日期
if (lastRunOffWorkDate === today) {
  console.log("今天的通知已经设置，不再重复设置。");
} else {
  // 记录今天的日期
  Keychain.set("lastRunOffWorkDate", today);

  const params = parseInput(args.shortcutParameter);
  // 获取当前时间
  const currentTime = new Date();
  // 设定上班时间为 9 点
  const workStartTime = new Date().setHours(9, 0, 0, 0);

  // 如果于 9 点前到达，将到达时间设为 9 点
  const effectiveStartTime = currentTime < workStartTime ? new Date(workStartTime) : currentTime;

  // 计算实际下班时间
  const reminderTime = calculateActualEndTime(effectiveStartTime, params);

  // 计划在下班时发送一条通知
  let scheduledOffWorkNotification = new Notification();
  scheduledOffWorkNotification.title = "下班啦";
  scheduledOffWorkNotification.body = "时间到了，可以下班了！";
  scheduledOffWorkNotification.setTriggerDate(reminderTime);
  await scheduledOffWorkNotification.schedule();

  console.log("通知已设置，将在 " + formatTime(reminderTime) + " 提醒你下班。");

  // 设置完计划通知后，立即发送一次确认通知，告知当日下班时间
  let immediateConfirmNotification = new Notification();
  immediateConfirmNotification.title = "通知已设置";
  immediateConfirmNotification.body = "今天的下班时间是：" + formatTime(reminderTime);
  await immediateConfirmNotification.schedule();
}

Script.complete();