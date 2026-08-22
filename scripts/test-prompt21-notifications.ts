import { prisma } from "../lib/db";
import { NotificationService } from "../lib/services/notification.service";
import { SmartReminderService } from "../lib/services/smart-reminder.service";
import { CommunityService } from "../lib/services/community.service";
import { FeatureRequestService } from "../lib/services/feature-request.service";
import { AdminService } from "../lib/services/admin/admin.service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("PROMPT 21: SMART NOTIFICATIONS & REMINDERS TEST SUITE");
  console.log("========================================================\n");

  const pool = prisma as any;

  // Setup test users
  const testUserAId = `test_user_a_${Date.now()}`;
  const testUserBId = `test_user_b_${Date.now()}`;
  const testAdminId = `test_admin_${Date.now()}`;

  await pool.user.create({
    data: {
      id: testUserAId,
      name: "Alice Tester",
      username: `alice_${Date.now()}`,
      email: `alice_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  await pool.user.create({
    data: {
      id: testUserBId,
      name: "Bob Tester",
      username: `bob_${Date.now()}`,
      email: `bob_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  await pool.user.create({
    data: {
      id: testAdminId,
      name: "Admin Tester",
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "ADMIN",
      accountStatus: "APPROVED",
    },
  });

  // TEST 1: User Notification Preferences Lifecycle
  console.log("\n--- TEST 1: User Notification Preferences Lifecycle ---");
  const defaultPrefs = await NotificationService.getPreferences(testUserAId);
  assert(defaultPrefs.hydrationReminders === true, "Default hydration reminders is TRUE");
  assert(defaultPrefs.quietHoursEnabled === false, "Default quiet hours enabled is FALSE");
  assert(defaultPrefs.reminderFrequency === "MODERATE", "Default reminder frequency is MODERATE");

  const updatedPrefs = await NotificationService.updatePreferences(testUserAId, {
    quietHoursEnabled: true,
    quietHoursStart: "23:00",
    quietHoursEnd: "07:00",
    reminderFrequency: "HIGH",
  });
  assert(updatedPrefs.quietHoursEnabled === true, "Updated quiet hours enabled to TRUE");
  assert(updatedPrefs.quietHoursStart === "23:00", "Updated quiet hours start time to 23:00");
  assert(updatedPrefs.quietHoursEnd === "07:00", "Updated quiet hours end time to 07:00");
  assert(updatedPrefs.reminderFrequency === "HIGH", "Updated reminder frequency to HIGH");

  // TEST 2: Notification Creation & Sanitization
  console.log("\n--- TEST 2: Notification Creation & Sanitization ---");
  const notif1 = await NotificationService.createNotification({
    userId: testUserAId,
    category: "HYDRATION",
    type: "HYDRATION_REMINDER",
    title: "Afternoon Water Check-in",
    message: "You're at 40% of your hydration target.",
    actionUrl: "/hydration",
  });
  assert(notif1 !== null && notif1.isRead === false, "Created hydration reminder with isRead = false");
  assert(notif1?.actionUrl === "/hydration", "Internal actionUrl preserved safely");

  // Open-redirect safety check
  const notifUnsafe = await NotificationService.createNotification({
    userId: testUserAId,
    category: "SYSTEM",
    type: "SYSTEM",
    title: "External Link Test",
    message: "Test external redirect rejection",
    actionUrl: "https://malicious.com/phish",
  });
  assert(notifUnsafe?.actionUrl === null, "External unsafe actionUrl was sanitized to null");

  // TEST 3: Unread Count & Pagination
  console.log("\n--- TEST 3: Unread Count & Pagination ---");
  await NotificationService.createNotification({
    userId: testUserAId,
    category: "WORKOUTS",
    type: "WORKOUT_REMINDER",
    title: "Leg Day Check-in",
    message: "Ready for your squats?",
    actionUrl: "/workouts",
  });
  await NotificationService.createNotification({
    userId: testUserAId,
    category: "INSIGHTS",
    type: "INSIGHT_ALERT",
    title: "New Health Score",
    message: "Your score increased by 4 points!",
    actionUrl: "/insights",
  });

  const unreadCount = await NotificationService.getUnreadCount(testUserAId);
  assert(unreadCount >= 3, `Unread count accurately reflects active unread items (${unreadCount})`);

  const paginated = await NotificationService.getNotifications(testUserAId, { limit: 2, page: 1 });
  assert(paginated.notifications.length === 2, "Pagination limit respected (2 items returned)");
  assert(paginated.total >= 3, `Total count reported accurately (${paginated.total})`);

  const categoryFiltered = await NotificationService.getNotifications(testUserAId, {
    category: "HYDRATION",
  });
  assert(
    categoryFiltered.notifications.every((n) => n.category === "HYDRATION"),
    "Category filter returns only HYDRATION notifications"
  );

  // TEST 4: Mark Read & IDOR Protection
  console.log("\n--- TEST 4: Mark Read & IDOR Protection ---");
  const readResult = await NotificationService.markAsRead(testUserAId, notif1.id);
  assert(readResult.isRead === true, "Mark as read set isRead = true");
  assert(readResult.readAt !== null, "readAt timestamp was set upon marking as read");

  let idorBlocked = false;
  try {
    // User B trying to mark User A's notification as read
    await NotificationService.markAsRead(testUserBId, notif1.id);
  } catch (err: any) {
    idorBlocked = err.message.includes("Unauthorized");
  }
  assert(idorBlocked, "IDOR blocked: User B cannot mark User A's notification as read");

  // Mark all as read
  await NotificationService.markAllAsRead(testUserAId);
  const unreadAfterMarkAll = await NotificationService.getUnreadCount(testUserAId);
  assert(unreadAfterMarkAll === 0, "markAllAsRead resets unread count to 0");

  // TEST 5: Delete / Dismiss Notification
  console.log("\n--- TEST 5: Delete / Dismiss Notification ---");
  await NotificationService.deleteNotification(testUserAId, notif1.id);
  const deletedCheck = await pool.notification.findUnique({ where: { id: notif1.id } });
  assert(deletedCheck === null, "Notification deleted successfully from database");

  // TEST 6: User Category Preference Suppression
  console.log("\n--- TEST 6: User Category Preference Suppression ---");
  await NotificationService.updatePreferences(testUserAId, { hydrationReminders: false });
  const suppressedNotif = await NotificationService.createNotification({
    userId: testUserAId,
    category: "HYDRATION",
    type: "HYDRATION_REMINDER",
    title: "Suppressed Reminder",
    message: "This should not be delivered.",
  });
  assert(suppressedNotif === null, "Hydration notification suppressed when user turned preference OFF");

  // System notification should still be delivered
  const systemNotif = await NotificationService.createNotification({
    userId: testUserAId,
    category: "SYSTEM",
    type: "SYSTEM_ANNOUNCEMENT",
    title: "System Update",
    message: "Important maintenance window notice.",
  });
  assert(systemNotif !== null, "SYSTEM category notification delivered even when others are disabled");

  // TEST 7: Smart Reminder Engine (Context & Quiet Hours)
  console.log("\n--- TEST 7: Smart Reminder Engine ---");
  // 7a. Quiet hours active
  const nightTime = new Date("2026-08-22T01:30:00Z");
  nightTime.setHours(1, 30); // 1:30 AM
  const quietCheck = SmartReminderService.isWithinQuietHours(nightTime, "22:00", "08:00");
  assert(quietCheck === true, "Quiet hours correctly identifies overnight window (01:30 is quiet)");

  const dayTime = new Date("2026-08-22T14:00:00Z");
  dayTime.setHours(14, 0); // 2:00 PM
  const dayCheck = SmartReminderService.isWithinQuietHours(dayTime, "22:00", "08:00");
  assert(dayCheck === false, "Quiet hours correctly identifies daytime window (14:00 is active)");

  // 7b. Evaluate with quiet hours on
  await NotificationService.updatePreferences(testUserAId, {
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });
  const quietEval = await SmartReminderService.evaluateReminders(testUserAId, nightTime);
  assert(quietEval.quietHoursActive === true, "Smart Reminder engine suppresses evaluation during quiet hours");

  // TEST 8: Community Friend Event Integration
  console.log("\n--- TEST 8: Community Friend Event Integration ---");
  await CommunityService.sendFriendRequest(testUserAId, testUserBId);
  const friendNotifsB = await NotificationService.getNotifications(testUserBId, {
    category: "FRIENDS",
  });
  assert(
    friendNotifsB.notifications.some((n) => n.type === "FRIEND_REQUEST"),
    "Friend request created FRIEND_REQUEST notification for recipient"
  );

  // TEST 9: Feature Request & Admin Integration
  console.log("\n--- TEST 9: Feature Request & Admin Integration ---");
  const newFr = await FeatureRequestService.createRequest(testUserAId, {
    title: "Dark Mode AMOLED Accent Customizer",
    description: "Ability to select custom hex color accents.",
  });
  assert(newFr !== null, "Feature request submitted");

  const adminNotifs = await NotificationService.getNotifications(testAdminId, {
    category: "ADMIN",
  });
  assert(
    adminNotifs.notifications.some((n) => n.type === "FEATURE_REQUEST_STATUS"),
    "Feature request submission notified the administrator"
  );

  // Admin responds
  await AdminService.updateFeatureRequest(
    testAdminId,
    newFr.id,
    "IN_PROGRESS",
    "Great suggestion! We are building this for the next release."
  );
  const userFrNotifs = await NotificationService.getNotifications(testUserAId, {
    category: "FEATURE_REQUEST",
  });
  assert(
    userFrNotifs.notifications.some(
      (n) => n.type === "FEATURE_REQUEST_RESPONSE" && n.message.includes("Great suggestion")
    ),
    "Admin response created FEATURE_REQUEST_RESPONSE notification for user"
  );

  // TEST 10: Admin Account Approval Lifecycle Notification
  console.log("\n--- TEST 10: Admin Account Approval Lifecycle Notification ---");
  const pendingUserId = `pending_user_${Date.now()}`;
  await pool.user.create({
    data: {
      id: pendingUserId,
      name: "Pending Patrick",
      username: `patrick_${Date.now()}`,
      email: `patrick_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "USER",
      accountStatus: "PENDING_APPROVAL",
    },
  });

  await AdminService.updateUserStatus(testAdminId, pendingUserId, "APPROVED");
  const approvedUserNotifs = await NotificationService.getNotifications(pendingUserId, {
    category: "SYSTEM",
  });
  assert(
    approvedUserNotifs.notifications.some((n) => n.type === "USER_APPROVED"),
    "Admin user approval triggered USER_APPROVED notification for user"
  );

  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});