import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { notificationsApi } from "./api";

// ---------------------------------------------------------------------------
// Configure notification handler (how notifications appear while app is open)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Request permission + get Expo push token
// ---------------------------------------------------------------------------

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulators/emulators can't receive push notifications
    return null;
  }

  // Check / request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "HabitAI Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FBBF24",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Register token with our backend
  const platform: "ios" | "android" | "web" =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  try {
    await notificationsApi.register(token, platform);
  } catch {
    // Non-fatal — registration failure shouldn't block app flow
  }

  return token;
}

// ---------------------------------------------------------------------------
// Schedule a local reminder for a specific habit
// ---------------------------------------------------------------------------

export async function scheduleLocalReminder(
  habitId: string,
  habitName: string,
  timeString: string // "HH:MM" format
): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return null;

  const [hourStr, minuteStr] = timeString.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return null;

  // Cancel any existing notification for this habit
  await cancelHabitReminder(habitId);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for your habit! 🔥",
      body: `Don't forget: ${habitName}`,
      data: { habitId },
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });

  return identifier;
}

// ---------------------------------------------------------------------------
// Cancel a local reminder for a specific habit
// ---------------------------------------------------------------------------

export async function cancelHabitReminder(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.habitId === habitId
  );
  for (const n of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

// ---------------------------------------------------------------------------
// Cancel all local reminders (e.g. when notifications disabled)
// ---------------------------------------------------------------------------

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
