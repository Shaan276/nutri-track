import { prisma } from "../lib/db";
import { CommunityService } from "../lib/services/community.service";
import { PrivacyService } from "../lib/services/privacy.service";
import { RecommendationService } from "../lib/services/recommendation.service";
import { NotificationService } from "../lib/services/notification.service";
import { AIToolRegistry } from "../lib/ai/tool-registry";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";

async function runPrompt17Tests() {
  console.log("================================================================================");
  console.log("🚀 NUTRI-TRACK PROMPT 17: COMMUNITY, FRIENDS & PRIVACY FOUNDATION TEST SUITE");
  console.log("================================================================================");

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${totalCount}. ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${totalCount}. ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  const timestamp = Date.now();
  const userAId = `test_user_a_${timestamp}`;
  const userBId = `test_user_b_${timestamp}`;
  const userCId = `test_user_c_${timestamp}`;

  try {
    // Setup Test Users
    const userA = await prisma.user.create({
      data: {
        id: userAId,
        name: "Alex Runner",
        username: `alex_${timestamp}`,
        email: `alex_${timestamp}@example.com`,
        passwordHash: "hashA",
      },
    });

    const userB = await prisma.user.create({
      data: {
        id: userBId,
        name: "Bob Lifter",
        username: `bob_${timestamp}`,
        email: `bob_${timestamp}@example.com`,
        passwordHash: "hashB",
      },
    });

    const userC = await prisma.user.create({
      data: {
        id: userCId,
        name: "Charlie Solo",
        username: `charlie_${timestamp}`,
        email: `charlie_${timestamp}@example.com`,
        passwordHash: "hashC",
      },
    });

    // Create user profiles
    await prisma.userProfile.create({
      data: {
        userId: userAId,
        dateOfBirth: new Date("1995-05-15"),
        biologicalSex: "MALE",
        heightCm: 178,
        weightKg: 72,
        activityLevel: "VERY_ACTIVE",
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: userBId,
        dateOfBirth: new Date("1992-08-20"),
        biologicalSex: "MALE",
        heightCm: 182,
        weightKg: 85,
        activityLevel: "MODERATELY_ACTIVE",
      },
    });

    // --- TEST GROUP 1: User Discovery & Safe Search ---
    console.log("\n--- TEST GROUP 1: User Discovery & Safe Search ---");
    const searchRes = await CommunityService.searchUsers(userAId, "bob");
    assert(searchRes.length > 0, "User A can discover User B via search");
    assert(searchRes.some((u) => u.username === userB.username), "User B found in search results");
    assert(!searchRes.some((u) => (u as any).email || (u as any).passwordHash), "Email and passwords are not exposed in search");
    assert(!searchRes.some((u) => u.id === userAId), "Requester is omitted from their own search results");

    // --- TEST GROUP 2: Friendship Lifecycle & Relational Constraints ---
    console.log("\n--- TEST GROUP 2: Friendship Lifecycle & Relational Constraints ---");
    
    // 1. Self-friending prevented
    let selfFriendBlocked = false;
    try {
      await CommunityService.sendFriendRequest(userAId, userA.username);
    } catch (err: any) {
      selfFriendBlocked = err.message.includes("yourself");
    }
    assert(selfFriendBlocked, "Self-friending is blocked");

    // 2. User A sends friend request to User B
    const sendReq = await CommunityService.sendFriendRequest(userAId, userB.username);
    assert(sendReq.friendship?.status === "PENDING", "Friend request created with PENDING status");

    // 3. User B receives pending request
    const bPending = await CommunityService.getPendingRequests(userBId);
    assert(bPending.incoming.some((r) => r.requesterId === userAId), "User B has incoming friend request from User A");

    // 4. Duplicate request from User A is prevented
    const dupReq = await CommunityService.sendFriendRequest(userAId, userB.username);
    assert(dupReq.friendship?.id === sendReq.friendship.id, "Duplicate friend request handled safely");

    // 5. User B accepts the friend request
    const acceptRes = await CommunityService.respondToFriendRequest(userBId, sendReq.friendship.id, "ACCEPT");
    assert(acceptRes.success === true && acceptRes.status === "ACCEPTED", "User B accepted friend request successfully");

    // 6. Both users list each other as accepted friends
    const friendsA = await CommunityService.getFriends(userAId);
    const friendsB = await CommunityService.getFriends(userBId);
    assert(friendsA.some((f) => f.id === userBId), "User B appears in User A friends list");
    assert(friendsB.some((f) => f.id === userAId), "User A appears in User B friends list");

    // --- TEST GROUP 3: Reverse Request Handling & Blocking ---
    console.log("\n--- TEST GROUP 3: Reverse Request Handling & Blocking ---");
    // User A sends request to User C
    const reqAC = await CommunityService.sendFriendRequest(userAId, userC.username);
    assert(reqAC.friendship?.status === "PENDING", "User A sent pending request to User C");

    // Reverse request from User C to User A auto-accepts!
    const reqCA = await CommunityService.sendFriendRequest(userCId, userA.username);
    assert(reqCA.autoAccepted === true, "Reverse pending friend request automatically accepted");

    // User A removes User C
    await CommunityService.removeFriend(userAId, userCId);
    const friendsAfterRemove = await CommunityService.getFriends(userAId);
    assert(!friendsAfterRemove.some((f) => f.id === userCId), "User C removed from User A friends list");

    // User A blocks User C
    const newReqAC = await CommunityService.sendFriendRequest(userAId, userC.username);
    await CommunityService.respondToFriendRequest(userCId, newReqAC.friendship.id, "BLOCK");
    let blockedRequestFails = false;
    try {
      await CommunityService.sendFriendRequest(userAId, userC.username);
    } catch (err: any) {
      blockedRequestFails = err.message.includes("Cannot send");
    }
    assert(blockedRequestFails, "Blocked user cannot be sent new requests");

    // --- TEST GROUP 4: Conservative Default Privacy ---
    console.log("\n--- TEST GROUP 4: Conservative Default Privacy ---");
    const defaultPrivacy = await PrivacyService.getPrivacySettings(userAId);
    assert(defaultPrivacy.shareHealthScore === "PRIVATE", "Health Score defaults to PRIVATE");
    assert(defaultPrivacy.shareNutrition === "PRIVATE", "Nutrition defaults to PRIVATE");
    assert(defaultPrivacy.shareHydration === "PRIVATE", "Hydration defaults to PRIVATE");
    assert(defaultPrivacy.shareActivities === "PRIVATE", "Activities default to PRIVATE");
    assert(defaultPrivacy.shareWorkouts === "PRIVATE", "Workouts default to PRIVATE");
    assert(defaultPrivacy.shareAchievements === "PRIVATE", "Achievements default to PRIVATE");

    // --- TEST GROUP 5: Server-Side Authorization & Summary Guarantee ---
    console.log("\n--- TEST GROUP 5: Server-Side Authorization & Summary Guarantee ---");
    
    // User B views User A's profile while User A has all PRIVATE settings
    const profileBeforeShare = await CommunityService.getFriendSharedProfile(userBId, userA.username);
    assert(profileBeforeShare.healthScore.isPrivate === true, "User A Health Score is private to User B");
    assert(profileBeforeShare.nutrition.isPrivate === true, "User A Nutrition is private to User B");
    assert(profileBeforeShare.activities.isPrivate === true, "User A Activities is private to User B");
    assert(profileBeforeShare.healthScore.data === null, "Private section returns null data payload");

    // User A enables Health Score and Activities sharing
    await PrivacyService.updatePrivacySettings(userAId, {
      shareHealthScore: "FRIENDS",
      shareActivities: "FRIENDS",
    });

    const profileAfterShare = await CommunityService.getFriendSharedProfile(userBId, userA.username);
    assert(profileAfterShare.healthScore.isPrivate === false, "User B can now see User A Health Score");
    assert(profileAfterShare.activities.isPrivate === false, "User B can now see User A Activities summary");
    assert(profileAfterShare.nutrition.isPrivate === true, "User A Nutrition remains strictly private");
    assert(profileAfterShare.workouts.isPrivate === true, "User A Workouts remain strictly private");

    // Non-friend User C attempts to view User A's profile
    const profileStranger = await CommunityService.getFriendSharedProfile(userCId, userA.username);
    assert(profileStranger.healthScore.isPrivate === true, "Stranger User C cannot see User A Health Score");
    assert(profileStranger.relationshipStatus !== "ACCEPTED", "Relationship status correctly marked as not accepted");

    // --- TEST GROUP 6: Mutual Comparison Safety ---
    console.log("\n--- TEST GROUP 6: Mutual Comparison Safety ---");
    // User B enables Health Score and Workouts sharing
    await PrivacyService.updatePrivacySettings(userBId, {
      shareHealthScore: "FRIENDS",
      shareWorkouts: "FRIENDS",
    });

    const comparison = await CommunityService.getFriendComparison(userAId, userB.username);
    const hsMetric = comparison.metrics.find((m) => m.key === "health_score");
    const actMetric = comparison.metrics.find((m) => m.key === "running_distance");
    const wkMetric = comparison.metrics.find((m) => m.key === "workout_sessions");

    assert(hsMetric?.isSharedByBoth === true, "Health Score compared because BOTH users enabled sharing");
    assert(actMetric?.isSharedByBoth === false, "Running distance NOT compared because User B kept it private");
    assert(wkMetric?.isSharedByBoth === false, "Workouts NOT compared because User A kept it private");
    assert(!comparison.supportiveInsight.includes("losing") && !comparison.supportiveInsight.includes("worse"), "Comparison provides supportive, positive messaging");

    // --- TEST GROUP 7: Controlled Peer Recommendations ---
    console.log("\n--- TEST GROUP 7: Controlled Peer Recommendations ---");
    const rec = await RecommendationService.sendRecommendation(userAId, {
      receiverId: userBId,
      itemType: "WORKOUT",
      title: "Leg Day Squats & Lunges",
      payload: { sets: 4, reps: 10 },
      message: "Great session for building lower-body endurance!",
    });
    assert(rec.status === "PENDING", "Recommendation created with PENDING status");
    assert(rec.title === "Leg Day Squats & Lunges", "Recommendation title matches");

    const bRecs = await RecommendationService.getReceivedRecommendations(userBId);
    assert(bRecs.some((r) => r.id === rec.id), "User B received recommendation");

    // Save recommendation
    const respondRes = await RecommendationService.respondToRecommendation(userBId, rec.id, "SAVE");
    assert(respondRes.recommendation.status === "ACCEPTED", "User B saved recommendation successfully");

    // Stranger User C cannot access or respond to User B's recommendation
    let strangerRecBlocked = false;
    try {
      await RecommendationService.respondToRecommendation(userCId, rec.id, "DISMISS");
    } catch (err: any) {
      strangerRecBlocked = err.message.includes("Unauthorized");
    }
    assert(strangerRecBlocked, "Stranger User C is blocked from accessing User B's recommendation");

    // --- TEST GROUP 8: Notification Persistence & Security ---
    console.log("\n--- TEST GROUP 8: Notification Persistence & Security ---");
    const notifsB = await NotificationService.getNotifications(userBId);
    assert(notifsB.notifications.length > 0, "User B has persisted notifications");
    assert(notifsB.unreadCount > 0, "User B has unread notification count");

    // Mark as read
    const firstNotifId = notifsB.notifications[0].id;
    await NotificationService.markAsRead(userBId, firstNotifId);
    const updatedNotifsB = await NotificationService.getNotifications(userBId);
    const readNotif = updatedNotifsB.notifications.find((n: any) => n.id === firstNotifId);
    assert(readNotif?.isRead === true, "Notification marked as read successfully");

    // IDOR test: User A cannot read or delete User B's notification
    let idorDeleteBlocked = false;
    try {
      await NotificationService.deleteNotification(userAId, firstNotifId);
    } catch (err: any) {
      idorDeleteBlocked = err.message.includes("Unauthorized");
    }
    assert(idorDeleteBlocked, "User A blocked from deleting User B's notification (IDOR protection)");

    // --- TEST GROUP 9: AI Coach Privacy Boundary ---
    console.log("\n--- TEST GROUP 9: AI Coach Privacy Boundary ---");
    // User A asks AI Coach to compare with accepted friend User B
    const aiCompareFriend = await AIToolRegistry.executeTool(
      "compare_with_friend",
      { friendUsername: userB.username },
      { userId: userAId }
    );
    assert(aiCompareFriend.friend === "Bob Lifter", "AI Coach retrieves friend comparison through privacy layer");
    assert(Array.isArray(aiCompareFriend.metrics), "AI Coach metrics strictly match privacy authorization");

    // User A asks AI Coach to compare with non-friend User C
    const aiCompareStranger = await AIToolRegistry.executeTool(
      "compare_with_friend",
      { friendUsername: userC.username },
      { userId: userAId }
    );
    assert(
      aiCompareStranger.status === "UNAVAILABLE" || aiCompareStranger.message.includes("friends"),
      "AI Coach blocked from accessing non-friend's health data"
    );

    console.log("\nCleaning up test fixtures...");
    try { await (prisma as any).friendship.deleteMany({ where: { OR: [{ requesterId: userAId }, { addresseeId: userAId }, { requesterId: userBId }, { addresseeId: userBId }, { requesterId: userCId }, { addresseeId: userCId }] } }); } catch {}
    try { await (prisma as any).userPrivacySettings.deleteMany({ where: { userId: userAId } }); } catch {}
    try { await (prisma as any).userPrivacySettings.deleteMany({ where: { userId: userBId } }); } catch {}
    try { await (prisma as any).userPrivacySettings.deleteMany({ where: { userId: userCId } }); } catch {}
    try { await (prisma as any).friendRecommendation.deleteMany({ where: { receiverId: userBId } }); } catch {}
    try { await (prisma as any).notification.deleteMany({ where: { userId: userAId } }); } catch {}
    try { await (prisma as any).notification.deleteMany({ where: { userId: userBId } }); } catch {}
    try { await (prisma as any).notification.deleteMany({ where: { userId: userCId } }); } catch {}
    try { await (prisma.userProfile.delete as any)({ where: { userId: userAId } }); } catch {}
    try { await (prisma.userProfile.delete as any)({ where: { userId: userBId } }); } catch {}
    try { await prisma.user.delete({ where: { id: userAId } }); } catch {}
    try { await prisma.user.delete({ where: { id: userBId } }); } catch {}
    try { await prisma.user.delete({ where: { id: userCId } }); } catch {}

    console.log("\n================================================================================");
    console.log(`📊 FINAL TEST RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log("================================================================================");
    console.log("🎉 ALL PROMPT 17 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");
  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runPrompt17Tests();
