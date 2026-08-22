import { PrismaClient, Prisma } from "@prisma/client";
import { Pool as PgRealPool } from "pg";
import { newDb, IMemoryDb } from "pg-mem";
import fs from "fs";
import path from "path";

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  memDb: IMemoryDb | undefined;
  pgPool: any | undefined;
};

const dataDir = path.join(process.cwd(), ".data");
const storageFile = path.join(dataDir, "nutritrack_db.json");

interface PersistentData {
  users: Array<any>;
  user_profiles: Array<any>;
  foods: Array<any>;
  meal_logs: Array<any>;
  meal_entries: Array<any>;
  hydration_logs: Array<any>;
  activity_logs: Array<any>;
  workout_sessions: Array<any>;
  workout_exercises: Array<any>;
  workout_sets: Array<any>;
  workout_templates: Array<any>;
  workout_template_exercises: Array<any>;
  user_nutrient_targets: Array<any>;
  google_sheet_connections: Array<any>;
  ai_conversations: Array<any>;
  ai_messages: Array<any>;
  ai_memories: Array<any>;
  friendships: Array<any>;
  user_privacy_settings: Array<any>;
  privacy_settings: Array<any>;
  friend_recommendations: Array<any>;
  notifications: Array<any>;
  user_notification_preferences: Array<any>;
  integration_connections: Array<any>;
  pre_approved_users: Array<any>;
  feature_requests: Array<any>;
  goals: Array<any>;
  goal_milestones: Array<any>;
  achievements: Array<any>;
  user_achievements: Array<any>;
  challenges: Array<any>;
  challenge_participants: Array<any>;
  weekly_plans: Array<any>;
  weekly_plan_items: Array<any>;
  system_settings: Array<any>;
}

function loadPersistedData(): PersistentData {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(storageFile)) {
      const raw = fs.readFileSync(storageFile, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        user_profiles: parsed.user_profiles || [],
        foods: parsed.foods || [],
        meal_logs: parsed.meal_logs || [],
        meal_entries: parsed.meal_entries || [],
        hydration_logs: parsed.hydration_logs || [],
        activity_logs: parsed.activity_logs || [],
        workout_sessions: parsed.workout_sessions || [],
        workout_exercises: parsed.workout_exercises || [],
        workout_sets: parsed.workout_sets || [],
        workout_templates: parsed.workout_templates || [],
        workout_template_exercises: parsed.workout_template_exercises || [],
        user_nutrient_targets: parsed.user_nutrient_targets || [],
        google_sheet_connections: parsed.google_sheet_connections || [],
        ai_conversations: parsed.ai_conversations || [],
        ai_messages: parsed.ai_messages || [],
        ai_memories: parsed.ai_memories || [],
        friendships: parsed.friendships || [],
        user_privacy_settings: parsed.user_privacy_settings || [],
        privacy_settings: parsed.privacy_settings || [],
        friend_recommendations: parsed.friend_recommendations || [],
        notifications: parsed.notifications || [],
        user_notification_preferences: parsed.user_notification_preferences || [],
        integration_connections: parsed.integration_connections || [],
        pre_approved_users: parsed.pre_approved_users || [],
        feature_requests: parsed.feature_requests || [],
        goals: parsed.goals || [],
        goal_milestones: parsed.goal_milestones || [],
        achievements: parsed.achievements || [],
        user_achievements: parsed.user_achievements || [],
        challenges: parsed.challenges || [],
        challenge_participants: parsed.challenge_participants || [],
        weekly_plans: parsed.weekly_plans || [],
        weekly_plan_items: parsed.weekly_plan_items || [],
        system_settings: parsed.system_settings || [],
      };
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  return {
    users: [],
    user_profiles: [],
    foods: [],
    meal_logs: [],
    meal_entries: [],
    hydration_logs: [],
    activity_logs: [],
    workout_sessions: [],
    workout_exercises: [],
    workout_sets: [],
    workout_templates: [],
    workout_template_exercises: [],
    user_nutrient_targets: [],
    google_sheet_connections: [],
    ai_conversations: [],
    ai_messages: [],
    ai_memories: [],
    friendships: [],
    user_privacy_settings: [],
    privacy_settings: [],
    friend_recommendations: [],
    notifications: [],
    user_notification_preferences: [],
    integration_connections: [],
    pre_approved_users: [],
    feature_requests: [],
    goals: [],
    goal_milestones: [],
    achievements: [],
    user_achievements: [],
    challenges: [],
    challenge_participants: [],
    weekly_plans: [],
    weekly_plan_items: [],
    system_settings: [],
  };
}

function savePersistedData(data: PersistentData) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

async function getPool(): Promise<any> {
  if (!globalForDb.pgPool) {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    let pool: any = null;

    if (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
      try {
        pool = new PgRealPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          max: 10,
        });
        await pool.query("SELECT 1");
      } catch (err) {
        console.warn("Falling back to in-memory db because connection failed:", err);
        pool = null;
      }
    }

    if (!pool) {
      const db = newDb();
      const { Pool } = db.adapters.createPg();
      pool = new Pool();
      globalForDb.memDb = db;
    }

    globalForDb.pgPool = pool;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'USER',
        account_status TEXT DEFAULT 'PENDING_APPROVAL',
        approved_at TIMESTAMP WITH TIME ZONE,
        approved_by_admin_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        date_of_birth TIMESTAMP WITH TIME ZONE NOT NULL,
        biological_sex TEXT NOT NULL,
        height_cm DOUBLE PRECISION NOT NULL,
        weight_kg DOUBLE PRECISION NOT NULL,
        activity_level TEXT NOT NULL,
        daily_hydration_target_ml INTEGER DEFAULT 2500,
        daily_step_target INTEGER DEFAULT 10000,
        weekly_running_distance_km DOUBLE PRECISION DEFAULT 15.0,
        weekly_workout_sessions INTEGER DEFAULT 3,
        primary_goal TEXT DEFAULT 'MAINTAIN',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'OTHER',
        brand TEXT,
        barcode TEXT,
        serving_size DOUBLE PRECISION NOT NULL,
        serving_unit TEXT NOT NULL,
        calories DOUBLE PRECISION DEFAULT 0,
        protein DOUBLE PRECISION DEFAULT 0,
        carbohydrates DOUBLE PRECISION DEFAULT 0,
        fat DOUBLE PRECISION DEFAULT 0,
        fiber DOUBLE PRECISION DEFAULT 0,
        sugar DOUBLE PRECISION DEFAULT 0,
        sodium DOUBLE PRECISION,
        calcium DOUBLE PRECISION,
        iron DOUBLE PRECISION,
        potassium DOUBLE PRECISION,
        magnesium DOUBLE PRECISION,
        zinc DOUBLE PRECISION,
        phosphorus DOUBLE PRECISION,
        copper DOUBLE PRECISION,
        manganese DOUBLE PRECISION,
        selenium DOUBLE PRECISION,
        vitamin_a DOUBLE PRECISION,
        vitamin_c DOUBLE PRECISION,
        vitamin_d DOUBLE PRECISION,
        vitamin_e DOUBLE PRECISION,
        vitamin_k DOUBLE PRECISION,
        vitamin_b1 DOUBLE PRECISION,
        vitamin_b2 DOUBLE PRECISION,
        vitamin_b3 DOUBLE PRECISION,
        vitamin_b5 DOUBLE PRECISION,
        vitamin_b6 DOUBLE PRECISION,
        vitamin_b7 DOUBLE PRECISION,
        vitamin_b9 DOUBLE PRECISION,
        vitamin_b12 DOUBLE PRECISION,
        water DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        is_system_food BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_nutrient_targets (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        calories DOUBLE PRECISION DEFAULT 2000,
        protein DOUBLE PRECISION DEFAULT 120,
        carbohydrates DOUBLE PRECISION DEFAULT 250,
        fat DOUBLE PRECISION DEFAULT 65,
        fiber DOUBLE PRECISION DEFAULT 30,
        sugar DOUBLE PRECISION DEFAULT 35,
        calcium DOUBLE PRECISION DEFAULT 1000,
        iron DOUBLE PRECISION DEFAULT 18,
        magnesium DOUBLE PRECISION DEFAULT 400,
        potassium DOUBLE PRECISION DEFAULT 3400,
        sodium DOUBLE PRECISION DEFAULT 2300,
        zinc DOUBLE PRECISION DEFAULT 11,
        phosphorus DOUBLE PRECISION DEFAULT 700,
        copper DOUBLE PRECISION DEFAULT 0.9,
        manganese DOUBLE PRECISION DEFAULT 2.3,
        selenium DOUBLE PRECISION DEFAULT 55,
        vitamin_a DOUBLE PRECISION DEFAULT 900,
        vitamin_c DOUBLE PRECISION DEFAULT 90,
        vitamin_d DOUBLE PRECISION DEFAULT 20,
        vitamin_e DOUBLE PRECISION DEFAULT 15,
        vitamin_k DOUBLE PRECISION DEFAULT 120,
        vitamin_b1 DOUBLE PRECISION DEFAULT 1.2,
        vitamin_b2 DOUBLE PRECISION DEFAULT 1.3,
        vitamin_b3 DOUBLE PRECISION DEFAULT 16,
        vitamin_b5 DOUBLE PRECISION DEFAULT 5,
        vitamin_b6 DOUBLE PRECISION DEFAULT 1.7,
        vitamin_b7 DOUBLE PRECISION DEFAULT 30,
        vitamin_b9 DOUBLE PRECISION DEFAULT 400,
        vitamin_b12 DOUBLE PRECISION DEFAULT 2.4,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS google_sheet_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        spreadsheet_id TEXT NOT NULL,
        spreadsheet_url TEXT NOT NULL,
        sheet_title TEXT,
        status TEXT DEFAULT 'CONNECTED',
        sync_status TEXT DEFAULT 'IDLE',
        last_synced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meal_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meal_entries (
        id TEXT PRIMARY KEY,
        meal_log_id TEXT NOT NULL,
        food_id TEXT NOT NULL,
        quantity DOUBLE PRECISION NOT NULL,
        quantity_unit TEXT NOT NULL,
        calculated_calories DOUBLE PRECISION DEFAULT 0,
        calculated_protein DOUBLE PRECISION DEFAULT 0,
        calculated_carbs DOUBLE PRECISION DEFAULT 0,
        calculated_fat DOUBLE PRECISION DEFAULT 0,
        calculated_fiber DOUBLE PRECISION DEFAULT 0,
        calculated_sugar DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hydration_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount_ml INTEGER NOT NULL,
        beverage_type TEXT NOT NULL DEFAULT 'WATER',
        date TEXT NOT NULL,
        consumed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL DEFAULT 'RUN',
        running_type TEXT,
        source TEXT DEFAULT 'MANUAL',
        external_id TEXT,
        external_provider TEXT,
        date TEXT NOT NULL,
        distance_km DOUBLE PRECISION DEFAULT 0,
        moving_duration_seconds INTEGER NOT NULL,
        elapsed_duration_seconds INTEGER,
        average_pace_seconds_per_km INTEGER DEFAULT 0,
        steps INTEGER DEFAULT 0,
        calories_burned INTEGER DEFAULT 0,
        elevation_gain_meters INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workout_type TEXT NOT NULL DEFAULT 'GYM_WORKOUT',
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        calories_burned INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id TEXT PRIMARY KEY,
        workout_session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        order_index INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id TEXT PRIMARY KEY,
        workout_exercise_id TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        reps INTEGER,
        weight_kg DOUBLE PRECISION,
        duration_seconds INTEGER,
        distance_km DOUBLE PRECISION,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        workout_type TEXT NOT NULL DEFAULT 'GYM_WORKOUT',
        is_favorite BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_template_exercises (
        id TEXT PRIMARY KEY,
        workout_template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        default_sets INTEGER DEFAULT 3,
        default_reps INTEGER,
        default_weight_kg DOUBLE PRECISION,
        default_duration_seconds INTEGER,
        notes TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_health (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'ok',
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT DEFAULT 'New Conversation',
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT DEFAULT 'GENERAL',
        content TEXT NOT NULL,
        importance INTEGER DEFAULT 1,
        source TEXT DEFAULT 'USER_STATED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id TEXT PRIMARY KEY,
        requester_id TEXT NOT NULL,
        addressee_id TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (requester_id, addressee_id)
      );

      CREATE TABLE IF NOT EXISTS user_privacy_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        share_health_score TEXT DEFAULT 'PRIVATE',
        share_nutrition TEXT DEFAULT 'PRIVATE',
        share_hydration TEXT DEFAULT 'PRIVATE',
        share_activities TEXT DEFAULT 'PRIVATE',
        share_workouts TEXT DEFAULT 'PRIVATE',
        share_achievements TEXT DEFAULT 'PRIVATE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS privacy_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        visibility TEXT DEFAULT 'FRIENDS',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, category)
      );

      CREATE TABLE IF NOT EXISTS friend_recommendations (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        title TEXT NOT NULL,
        payload TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        actor_id TEXT,
        category TEXT DEFAULT 'SYSTEM',
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        action_url TEXT,
        metadata TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        hydration_reminders BOOLEAN DEFAULT TRUE,
        nutrition_reminders BOOLEAN DEFAULT TRUE,
        workout_reminders BOOLEAN DEFAULT FALSE,
        activity_reminders BOOLEAN DEFAULT TRUE,
        friend_notifications BOOLEAN DEFAULT TRUE,
        insight_notifications BOOLEAN DEFAULT TRUE,
        feature_request_notifications BOOLEAN DEFAULT TRUE,
        system_notifications BOOLEAN DEFAULT TRUE,
        quiet_hours_enabled BOOLEAN DEFAULT FALSE,
        quiet_hours_start TEXT DEFAULT '22:00',
        quiet_hours_end TEXT DEFAULT '08:00',
        reminder_frequency TEXT DEFAULT 'MODERATE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS integration_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        status TEXT DEFAULT 'CONNECTED',
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        external_user_id TEXT,
        external_username TEXT,
        scope TEXT,
        metadata TEXT,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, provider)
      );

      CREATE TABLE IF NOT EXISTS pre_approved_users (
        id TEXT PRIMARY KEY,
        identifier TEXT UNIQUE NOT NULL,
        identifier_type TEXT DEFAULT 'EMAIL',
        notes TEXT,
        created_by_admin_id TEXT,
        consumed_at TIMESTAMP WITH TIME ZONE,
        consumed_by_user_id TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feature_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'GENERAL',
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'OPEN',
        admin_response TEXT,
        responded_at TIMESTAMP WITH TIME ZONE,
        responded_by_admin_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        target_value DOUBLE PRECISION NOT NULL,
        current_value DOUBLE PRECISION DEFAULT 0,
        unit TEXT NOT NULL,
        start_date TEXT NOT NULL,
        target_date TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        completed_at TIMESTAMP WITH TIME ZONE,
        last_evaluated_at TIMESTAMP WITH TIME ZONE,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goal_milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        percentage INTEGER NOT NULL,
        reached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (goal_id, percentage)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        points INTEGER DEFAULT 50,
        target_value DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        is_system BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        current_progress DOUBLE PRECISION DEFAULT 0,
        unlocked_at TIMESTAMP WITH TIME ZONE,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, achievement_id)
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        target_value DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        badge_icon TEXT NOT NULL,
        is_system BOOLEAN DEFAULT TRUE,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS challenge_participants (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'JOINED',
        current_progress DOUBLE PRECISION DEFAULT 0,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (challenge_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS weekly_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        goal_summary TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS weekly_plan_items (
        id TEXT PRIMARY KEY,
        weekly_plan_id TEXT NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_data TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        matched_activity_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT DEFAULT 'GENERAL',
        description TEXT,
        is_secret BOOLEAN DEFAULT FALSE,
        updated_by_admin_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'PENDING_APPROVAL';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by_admin_id TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'SYSTEM';
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS daily_step_target INTEGER DEFAULT 10000;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_running_distance_km DOUBLE PRECISION DEFAULT 15.0;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_workout_sessions INTEGER DEFAULT 3;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT DEFAULT 'MAINTAIN';
    `);

    // Load persisted records
    const saved = loadPersistedData();
    for (const u of saved.users) {
      try {
        await pool.query(
          `INSERT INTO users (id, name, email, username, password_hash, role, account_status, approved_at, approved_by_admin_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            u.id,
            u.name,
            u.email,
            u.username,
            u.password_hash,
            u.role || "USER",
            u.account_status || "APPROVED",
            u.approved_at || null,
            u.approved_by_admin_id || null,
            u.created_at,
            u.updated_at,
          ]
        );
      } catch {}
    }

    for (const p of saved.user_profiles) {
      try {
        await pool.query(
          `INSERT INTO user_profiles (id, user_id, date_of_birth, biological_sex, height_cm, weight_kg, activity_level, daily_hydration_target_ml, daily_step_target, weekly_running_distance_km, weekly_workout_sessions, primary_goal, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            p.id,
            p.user_id,
            p.date_of_birth,
            p.biological_sex,
            p.height_cm,
            p.weight_kg,
            p.activity_level,
            p.daily_hydration_target_ml || 2500,
            p.daily_step_target || 10000,
            p.weekly_running_distance_km || 15.0,
            p.weekly_workout_sessions || 3,
            p.primary_goal || "MAINTAIN",
            p.created_at,
            p.updated_at,
          ]
        );
      } catch {}
    }

    for (const t of saved.user_nutrient_targets || []) {
      try {
        await pool.query(
          `INSERT INTO user_nutrient_targets (
            id, user_id, calories, protein, carbohydrates, fat, fiber, sugar,
            calcium, iron, magnesium, potassium, sodium, zinc, phosphorus, copper, manganese, selenium,
            vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k, vitamin_b1, vitamin_b2, vitamin_b3,
            vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26,
            $27, $28, $29, $30, $31, $32, $33
          )`,
          [
            t.id, t.user_id, t.calories, t.protein, t.carbohydrates, t.fat, t.fiber, t.sugar,
            t.calcium, t.iron, t.magnesium, t.potassium, t.sodium, t.zinc, t.phosphorus, t.copper, t.manganese, t.selenium,
            t.vitamin_a, t.vitamin_c, t.vitamin_d, t.vitamin_e, t.vitamin_k, t.vitamin_b1, t.vitamin_b2, t.vitamin_b3,
            t.vitamin_b5, t.vitamin_b6, t.vitamin_b7, t.vitamin_b9, t.vitamin_b12, t.created_at, t.updated_at
          ]
        );
      } catch {}
    }

    for (const sc of saved.google_sheet_connections || []) {
      try {
        await pool.query(
          `INSERT INTO google_sheet_connections (
            id, user_id, spreadsheet_id, spreadsheet_url, sheet_title, status, sync_status, last_synced_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [sc.id, sc.user_id, sc.spreadsheet_id, sc.spreadsheet_url, sc.sheet_title, sc.status, sc.sync_status, sc.last_synced_at, sc.created_at, sc.updated_at]
        );
      } catch {}
    }

    for (const f of saved.foods) {
      try {
        await pool.query(
          `INSERT INTO foods (
            id, user_id, name, category, brand, barcode, serving_size, serving_unit,
            calories, protein, carbohydrates, fat, fiber, sugar,
            sodium, calcium, iron, potassium, magnesium, zinc,
            phosphorus, copper, manganese, selenium,
            vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
            vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12,
            water, notes, is_favorite, is_archived, is_system_food, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24,
            $25, $26, $27, $28, $29,
            $30, $31, $32, $33, $34, $35, $36, $37,
            $38, $39, $40, $41, $42, $43, $44
          )`,
          [
            f.id, f.user_id, f.name, f.category, f.brand, f.barcode, f.serving_size, f.serving_unit,
            f.calories, f.protein, f.carbohydrates, f.fat, f.fiber, f.sugar,
            f.sodium, f.calcium, f.iron, f.potassium, f.magnesium, f.zinc,
            f.phosphorus, f.copper, f.manganese, f.selenium,
            f.vitamin_a, f.vitamin_c, f.vitamin_d, f.vitamin_e, f.vitamin_k,
            f.vitamin_b1, f.vitamin_b2, f.vitamin_b3, f.vitamin_b5, f.vitamin_b6, f.vitamin_b7, f.vitamin_b9, f.vitamin_b12,
            f.water, f.notes, f.is_favorite, f.is_archived, f.is_system_food, f.created_at, f.updated_at
          ]
        );
      } catch {}
    }

    for (const m of saved.meal_logs) {
      try {
        await pool.query(
          `INSERT INTO meal_logs (id, user_id, date, meal_type, name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [m.id, m.user_id, m.date, m.meal_type, m.name, m.created_at, m.updated_at]
        );
      } catch {}
    }

    for (const e of saved.meal_entries) {
      try {
        await pool.query(
          `INSERT INTO meal_entries (
            id, meal_log_id, food_id, quantity, quantity_unit,
            calculated_calories, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber, calculated_sugar,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            e.id, e.meal_log_id, e.food_id, e.quantity, e.quantity_unit,
            e.calculated_calories, e.calculated_protein, e.calculated_carbs, e.calculated_fat, e.calculated_fiber, e.calculated_sugar,
            e.created_at, e.updated_at
          ]
        );
      } catch {}
    }

    for (const h of saved.hydration_logs) {
      try {
        await pool.query(
          `INSERT INTO hydration_logs (id, user_id, amount_ml, beverage_type, date, consumed_at, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [h.id, h.user_id, h.amount_ml, h.beverage_type, h.date, h.consumed_at, h.notes, h.created_at, h.updated_at]
        );
      } catch {}
    }

    for (const a of saved.activity_logs) {
      try {
        await pool.query(
          `INSERT INTO activity_logs (
            id, user_id, activity_type, running_type, source, external_id, external_provider,
            date, distance_km, moving_duration_seconds,
            elapsed_duration_seconds, average_pace_seconds_per_km, steps,
            calories_burned, elevation_gain_meters, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            a.id,
            a.user_id,
            a.activity_type,
            a.running_type || null,
            a.source || "MANUAL",
            a.external_id || null,
            a.external_provider || null,
            a.date,
            a.distance_km || 0,
            a.moving_duration_seconds,
            a.elapsed_duration_seconds,
            a.average_pace_seconds_per_km || 0,
            a.steps,
            a.calories_burned,
            a.elevation_gain_meters,
            a.notes,
            a.created_at,
            a.updated_at,
          ]
        );
      } catch {}
    }

    for (const ws of saved.workout_sessions) {
      try {
        await pool.query(
          `INSERT INTO workout_sessions (id, user_id, workout_type, name, date, duration_seconds, calories_burned, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [ws.id, ws.user_id, ws.workout_type, ws.name, ws.date, ws.duration_seconds || 0, ws.calories_burned || 0, ws.notes, ws.created_at, ws.updated_at]
        );
      } catch {}
    }

    for (const we of saved.workout_exercises) {
      try {
        await pool.query(
          `INSERT INTO workout_exercises (id, workout_session_id, name, category, order_index, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [we.id, we.workout_session_id, we.name, we.category, we.order_index || 0, we.notes, we.created_at, we.updated_at]
        );
      } catch {}
    }

    for (const st of saved.workout_sets) {
      try {
        await pool.query(
          `INSERT INTO workout_sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_km, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [st.id, st.workout_exercise_id, st.set_number, st.reps, st.weight_kg, st.duration_seconds, st.distance_km, st.notes, st.created_at, st.updated_at]
        );
      } catch {}
    }

    for (const wt of saved.workout_templates || []) {
      try {
        await pool.query(
          `INSERT INTO workout_templates (id, user_id, name, description, workout_type, is_favorite, is_archived, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [wt.id, wt.user_id, wt.name, wt.description, wt.workout_type || "GYM_WORKOUT", Boolean(wt.is_favorite), Boolean(wt.is_archived), wt.created_at, wt.updated_at]
        );
      } catch {}
    }

    for (const wte of saved.workout_template_exercises || []) {
      try {
        await pool.query(
          `INSERT INTO workout_template_exercises (id, workout_template_id, name, category, default_sets, default_reps, default_weight_kg, default_duration_seconds, notes, order_index, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [wte.id, wte.workout_template_id, wte.name, wte.category, wte.default_sets || 3, wte.default_reps, wte.default_weight_kg, wte.default_duration_seconds, wte.notes, wte.order_index || 0, wte.created_at, wte.updated_at]
        );
      } catch {}
    }

    for (const c of saved.ai_conversations || []) {
      try {
        await pool.query(
          `INSERT INTO ai_conversations (id, user_id, title, last_message_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [c.id, c.user_id, c.title || "New Conversation", c.last_message_at, c.created_at, c.updated_at]
        );
      } catch {}
    }

    for (const msg of saved.ai_messages || []) {
      try {
        await pool.query(
          `INSERT INTO ai_messages (id, conversation_id, role, content, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [msg.id, msg.conversation_id, msg.role, msg.content, msg.metadata, msg.created_at]
        );
      } catch {}
    }

    for (const mem of saved.ai_memories || []) {
      try {
        await pool.query(
          `INSERT INTO ai_memories (id, user_id, category, content, importance, source, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [mem.id, mem.user_id, mem.category || "GENERAL", mem.content, mem.importance || 1, mem.source || "USER_STATED", mem.created_at, mem.updated_at]
        );
      } catch {}
    }

    for (const f of saved.friendships || []) {
      try {
        await pool.query(
          `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [f.id, f.requester_id, f.addressee_id, f.status || "PENDING", f.created_at, f.updated_at]
        );
      } catch {}
    }

    for (const p of saved.user_privacy_settings || []) {
      try {
        await pool.query(
          `INSERT INTO user_privacy_settings (id, user_id, share_health_score, share_nutrition, share_hydration, share_activities, share_workouts, share_achievements, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            p.id,
            p.user_id,
            p.share_health_score || "PRIVATE",
            p.share_nutrition || "PRIVATE",
            p.share_hydration || "PRIVATE",
            p.share_activities || "PRIVATE",
            p.share_workouts || "PRIVATE",
            p.share_achievements || "PRIVATE",
            p.created_at,
            p.updated_at,
          ]
        );
      } catch {}
    }

    for (const ps of saved.privacy_settings || []) {
      try {
        await pool.query(
          `INSERT INTO privacy_settings (id, user_id, category, visibility, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ps.id, ps.user_id, ps.category, ps.visibility || "FRIENDS", ps.created_at, ps.updated_at]
        );
      } catch {}
    }

    for (const r of saved.friend_recommendations || []) {
      try {
        await pool.query(
          `INSERT INTO friend_recommendations (id, sender_id, receiver_id, item_type, title, payload, message, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [r.id, r.sender_id, r.receiver_id, r.item_type, r.title, r.payload, r.message || null, r.status || "PENDING", r.created_at, r.updated_at]
        );
      } catch {}
    }

    for (const n of saved.notifications || []) {
      try {
        await pool.query(
          `INSERT INTO notifications (id, user_id, actor_id, category, type, title, message, link, action_url, metadata, is_read, read_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            n.id,
            n.user_id,
            n.actor_id || null,
            n.category || "SYSTEM",
            n.type,
            n.title,
            n.message,
            n.link || null,
            n.action_url || n.link || null,
            n.metadata || null,
            Boolean(n.is_read),
            n.read_at || null,
            n.created_at,
            n.updated_at,
          ]
        );
      } catch {}
    }

    for (const unp of saved.user_notification_preferences || []) {
      try {
        await pool.query(
          `INSERT INTO user_notification_preferences (id, user_id, hydration_reminders, nutrition_reminders, workout_reminders, activity_reminders, friend_notifications, insight_notifications, feature_request_notifications, system_notifications, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, reminder_frequency, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            unp.id,
            unp.user_id,
            unp.hydration_reminders !== undefined ? Boolean(unp.hydration_reminders) : true,
            unp.nutrition_reminders !== undefined ? Boolean(unp.nutrition_reminders) : true,
            unp.workout_reminders !== undefined ? Boolean(unp.workout_reminders) : false,
            unp.activity_reminders !== undefined ? Boolean(unp.activity_reminders) : true,
            unp.friend_notifications !== undefined ? Boolean(unp.friend_notifications) : true,
            unp.insight_notifications !== undefined ? Boolean(unp.insight_notifications) : true,
            unp.feature_request_notifications !== undefined ? Boolean(unp.feature_request_notifications) : true,
            unp.system_notifications !== undefined ? Boolean(unp.system_notifications) : true,
            unp.quiet_hours_enabled !== undefined ? Boolean(unp.quiet_hours_enabled) : false,
            unp.quiet_hours_start || "22:00",
            unp.quiet_hours_end || "08:00",
            unp.reminder_frequency || "MODERATE",
            unp.created_at || new Date().toISOString(),
            unp.updated_at || new Date().toISOString(),
          ]
        );
      } catch {}
    }

    for (const ic of saved.integration_connections || []) {
      try {
        await pool.query(
          `INSERT INTO integration_connections (id, user_id, provider, status, access_token, refresh_token, token_expires_at, external_user_id, external_username, scope, metadata, last_sync_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            ic.id,
            ic.user_id,
            ic.provider,
            ic.status || "CONNECTED",
            ic.access_token || null,
            ic.refresh_token || null,
            ic.token_expires_at || null,
            ic.external_user_id || null,
            ic.external_username || null,
            ic.scope || null,
            ic.metadata || null,
            ic.last_sync_at || null,
            ic.created_at,
            ic.updated_at,
          ]
        );
      } catch {}
    }

    for (const pau of saved.pre_approved_users || []) {
      try {
        await pool.query(
          `INSERT INTO pre_approved_users (id, identifier, identifier_type, notes, created_by_admin_id, consumed_at, consumed_by_user_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            pau.id,
            pau.identifier,
            pau.identifier_type || "EMAIL",
            pau.notes || null,
            pau.created_by_admin_id || null,
            pau.consumed_at || null,
            pau.consumed_by_user_id || null,
            pau.created_at,
            pau.updated_at,
          ]
        );
      } catch {}
    }

    for (const fr of saved.feature_requests || []) {
      try {
        await pool.query(
          `INSERT INTO feature_requests (id, user_id, title, description, category, priority, status, admin_response, responded_at, responded_by_admin_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            fr.id,
            fr.user_id,
            fr.title,
            fr.description,
            fr.category || "GENERAL",
            fr.priority || "MEDIUM",
            fr.status || "OPEN",
            fr.admin_response || null,
            fr.responded_at || null,
            fr.responded_by_admin_id || null,
            fr.created_at,
            fr.updated_at,
          ]
        );
      } catch {}
    }

    for (const g of saved.goals || []) {
      try {
        await pool.query(
          `INSERT INTO goals (id, user_id, name, description, category, goal_type, target_value, current_value, unit, start_date, target_date, status, completed_at, last_evaluated_at, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            g.id,
            g.user_id,
            g.name,
            g.description || null,
            g.category,
            g.goal_type || g.goalType,
            Number(g.target_value ?? g.targetValue),
            Number(g.current_value ?? g.currentValue ?? 0),
            g.unit,
            g.start_date || g.startDate,
            g.target_date || g.targetDate,
            g.status || "ACTIVE",
            g.completed_at ? new Date(g.completed_at).toISOString() : null,
            g.last_evaluated_at ? new Date(g.last_evaluated_at).toISOString() : null,
            g.metadata || null,
            g.created_at,
            g.updated_at,
          ]
        );
      } catch {}
    }

    for (const gm of saved.goal_milestones || []) {
      try {
        await pool.query(
          `INSERT INTO goal_milestones (id, goal_id, percentage, reached_at, notified_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            gm.id,
            gm.goal_id || gm.goalId,
            Number(gm.percentage),
            gm.reached_at || new Date().toISOString(),
            gm.notified_at || null,
            gm.created_at || new Date().toISOString(),
          ]
        );
      } catch {}
    }

    for (const a of saved.achievements || []) {
      try {
        await pool.query(
          `INSERT INTO achievements (id, code, name, description, category, icon, points, target_value, unit, is_system, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            a.id,
            a.code,
            a.name,
            a.description,
            a.category,
            a.icon,
            Number(a.points || 50),
            Number(a.target_value ?? a.targetValue),
            a.unit,
            a.is_system !== undefined ? Boolean(a.is_system) : true,
            a.created_at,
            a.updated_at,
          ]
        );
      } catch {}
    }

    for (const ua of saved.user_achievements || []) {
      try {
        await pool.query(
          `INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, unlocked_at, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            ua.id,
            ua.user_id || ua.userId,
            ua.achievement_id || ua.achievementId,
            Number(ua.current_progress ?? ua.currentProgress ?? 0),
            ua.unlocked_at ? new Date(ua.unlocked_at).toISOString() : null,
            ua.metadata || null,
            ua.created_at,
            ua.updated_at,
          ]
        );
      } catch {}
    }

    for (const ch of saved.challenges || []) {
      try {
        await pool.query(
          `INSERT INTO challenges (id, code, title, description, category, target_value, unit, duration_days, badge_icon, is_system, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            ch.id,
            ch.code,
            ch.title,
            ch.description,
            ch.category,
            Number(ch.target_value ?? ch.targetValue),
            ch.unit,
            Number(ch.duration_days ?? ch.durationDays),
            ch.badge_icon || ch.badgeIcon,
            ch.is_system !== undefined ? Boolean(ch.is_system) : true,
            ch.is_public !== undefined ? Boolean(ch.is_public) : true,
            ch.created_at,
            ch.updated_at,
          ]
        );
      } catch {}
    }

    for (const cp of saved.challenge_participants || []) {
      try {
        await pool.query(
          `INSERT INTO challenge_participants (id, challenge_id, user_id, status, current_progress, joined_at, completed_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            cp.id,
            cp.challenge_id || cp.challengeId,
            cp.user_id || cp.userId,
            cp.status || "JOINED",
            Number(cp.current_progress ?? cp.currentProgress ?? 0),
            cp.joined_at || new Date().toISOString(),
            cp.completed_at ? new Date(cp.completed_at).toISOString() : null,
            cp.created_at,
            cp.updated_at,
          ]
        );
      } catch {}
    }

    for (const ss of saved.system_settings || []) {
      try {
        await pool.query(
          `INSERT INTO system_settings (id, key, value, category, description, is_secret, updated_by_admin_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            ss.id,
            ss.key,
            ss.value,
            ss.category || "GENERAL",
            ss.description || null,
            ss.is_secret !== undefined ? Boolean(ss.is_secret) : Boolean(ss.isSecret),
            ss.updated_by_admin_id || ss.updatedByAdminId || null,
            ss.created_at || new Date().toISOString(),
            ss.updated_at || new Date().toISOString(),
          ]
        );
      } catch {}
    }

    globalForDb.pgPool = pool;
  }
  return globalForDb.pgPool;
}

async function syncToDisk() {
  const pool = await getPool();
  const usersRes = await pool.query("SELECT * FROM users");
  const profilesRes = await pool.query("SELECT * FROM user_profiles");
  const foodsRes = await pool.query("SELECT * FROM foods");
  const mealLogsRes = await pool.query("SELECT * FROM meal_logs");
  const mealEntriesRes = await pool.query("SELECT * FROM meal_entries");
  const hydrationLogsRes = await pool.query("SELECT * FROM hydration_logs");
  const activityLogsRes = await pool.query("SELECT * FROM activity_logs");
  const workoutSessionsRes = await pool.query("SELECT * FROM workout_sessions");
  const workoutExercisesRes = await pool.query("SELECT * FROM workout_exercises");
  const workoutSetsRes = await pool.query("SELECT * FROM workout_sets");
  const workoutTemplatesRes = await pool.query("SELECT * FROM workout_templates");
  const workoutTemplateExercisesRes = await pool.query("SELECT * FROM workout_template_exercises");
  const userNutrientTargetsRes = await pool.query("SELECT * FROM user_nutrient_targets");
  const googleSheetConnectionsRes = await pool.query("SELECT * FROM google_sheet_connections");
  const aiConversationsRes = await pool.query("SELECT * FROM ai_conversations");
  const aiMessagesRes = await pool.query("SELECT * FROM ai_messages");
  const aiMemoriesRes = await pool.query("SELECT * FROM ai_memories");
  const friendshipsRes = await pool.query("SELECT * FROM friendships");
  const privacySettingsRes = await pool.query("SELECT * FROM user_privacy_settings");
  const privacyCategorySettingsRes = await pool.query("SELECT * FROM privacy_settings");
  const recommendationsRes = await pool.query("SELECT * FROM friend_recommendations");
  const notificationsRes = await pool.query("SELECT * FROM notifications");
  const userNotificationPreferencesRes = await pool.query("SELECT * FROM user_notification_preferences");
  const integrationConnectionsRes = await pool.query("SELECT * FROM integration_connections");
  const preApprovedUsersRes = await pool.query("SELECT * FROM pre_approved_users");
  const featureRequestsRes = await pool.query("SELECT * FROM feature_requests");
  const goalsRes = await pool.query("SELECT * FROM goals");
  const goalMilestonesRes = await pool.query("SELECT * FROM goal_milestones");
  const achievementsRes = await pool.query("SELECT * FROM achievements");
  const userAchievementsRes = await pool.query("SELECT * FROM user_achievements");
  const challengesRes = await pool.query("SELECT * FROM challenges");
  const challengeParticipantsRes = await pool.query("SELECT * FROM challenge_participants");
  const weeklyPlansRes = await pool.query("SELECT * FROM weekly_plans");
  const weeklyPlanItemsRes = await pool.query("SELECT * FROM weekly_plan_items");
  const systemSettingsRes = await pool.query("SELECT * FROM system_settings");

  savePersistedData({
    users: usersRes.rows || [],
    user_profiles: profilesRes.rows || [],
    foods: foodsRes.rows || [],
    meal_logs: mealLogsRes.rows || [],
    meal_entries: mealEntriesRes.rows || [],
    hydration_logs: hydrationLogsRes.rows || [],
    activity_logs: activityLogsRes.rows || [],
    workout_sessions: workoutSessionsRes.rows || [],
    workout_exercises: workoutExercisesRes.rows || [],
    workout_sets: workoutSetsRes.rows || [],
    workout_templates: workoutTemplatesRes.rows || [],
    workout_template_exercises: workoutTemplateExercisesRes.rows || [],
    user_nutrient_targets: userNutrientTargetsRes.rows || [],
    google_sheet_connections: googleSheetConnectionsRes.rows || [],
    ai_conversations: aiConversationsRes.rows || [],
    ai_messages: aiMessagesRes.rows || [],
    ai_memories: aiMemoriesRes.rows || [],
    friendships: friendshipsRes.rows || [],
    user_privacy_settings: privacySettingsRes.rows || [],
    privacy_settings: privacyCategorySettingsRes.rows || [],
    friend_recommendations: recommendationsRes.rows || [],
    notifications: notificationsRes.rows || [],
    user_notification_preferences: userNotificationPreferencesRes.rows || [],
    integration_connections: integrationConnectionsRes.rows || [],
    pre_approved_users: preApprovedUsersRes.rows || [],
    feature_requests: featureRequestsRes.rows || [],
    goals: goalsRes.rows || [],
    goal_milestones: goalMilestonesRes.rows || [],
    achievements: achievementsRes.rows || [],
    user_achievements: userAchievementsRes.rows || [],
    challenges: challengesRes.rows || [],
    challenge_participants: challengeParticipantsRes.rows || [],
    weekly_plans: weeklyPlansRes.rows || [],
    weekly_plan_items: weeklyPlanItemsRes.rows || [],
    system_settings: systemSettingsRes.rows || [],
  });
}

function mapFoodRow(row: any) {
  if (!row) return null;
  const decOrNull = (val: any) => (val !== null && val !== undefined ? new Prisma.Decimal(val) : null);
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    barcode: row.barcode,
    servingSize: new Prisma.Decimal(row.serving_size),
    servingUnit: row.serving_unit,
    calories: new Prisma.Decimal(row.calories || 0),
    protein: new Prisma.Decimal(row.protein || 0),
    carbohydrates: new Prisma.Decimal(row.carbohydrates || 0),
    fat: new Prisma.Decimal(row.fat || 0),
    fiber: new Prisma.Decimal(row.fiber || 0),
    sugar: new Prisma.Decimal(row.sugar || 0),
    // Minerals
    calcium: decOrNull(row.calcium),
    iron: decOrNull(row.iron),
    magnesium: decOrNull(row.magnesium),
    potassium: decOrNull(row.potassium),
    sodium: decOrNull(row.sodium),
    zinc: decOrNull(row.zinc),
    phosphorus: decOrNull(row.phosphorus),
    copper: decOrNull(row.copper),
    manganese: decOrNull(row.manganese),
    selenium: decOrNull(row.selenium),
    // Vitamins
    vitaminA: decOrNull(row.vitamin_a),
    vitaminC: decOrNull(row.vitamin_c),
    vitaminD: decOrNull(row.vitamin_d),
    vitaminE: decOrNull(row.vitamin_e),
    vitaminK: decOrNull(row.vitamin_k),
    vitaminB1: decOrNull(row.vitamin_b1),
    vitaminB2: decOrNull(row.vitamin_b2),
    vitaminB3: decOrNull(row.vitamin_b3),
    vitaminB5: decOrNull(row.vitamin_b5),
    vitaminB6: decOrNull(row.vitamin_b6),
    vitaminB7: decOrNull(row.vitamin_b7),
    vitaminB9: decOrNull(row.vitamin_b9),
    vitaminB12: decOrNull(row.vitamin_b12),
    water: new Prisma.Decimal(row.water || 0),
    notes: row.notes,
    isFavorite: Boolean(row.is_favorite),
    isArchived: Boolean(row.is_archived),
    isSystemFood: Boolean(row.is_system_food),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapUserNutrientTargetRow(row: any) {
  if (!row) return null;
  const dec = (val: any, def: number) => (val !== null && val !== undefined ? new Prisma.Decimal(val) : new Prisma.Decimal(def));
  return {
    id: row.id,
    userId: row.user_id,
    calories: dec(row.calories, 2000),
    protein: dec(row.protein, 120),
    carbohydrates: dec(row.carbohydrates, 250),
    fat: dec(row.fat, 65),
    fiber: dec(row.fiber, 30),
    sugar: dec(row.sugar, 35),
    calcium: dec(row.calcium, 1000),
    iron: dec(row.iron, 18),
    magnesium: dec(row.magnesium, 400),
    potassium: dec(row.potassium, 3400),
    sodium: dec(row.sodium, 2300),
    zinc: dec(row.zinc, 11),
    phosphorus: dec(row.phosphorus, 700),
    copper: dec(row.copper, 0.9),
    manganese: dec(row.manganese, 2.3),
    selenium: dec(row.selenium, 55),
    vitaminA: dec(row.vitamin_a, 900),
    vitaminC: dec(row.vitamin_c, 90),
    vitaminD: dec(row.vitamin_d, 20),
    vitaminE: dec(row.vitamin_e, 15),
    vitaminK: dec(row.vitamin_k, 120),
    vitaminB1: dec(row.vitamin_b1, 1.2),
    vitaminB2: dec(row.vitamin_b2, 1.3),
    vitaminB3: dec(row.vitamin_b3, 16),
    vitaminB5: dec(row.vitamin_b5, 5),
    vitaminB6: dec(row.vitamin_b6, 1.7),
    vitaminB7: dec(row.vitamin_b7, 30),
    vitaminB9: dec(row.vitamin_b9, 400),
    vitaminB12: dec(row.vitamin_b12, 2.4),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapGoogleSheetConnectionRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    spreadsheetId: row.spreadsheet_id,
    spreadsheetUrl: row.spreadsheet_url,
    sheetTitle: row.sheet_title || null,
    status: row.status || "CONNECTED",
    syncStatus: row.sync_status || "IDLE",
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapMealEntryRow(row: any, foodObj?: any) {
  if (!row) return null;
  return {
    id: row.id,
    mealLogId: row.meal_log_id,
    foodId: row.food_id,
    quantity: new Prisma.Decimal(row.quantity),
    quantityUnit: row.quantity_unit,
    calculatedCalories: new Prisma.Decimal(row.calculated_calories || 0),
    calculatedProtein: new Prisma.Decimal(row.calculated_protein || 0),
    calculatedCarbs: new Prisma.Decimal(row.calculated_carbs || 0),
    calculatedFat: new Prisma.Decimal(row.calculated_fat || 0),
    calculatedFiber: new Prisma.Decimal(row.calculated_fiber || 0),
    calculatedSugar: new Prisma.Decimal(row.calculated_sugar || 0),
    food: foodObj || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapMealLogRow(row: any, entries: any[] = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealType: row.meal_type,
    name: row.name,
    entries: entries,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapHydrationLogRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    amountMl: Number(row.amount_ml),
    beverageType: row.beverage_type,
    date: row.date,
    consumedAt: new Date(row.consumed_at),
    notes: row.notes || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapActivityLogRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    activityType: row.activity_type,
    runningType: row.running_type || null,
    source: row.source || "MANUAL",
    externalId: row.external_id || null,
    externalProvider: row.external_provider || null,
    date: row.date,
    distanceKm: new Prisma.Decimal(row.distance_km || 0),
    movingDurationSeconds: Number(row.moving_duration_seconds),
    elapsedDurationSeconds: row.elapsed_duration_seconds ? Number(row.elapsed_duration_seconds) : null,
    averagePaceSecondsPerKm: Number(row.average_pace_seconds_per_km || 0),
    steps: Number(row.steps || 0),
    caloriesBurned: Number(row.calories_burned || 0),
    elevationGainMeters: Number(row.elevation_gain_meters || 0),
    notes: row.notes || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWorkoutSetRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: Number(row.set_number),
    reps: row.reps !== null && row.reps !== undefined ? Number(row.reps) : null,
    weightKg: row.weight_kg !== null && row.weight_kg !== undefined ? new Prisma.Decimal(row.weight_kg) : null,
    durationSeconds: row.duration_seconds !== null && row.duration_seconds !== undefined ? Number(row.duration_seconds) : null,
    distanceKm: row.distance_km !== null && row.distance_km !== undefined ? new Prisma.Decimal(row.distance_km) : null,
    notes: row.notes || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWorkoutExerciseRow(row: any, sets: any[] = []) {
  if (!row) return null;
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    name: row.name,
    category: row.category || null,
    orderIndex: Number(row.order_index || 0),
    notes: row.notes || null,
    sets,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWorkoutSessionRow(row: any, exercises: any[] = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    workoutType: row.workout_type,
    name: row.name,
    date: row.date,
    durationSeconds: Number(row.duration_seconds || 0),
    caloriesBurned: Number(row.calories_burned || 0),
    notes: row.notes || null,
    exercises,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWorkoutTemplateExerciseRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    workoutTemplateId: row.workout_template_id,
    name: row.name,
    category: row.category || null,
    defaultSets: Number(row.default_sets || 3),
    defaultReps: row.default_reps !== null && row.default_reps !== undefined ? Number(row.default_reps) : null,
    defaultWeightKg: row.default_weight_kg !== null && row.default_weight_kg !== undefined ? new Prisma.Decimal(row.default_weight_kg) : null,
    defaultDurationSeconds: row.default_duration_seconds !== null && row.default_duration_seconds !== undefined ? Number(row.default_duration_seconds) : null,
    notes: row.notes || null,
    orderIndex: Number(row.order_index || 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWorkoutTemplateRow(row: any, exercises: any[] = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    workoutType: row.workout_type || "GYM_WORKOUT",
    isFavorite: Boolean(row.is_favorite),
    isArchived: Boolean(row.is_archived),
    exercises,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function initializePostgresSchema() {
  await getPool();
}

// PostgreSQL client wrapper providing full Prisma-compatible API
const postgresDbClient = {
  $queryRaw: async (_strings: any, ..._values: any[]) => {
    const pool = await getPool();
    const res = await pool.query("SELECT 1 as alive");
    return res.rows;
  },
  user: {
    findUnique: async ({ where }: { where: { email?: string; username?: string; id?: string } }) => {
      const pool = await getPool();
      let query = "SELECT * FROM users WHERE ";
      let param = "";
      if (where.email) {
        query += "LOWER(email) = LOWER($1)";
        param = where.email.trim();
      } else if (where.username) {
        query += "LOWER(username) = LOWER($1)";
        param = where.username.trim();
      } else if (where.id) {
        query += "id = $1";
        param = where.id;
      } else {
        return null;
      }

      const res = await pool.query(query, [param]);
      if (!res.rows || res.rows.length === 0) return null;
      const row: any = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role || "USER",
        accountStatus: row.account_status || "PENDING_APPROVAL",
        approvedAt: row.approved_at ? new Date(row.approved_at) : null,
        approvedByAdminId: row.approved_by_admin_id || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const users = await postgresDbClient.user.findMany({ where });
      return users.length > 0 ? users[0] : null;
    },
    findMany: async ({ where, orderBy, take, skip }: { where?: any; orderBy?: any; take?: number; skip?: number } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM users WHERE 1=1";
      const values: any[] = [];
      let idx = 1;
      if (where) {
        if (where.email) {
          query += ` AND LOWER(email) = LOWER($${idx++})`;
          values.push(where.email.trim());
        }
        if (where.id && typeof where.id === "string") {
          query += ` AND id = $${idx++}`;
          values.push(where.id);
        }
        if (where.username && typeof where.username === "string") {
          query += ` AND LOWER(username) = LOWER($${idx++})`;
          values.push(where.username.trim());
        }
        if (where.id?.not) {
          query += ` AND id != $${idx++}`;
          values.push(where.id.not);
        }
        if (where.role) {
          query += ` AND role = $${idx++}`;
          values.push(where.role);
        }
        if (where.accountStatus) {
          query += ` AND account_status = $${idx++}`;
          values.push(where.accountStatus);
        }
        if (where.AND && Array.isArray(where.AND)) {
          for (const andItem of where.AND) {
            if (andItem.id?.not) {
              query += ` AND id != $${idx++}`;
              values.push(andItem.id.not);
            }
            if (andItem.role) {
              query += ` AND role = $${idx++}`;
              values.push(andItem.role);
            }
            if (andItem.accountStatus) {
              query += ` AND account_status = $${idx++}`;
              values.push(andItem.accountStatus);
            }
            if (andItem.OR && Array.isArray(andItem.OR)) {
              const orParts: string[] = [];
              for (const item of andItem.OR) {
                if (item.username?.contains) {
                  orParts.push(`LOWER(username) LIKE $${idx++}`);
                  values.push(`%${item.username.contains.toLowerCase()}%`);
                }
                if (item.name?.contains) {
                  orParts.push(`LOWER(name) LIKE $${idx++}`);
                  values.push(`%${item.name.contains.toLowerCase()}%`);
                }
                if (item.email?.contains) {
                  orParts.push(`LOWER(email) LIKE $${idx++}`);
                  values.push(`%${item.email.contains.toLowerCase()}%`);
                }
              }
              if (orParts.length > 0) {
                query += ` AND (${orParts.join(" OR ")})`;
              }
            }
          }
        } else if (where.OR && Array.isArray(where.OR)) {
          const orParts: string[] = [];
          for (const item of where.OR) {
            if (item.id) {
              orParts.push(`id = $${idx++}`);
              values.push(item.id);
            }
            if (item.username && typeof item.username === "string") {
              orParts.push(`LOWER(username) = $${idx++}`);
              values.push(item.username.toLowerCase());
            } else if (item.username?.contains) {
              orParts.push(`LOWER(username) LIKE $${idx++}`);
              values.push(`%${item.username.contains.toLowerCase()}%`);
            }
            if (item.email && typeof item.email === "string") {
              orParts.push(`LOWER(email) = $${idx++}`);
              values.push(item.email.toLowerCase());
            } else if (item.email?.contains) {
              orParts.push(`LOWER(email) LIKE $${idx++}`);
              values.push(`%${item.email.contains.toLowerCase()}%`);
            }
            if (item.name?.contains) {
              orParts.push(`LOWER(name) LIKE $${idx++}`);
              values.push(`%${item.name.contains.toLowerCase()}%`);
            }
          }
          if (orParts.length > 0) {
            query += ` AND (${orParts.join(" OR ")})`;
          }
        }
      }
      query += " ORDER BY created_at DESC";
      if (take) {
        query += ` LIMIT ${take}`;
      }
      if (skip) {
        query += ` OFFSET ${skip}`;
      }
      const res = await pool.query(query, values);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username,
        passwordHash: row.password_hash,
        role: row.role || "USER",
        accountStatus: row.account_status || "PENDING_APPROVAL",
        approvedAt: row.approved_at ? new Date(row.approved_at) : null,
        approvedByAdminId: row.approved_by_admin_id || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },
    count: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT COUNT(*) as c FROM users WHERE 1=1";
      const params: any[] = [];
      if (where?.role) {
        params.push(where.role);
        query += ` AND role = $${params.length}`;
      }
      if (where?.accountStatus) {
        params.push(where.accountStatus);
        query += ` AND account_status = $${params.length}`;
      }
      const res = await pool.query(query, params);
      return parseInt(res.rows?.[0]?.c || "0", 10);
    },
    create: async ({
      data,
    }: {
      data: {
        id?: string;
        name: string;
        username: string;
        email: string;
        passwordHash: string;
        role?: string;
        accountStatus?: string;
        approvedAt?: Date | null;
        approvedByAdminId?: string | null;
      };
    }) => {
      const pool = await getPool();
      const id = data.id || `cuid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const normalizedEmail = data.email.toLowerCase().trim();
      const rawUsername = data.username || data.email.split("@")[0] || `user_${Date.now()}`;
      const normalizedUsername = rawUsername.toLowerCase().trim();
      const role = data.role || "USER";
      const accountStatus = data.accountStatus || "PENDING_APPROVAL";
      const approvedAt = data.approvedAt ? new Date(data.approvedAt).toISOString() : null;
      const approvedByAdminId = data.approvedByAdminId || null;

      await pool.query(
        `INSERT INTO users (id, name, email, username, password_hash, role, account_status, approved_at, approved_by_admin_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, data.name, normalizedEmail, normalizedUsername, data.passwordHash, role, accountStatus, approvedAt, approvedByAdminId, now, now]
      );

      await syncToDisk();

      return {
        id,
        name: data.name,
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash: data.passwordHash,
        role: role as any,
        accountStatus: accountStatus as any,
        approvedAt: approvedAt ? new Date(approvedAt) : null,
        approvedByAdminId,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const keyCol = where.id ? "id" : "email";
      const keyVal = where.id || where.email?.toLowerCase().trim();

      await pool.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             username = COALESCE($2, username),
             email = COALESCE($3, email),
             role = COALESCE($4, role),
             account_status = COALESCE($5, account_status),
             approved_at = $6,
             approved_by_admin_id = $7,
             updated_at = $8
         WHERE ${keyCol} = $9`,
        [
          data.name || null,
          data.username?.toLowerCase()?.trim() || null,
          data.email?.toLowerCase()?.trim() || null,
          data.role || null,
          data.accountStatus || null,
          data.approvedAt !== undefined ? (data.approvedAt ? new Date(data.approvedAt).toISOString() : null) : null,
          data.approvedByAdminId !== undefined ? data.approvedByAdminId : null,
          now,
          keyVal,
        ]
      );

      await syncToDisk();
      return postgresDbClient.user.findUnique({ where });
    },
    delete: async ({ where }: { where: { id?: string; email?: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.user.findUnique({ where });
      if (!existing) return null;

      const userId = existing.id;
      await pool.query("DELETE FROM user_profiles WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM user_nutrient_targets WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM ai_conversations WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM ai_memories WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM weekly_plans WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM users WHERE 1=1";
      const params: any[] = [];
      if (where?.id) {
        params.push(where.id);
        query += ` AND id = $${params.length}`;
        // Cascade child rows
        await pool.query("DELETE FROM user_profiles WHERE user_id = $1", [where.id]);
        await pool.query("DELETE FROM user_nutrient_targets WHERE user_id = $1", [where.id]);
        await pool.query("DELETE FROM ai_conversations WHERE user_id = $1", [where.id]);
        await pool.query("DELETE FROM ai_memories WHERE user_id = $1", [where.id]);
        await pool.query("DELETE FROM weekly_plans WHERE user_id = $1", [where.id]);
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  userProfile: {
    create: async ({ data }: { data: any }) => {
      return postgresDbClient.userProfile.upsert({
        where: { userId: data.userId },
        create: data,
        update: data,
      });
    },
    findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
      const pool = await getPool();
      let query = "SELECT * FROM user_profiles WHERE ";
      let param = "";
      if (where.userId) {
        query += "user_id = $1";
        param = where.userId;
      } else if (where.id) {
        query += "id = $1";
        param = where.id;
      } else {
        return null;
      }

      const res = await pool.query(query, [param]);
      if (!res.rows || res.rows.length === 0) return null;
      const row: any = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        dateOfBirth: new Date(row.date_of_birth),
        biologicalSex: row.biological_sex,
        heightCm: Number(row.height_cm),
        weightKg: Number(row.weight_kg),
        activityLevel: row.activity_level,
        dailyHydrationTargetMl: Number(row.daily_hydration_target_ml || 2500),
        dailyStepTarget: Number(row.daily_step_target || 10000),
        weeklyRunningDistanceKm: Number(row.weekly_running_distance_km || 15.0),
        weeklyWorkoutSessions: Number(row.weekly_workout_sessions || 3),
        primaryGoal: row.primary_goal || "MAINTAIN",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId: string };
      create: {
        userId: string;
        dateOfBirth: Date;
        biologicalSex: string;
        heightCm: number;
        weightKg: number;
        activityLevel: string;
        dailyHydrationTargetMl?: number;
        dailyStepTarget?: number;
        weeklyRunningDistanceKm?: number;
        weeklyWorkoutSessions?: number;
        primaryGoal?: string;
      };
      update: {
        dateOfBirth?: Date;
        biologicalSex?: string;
        heightCm?: number;
        weightKg?: number;
        activityLevel?: string;
        dailyHydrationTargetMl?: number;
        dailyStepTarget?: number;
        weeklyRunningDistanceKm?: number;
        weeklyWorkoutSessions?: number;
        primaryGoal?: string;
      };
    }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.userProfile.findUnique({ where });
      const now = new Date().toISOString();

      if (existing) {
        const rawDob = update.dateOfBirth ?? existing.dateOfBirth;
        const dob = rawDob instanceof Date ? rawDob.toISOString() : new Date(rawDob || "2000-01-01").toISOString();
        const sex = update.biologicalSex ?? existing.biologicalSex;
        const height = update.heightCm ?? existing.heightCm;
        const weight = update.weightKg ?? existing.weightKg;
        const activity = update.activityLevel ?? existing.activityLevel;
        const targetMl = update.dailyHydrationTargetMl ?? existing.dailyHydrationTargetMl ?? 2500;
        const stepTarget = update.dailyStepTarget ?? existing.dailyStepTarget ?? 10000;
        const runningDist = update.weeklyRunningDistanceKm ?? existing.weeklyRunningDistanceKm ?? 15.0;
        const workoutSess = update.weeklyWorkoutSessions ?? existing.weeklyWorkoutSessions ?? 3;
        const goal = update.primaryGoal ?? existing.primaryGoal ?? "MAINTAIN";

        await pool.query(
          `UPDATE user_profiles
           SET date_of_birth = $1, biological_sex = $2, height_cm = $3, weight_kg = $4, activity_level = $5,
               daily_hydration_target_ml = $6, daily_step_target = $7, weekly_running_distance_km = $8,
               weekly_workout_sessions = $9, primary_goal = $10, updated_at = $11
           WHERE user_id = $12`,
          [dob, sex, height, weight, activity, targetMl, stepTarget, runningDist, workoutSess, goal, now, where.userId]
        );

        await syncToDisk();

        return {
          id: existing.id,
          userId: where.userId,
          dateOfBirth: new Date(dob),
          biologicalSex: sex as any,
          heightCm: height,
          weightKg: weight,
          activityLevel: activity as any,
          dailyHydrationTargetMl: targetMl,
          dailyStepTarget: stepTarget,
          weeklyRunningDistanceKm: runningDist,
          weeklyWorkoutSessions: workoutSess,
          primaryGoal: goal,
          createdAt: existing.createdAt,
          updatedAt: new Date(now),
        };
      } else {
        const id = `cuid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const dob = create.dateOfBirth instanceof Date ? create.dateOfBirth.toISOString() : new Date(create.dateOfBirth || "2000-01-01").toISOString();
        const targetMl = create.dailyHydrationTargetMl || 2500;
        const stepTarget = create.dailyStepTarget || 10000;
        const runningDist = create.weeklyRunningDistanceKm || 15.0;
        const workoutSess = create.weeklyWorkoutSessions || 3;
        const goal = create.primaryGoal || "MAINTAIN";

        await pool.query(
          `INSERT INTO user_profiles (
             id, user_id, date_of_birth, biological_sex, height_cm, weight_kg, activity_level,
             daily_hydration_target_ml, daily_step_target, weekly_running_distance_km, weekly_workout_sessions, primary_goal,
             created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            id,
            create.userId,
            dob,
            create.biologicalSex,
            create.heightCm,
            create.weightKg,
            create.activityLevel,
            targetMl,
            stepTarget,
            runningDist,
            workoutSess,
            goal,
            now,
            now,
          ]
        );

        await syncToDisk();

        return {
          id,
          userId: create.userId,
          dateOfBirth: new Date(dob),
          biologicalSex: create.biologicalSex as any,
          heightCm: create.heightCm,
          weightKg: create.weightKg,
          activityLevel: create.activityLevel as any,
          dailyHydrationTargetMl: targetMl,
          dailyStepTarget: stepTarget,
          weeklyRunningDistanceKm: runningDist,
          weeklyWorkoutSessions: workoutSess,
          primaryGoal: goal,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };
      }
    },
    update: async ({ where, data }: { where: { userId?: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.userProfile.findUnique({ where: { userId: where.userId } });
      if (!existing) throw new Error("Profile not found");

      const now = new Date().toISOString();
      const targetMl = data.dailyHydrationTargetMl !== undefined ? data.dailyHydrationTargetMl : existing.dailyHydrationTargetMl;
      const stepTarget = data.dailyStepTarget !== undefined ? data.dailyStepTarget : existing.dailyStepTarget;
      const runningDist = data.weeklyRunningDistanceKm !== undefined ? data.weeklyRunningDistanceKm : existing.weeklyRunningDistanceKm;
      const workoutSess = data.weeklyWorkoutSessions !== undefined ? data.weeklyWorkoutSessions : existing.weeklyWorkoutSessions;
      const goal = data.primaryGoal !== undefined ? data.primaryGoal : existing.primaryGoal;

      await pool.query(
        `UPDATE user_profiles
         SET daily_hydration_target_ml = COALESCE($1, daily_hydration_target_ml),
             daily_step_target = COALESCE($2, daily_step_target),
             weekly_running_distance_km = COALESCE($3, weekly_running_distance_km),
             weekly_workout_sessions = COALESCE($4, weekly_workout_sessions),
             primary_goal = COALESCE($5, primary_goal),
             updated_at = $6
         WHERE user_id = $7`,
        [targetMl, stepTarget, runningDist, workoutSess, goal, now, where.userId]
      );

      await syncToDisk();

      const updated = await postgresDbClient.userProfile.findUnique({ where: { userId: where.userId } });
      return updated!;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      const res = await pool.query("SELECT COUNT(*) as count FROM user_profiles");
      return Number(res.rows[0]?.count || 0);
    },
  },
  food: {
    findMany: async ({ where }: { where?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM foods WHERE 1=1";
      const params: any[] = [];

      if (where) {
        if (where.OR && Array.isArray(where.OR)) {
          const orClauses: string[] = [];
          for (const orCond of where.OR) {
            if (orCond.userId !== undefined) {
              params.push(orCond.userId);
              orClauses.push(`user_id = $${params.length}`);
            }
            if (orCond.isSystemFood !== undefined) {
              params.push(orCond.isSystemFood);
              orClauses.push(`is_system_food = $${params.length}`);
            }
          }
          if (orClauses.length > 0) {
            query += ` AND (${orClauses.join(" OR ")})`;
          }
        } else if (where.userId !== undefined) {
          params.push(where.userId);
          query += ` AND user_id = $${params.length}`;
        }

        if (where.isArchived !== undefined) {
          params.push(where.isArchived);
          query += ` AND is_archived = $${params.length}`;
        }

        if (where.isFavorite !== undefined) {
          params.push(where.isFavorite);
          query += ` AND is_favorite = $${params.length}`;
        }

        if (where.category !== undefined) {
          params.push(where.category);
          query += ` AND category = $${params.length}`;
        }

        if (where.AND && Array.isArray(where.AND)) {
          for (const andCond of where.AND) {
            if (andCond.OR && Array.isArray(andCond.OR)) {
              const searchOr: string[] = [];
              for (const s of andCond.OR) {
                if (s.name?.contains) {
                  params.push(`%${s.name.contains.toLowerCase()}%`);
                  searchOr.push(`LOWER(name) LIKE $${params.length}`);
                }
                if (s.brand?.contains) {
                  params.push(`%${s.brand.contains.toLowerCase()}%`);
                  searchOr.push(`LOWER(brand) LIKE $${params.length}`);
                }
                if (s.category?.contains) {
                  params.push(`%${s.category.contains.toLowerCase()}%`);
                  searchOr.push(`LOWER(category) LIKE $${params.length}`);
                }
              }
              if (searchOr.length > 0) {
                query += ` AND (${searchOr.join(" OR ")})`;
              }
            }
          }
        }
      }

      query += " ORDER BY is_favorite DESC, created_at DESC";

      const res = await pool.query(query, params);
      return (res.rows || []).map(mapFoodRow);
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM foods WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      return mapFoodRow(res.rows[0]);
    },
    findFirst: async ({ where }: { where: any }) => {
      const foods = await postgresDbClient.food.findMany({ where });
      return foods[0] || null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = `food_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      const numOrNull = (v: any) => (v !== undefined && v !== null ? Number(v) : null);

      await pool.query(
        `INSERT INTO foods (
          id, user_id, name, category, brand, barcode, serving_size, serving_unit,
          calories, protein, carbohydrates, fat, fiber, sugar,
          sodium, calcium, iron, potassium, magnesium, zinc,
          phosphorus, copper, manganese, selenium,
          vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
          vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12,
          water, notes, is_favorite, is_archived, is_system_food, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35, $36, $37,
          $38, $39, $40, $41, $42, $43, $44
        )`,
        [
          id,
          data.userId ?? null,
          data.name.trim(),
          data.category || "OTHER",
          data.brand ?? null,
          data.barcode ?? null,
          Number(data.servingSize),
          data.servingUnit.trim(),
          Number(data.calories || 0),
          Number(data.protein || 0),
          Number(data.carbohydrates || 0),
          Number(data.fat || 0),
          Number(data.fiber || 0),
          Number(data.sugar || 0),
          numOrNull(data.sodium),
          numOrNull(data.calcium),
          numOrNull(data.iron),
          numOrNull(data.potassium),
          numOrNull(data.magnesium),
          numOrNull(data.zinc),
          numOrNull(data.phosphorus),
          numOrNull(data.copper),
          numOrNull(data.manganese),
          numOrNull(data.selenium),
          numOrNull(data.vitaminA),
          numOrNull(data.vitaminC),
          numOrNull(data.vitaminD),
          numOrNull(data.vitaminE),
          numOrNull(data.vitaminK),
          numOrNull(data.vitaminB1),
          numOrNull(data.vitaminB2),
          numOrNull(data.vitaminB3),
          numOrNull(data.vitaminB5),
          numOrNull(data.vitaminB6),
          numOrNull(data.vitaminB7),
          numOrNull(data.vitaminB9),
          numOrNull(data.vitaminB12),
          Number(data.water || 0),
          data.notes ?? null,
          Boolean(data.isFavorite),
          Boolean(data.isArchived),
          Boolean(data.isSystemFood),
          now,
          now,
        ]
      );

      await syncToDisk();

      const created = await postgresDbClient.food.findUnique({ where: { id } });
      return created!;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.food.findUnique({ where });
      if (!existing) throw new Error("Food not found");

      const now = new Date().toISOString();

      await pool.query(
        `UPDATE foods SET
          name = COALESCE($1, name),
          category = COALESCE($2, category),
          brand = COALESCE($3, brand),
          barcode = COALESCE($4, barcode),
          serving_size = COALESCE($5, serving_size),
          serving_unit = COALESCE($6, serving_unit),
          calories = COALESCE($7, calories),
          protein = COALESCE($8, protein),
          carbohydrates = COALESCE($9, carbohydrates),
          fat = COALESCE($10, fat),
          fiber = COALESCE($11, fiber),
          sugar = COALESCE($12, sugar),
          sodium = CASE WHEN $13::boolean THEN $14 ELSE sodium END,
          calcium = CASE WHEN $15::boolean THEN $16 ELSE calcium END,
          iron = CASE WHEN $17::boolean THEN $18 ELSE iron END,
          potassium = CASE WHEN $19::boolean THEN $20 ELSE potassium END,
          magnesium = CASE WHEN $21::boolean THEN $22 ELSE magnesium END,
          zinc = CASE WHEN $23::boolean THEN $24 ELSE zinc END,
          phosphorus = CASE WHEN $25::boolean THEN $26 ELSE phosphorus END,
          copper = CASE WHEN $27::boolean THEN $28 ELSE copper END,
          manganese = CASE WHEN $29::boolean THEN $30 ELSE manganese END,
          selenium = CASE WHEN $31::boolean THEN $32 ELSE selenium END,
          vitamin_a = CASE WHEN $33::boolean THEN $34 ELSE vitamin_a END,
          vitamin_c = CASE WHEN $35::boolean THEN $36 ELSE vitamin_c END,
          vitamin_d = CASE WHEN $37::boolean THEN $38 ELSE vitamin_d END,
          vitamin_e = CASE WHEN $39::boolean THEN $40 ELSE vitamin_e END,
          vitamin_k = CASE WHEN $41::boolean THEN $42 ELSE vitamin_k END,
          vitamin_b1 = CASE WHEN $43::boolean THEN $44 ELSE vitamin_b1 END,
          vitamin_b2 = CASE WHEN $45::boolean THEN $46 ELSE vitamin_b2 END,
          vitamin_b3 = CASE WHEN $47::boolean THEN $48 ELSE vitamin_b3 END,
          vitamin_b5 = CASE WHEN $49::boolean THEN $50 ELSE vitamin_b5 END,
          vitamin_b6 = CASE WHEN $51::boolean THEN $52 ELSE vitamin_b6 END,
          vitamin_b7 = CASE WHEN $53::boolean THEN $54 ELSE vitamin_b7 END,
          vitamin_b9 = CASE WHEN $55::boolean THEN $56 ELSE vitamin_b9 END,
          vitamin_b12 = CASE WHEN $57::boolean THEN $58 ELSE vitamin_b12 END,
          water = COALESCE($59, water),
          notes = COALESCE($60, notes),
          is_favorite = COALESCE($61, is_favorite),
          is_archived = COALESCE($62, is_archived),
          updated_at = $63
        WHERE id = $64`,
        [
          data.name !== undefined ? data.name.trim() : null,
          data.category !== undefined ? data.category : null,
          data.brand !== undefined ? data.brand : null,
          data.barcode !== undefined ? data.barcode : null,
          data.servingSize !== undefined ? Number(data.servingSize) : null,
          data.servingUnit !== undefined ? data.servingUnit.trim() : null,
          data.calories !== undefined ? Number(data.calories) : null,
          data.protein !== undefined ? Number(data.protein) : null,
          data.carbohydrates !== undefined ? Number(data.carbohydrates) : null,
          data.fat !== undefined ? Number(data.fat) : null,
          data.fiber !== undefined ? Number(data.fiber) : null,
          data.sugar !== undefined ? Number(data.sugar) : null,
          data.sodium !== undefined, data.sodium !== undefined && data.sodium !== null ? Number(data.sodium) : null,
          data.calcium !== undefined, data.calcium !== undefined && data.calcium !== null ? Number(data.calcium) : null,
          data.iron !== undefined, data.iron !== undefined && data.iron !== null ? Number(data.iron) : null,
          data.potassium !== undefined, data.potassium !== undefined && data.potassium !== null ? Number(data.potassium) : null,
          data.magnesium !== undefined, data.magnesium !== undefined && data.magnesium !== null ? Number(data.magnesium) : null,
          data.zinc !== undefined, data.zinc !== undefined && data.zinc !== null ? Number(data.zinc) : null,
          data.phosphorus !== undefined, data.phosphorus !== undefined && data.phosphorus !== null ? Number(data.phosphorus) : null,
          data.copper !== undefined, data.copper !== undefined && data.copper !== null ? Number(data.copper) : null,
          data.manganese !== undefined, data.manganese !== undefined && data.manganese !== null ? Number(data.manganese) : null,
          data.selenium !== undefined, data.selenium !== undefined && data.selenium !== null ? Number(data.selenium) : null,
          data.vitaminA !== undefined, data.vitaminA !== undefined && data.vitaminA !== null ? Number(data.vitaminA) : null,
          data.vitaminC !== undefined, data.vitaminC !== undefined && data.vitaminC !== null ? Number(data.vitaminC) : null,
          data.vitaminD !== undefined, data.vitaminD !== undefined && data.vitaminD !== null ? Number(data.vitaminD) : null,
          data.vitaminE !== undefined, data.vitaminE !== undefined && data.vitaminE !== null ? Number(data.vitaminE) : null,
          data.vitaminK !== undefined, data.vitaminK !== undefined && data.vitaminK !== null ? Number(data.vitaminK) : null,
          data.vitaminB1 !== undefined, data.vitaminB1 !== undefined && data.vitaminB1 !== null ? Number(data.vitaminB1) : null,
          data.vitaminB2 !== undefined, data.vitaminB2 !== undefined && data.vitaminB2 !== null ? Number(data.vitaminB2) : null,
          data.vitaminB3 !== undefined, data.vitaminB3 !== undefined && data.vitaminB3 !== null ? Number(data.vitaminB3) : null,
          data.vitaminB5 !== undefined, data.vitaminB5 !== undefined && data.vitaminB5 !== null ? Number(data.vitaminB5) : null,
          data.vitaminB6 !== undefined, data.vitaminB6 !== undefined && data.vitaminB6 !== null ? Number(data.vitaminB6) : null,
          data.vitaminB7 !== undefined, data.vitaminB7 !== undefined && data.vitaminB7 !== null ? Number(data.vitaminB7) : null,
          data.vitaminB9 !== undefined, data.vitaminB9 !== undefined && data.vitaminB9 !== null ? Number(data.vitaminB9) : null,
          data.vitaminB12 !== undefined, data.vitaminB12 !== undefined && data.vitaminB12 !== null ? Number(data.vitaminB12) : null,
          data.water !== undefined ? Number(data.water) : null,
          data.notes !== undefined ? data.notes : null,
          data.isFavorite !== undefined ? Boolean(data.isFavorite) : null,
          data.isArchived !== undefined ? Boolean(data.isArchived) : null,
          now,
          where.id,
        ]
      );

      await syncToDisk();

      const updated = await postgresDbClient.food.findUnique({ where });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.food.findUnique({ where });
      if (!existing) throw new Error("Food not found");

      await pool.query("DELETE FROM foods WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM foods WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
    count: async ({ where }: { where?: any } = {}) => {
      const foods = await postgresDbClient.food.findMany({ where });
      return foods.length;
    },
  },
  userNutrientTarget: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM user_nutrient_targets WHERE user_id = $1", [where.userId]);
      if (!res.rows || res.rows.length === 0) return null;
      return mapUserNutrientTargetRow(res.rows[0]);
    },
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { userId: string };
      update: any;
      create: any;
    }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.userNutrientTarget.findUnique({ where });
      const now = new Date().toISOString();

      if (existing) {
        await pool.query(
          `UPDATE user_nutrient_targets SET
            calories = COALESCE($1, calories),
            protein = COALESCE($2, protein),
            carbohydrates = COALESCE($3, carbohydrates),
            fat = COALESCE($4, fat),
            fiber = COALESCE($5, fiber),
            sugar = COALESCE($6, sugar),
            calcium = COALESCE($7, calcium),
            iron = COALESCE($8, iron),
            magnesium = COALESCE($9, magnesium),
            potassium = COALESCE($10, potassium),
            sodium = COALESCE($11, sodium),
            zinc = COALESCE($12, zinc),
            phosphorus = COALESCE($13, phosphorus),
            copper = COALESCE($14, copper),
            manganese = COALESCE($15, manganese),
            selenium = COALESCE($16, selenium),
            vitamin_a = COALESCE($17, vitamin_a),
            vitamin_c = COALESCE($18, vitamin_c),
            vitamin_d = COALESCE($19, vitamin_d),
            vitamin_e = COALESCE($20, vitamin_e),
            vitamin_k = COALESCE($21, vitamin_k),
            vitamin_b1 = COALESCE($22, vitamin_b1),
            vitamin_b2 = COALESCE($23, vitamin_b2),
            vitamin_b3 = COALESCE($24, vitamin_b3),
            vitamin_b5 = COALESCE($25, vitamin_b5),
            vitamin_b6 = COALESCE($26, vitamin_b6),
            vitamin_b7 = COALESCE($27, vitamin_b7),
            vitamin_b9 = COALESCE($28, vitamin_b9),
            vitamin_b12 = COALESCE($29, vitamin_b12),
            updated_at = $30
          WHERE user_id = $31`,
          [
            update.calories !== undefined ? Number(update.calories) : null,
            update.protein !== undefined ? Number(update.protein) : null,
            update.carbohydrates !== undefined ? Number(update.carbohydrates) : null,
            update.fat !== undefined ? Number(update.fat) : null,
            update.fiber !== undefined ? Number(update.fiber) : null,
            update.sugar !== undefined ? Number(update.sugar) : null,
            update.calcium !== undefined ? Number(update.calcium) : null,
            update.iron !== undefined ? Number(update.iron) : null,
            update.magnesium !== undefined ? Number(update.magnesium) : null,
            update.potassium !== undefined ? Number(update.potassium) : null,
            update.sodium !== undefined ? Number(update.sodium) : null,
            update.zinc !== undefined ? Number(update.zinc) : null,
            update.phosphorus !== undefined ? Number(update.phosphorus) : null,
            update.copper !== undefined ? Number(update.copper) : null,
            update.manganese !== undefined ? Number(update.manganese) : null,
            update.selenium !== undefined ? Number(update.selenium) : null,
            update.vitaminA !== undefined ? Number(update.vitaminA) : null,
            update.vitaminC !== undefined ? Number(update.vitaminC) : null,
            update.vitaminD !== undefined ? Number(update.vitaminD) : null,
            update.vitaminE !== undefined ? Number(update.vitaminE) : null,
            update.vitaminK !== undefined ? Number(update.vitaminK) : null,
            update.vitaminB1 !== undefined ? Number(update.vitaminB1) : null,
            update.vitaminB2 !== undefined ? Number(update.vitaminB2) : null,
            update.vitaminB3 !== undefined ? Number(update.vitaminB3) : null,
            update.vitaminB5 !== undefined ? Number(update.vitaminB5) : null,
            update.vitaminB6 !== undefined ? Number(update.vitaminB6) : null,
            update.vitaminB7 !== undefined ? Number(update.vitaminB7) : null,
            update.vitaminB9 !== undefined ? Number(update.vitaminB9) : null,
            update.vitaminB12 !== undefined ? Number(update.vitaminB12) : null,
            now,
            where.userId,
          ]
        );
      } else {
        const id = `nutarg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await pool.query(
          `INSERT INTO user_nutrient_targets (
            id, user_id, calories, protein, carbohydrates, fat, fiber, sugar,
            calcium, iron, magnesium, potassium, sodium, zinc, phosphorus, copper, manganese, selenium,
            vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k, vitamin_b1, vitamin_b2, vitamin_b3,
            vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26,
            $27, $28, $29, $30, $31, $32, $33
          )`,
          [
            id,
            create.userId,
            create.calories !== undefined ? Number(create.calories) : 2000,
            create.protein !== undefined ? Number(create.protein) : 120,
            create.carbohydrates !== undefined ? Number(create.carbohydrates) : 250,
            create.fat !== undefined ? Number(create.fat) : 65,
            create.fiber !== undefined ? Number(create.fiber) : 30,
            create.sugar !== undefined ? Number(create.sugar) : 35,
            create.calcium !== undefined ? Number(create.calcium) : 1000,
            create.iron !== undefined ? Number(create.iron) : 18,
            create.magnesium !== undefined ? Number(create.magnesium) : 400,
            create.potassium !== undefined ? Number(create.potassium) : 3400,
            create.sodium !== undefined ? Number(create.sodium) : 2300,
            create.zinc !== undefined ? Number(create.zinc) : 11,
            create.phosphorus !== undefined ? Number(create.phosphorus) : 700,
            create.copper !== undefined ? Number(create.copper) : 0.9,
            create.manganese !== undefined ? Number(create.manganese) : 2.3,
            create.selenium !== undefined ? Number(create.selenium) : 55,
            create.vitaminA !== undefined ? Number(create.vitaminA) : 900,
            create.vitaminC !== undefined ? Number(create.vitaminC) : 90,
            create.vitaminD !== undefined ? Number(create.vitaminD) : 20,
            create.vitaminE !== undefined ? Number(create.vitaminE) : 15,
            create.vitaminK !== undefined ? Number(create.vitaminK) : 120,
            create.vitaminB1 !== undefined ? Number(create.vitaminB1) : 1.2,
            create.vitaminB2 !== undefined ? Number(create.vitaminB2) : 1.3,
            create.vitaminB3 !== undefined ? Number(create.vitaminB3) : 16,
            create.vitaminB5 !== undefined ? Number(create.vitaminB5) : 5,
            create.vitaminB6 !== undefined ? Number(create.vitaminB6) : 1.7,
            create.vitaminB7 !== undefined ? Number(create.vitaminB7) : 30,
            create.vitaminB9 !== undefined ? Number(create.vitaminB9) : 400,
            create.vitaminB12 !== undefined ? Number(create.vitaminB12) : 2.4,
            now,
            now,
          ]
        );
      }

      await syncToDisk();
      return (await postgresDbClient.userNutrientTarget.findUnique({ where }))!;
    },
    create: async ({ data }: { data: any }) => {
      return postgresDbClient.userNutrientTarget.upsert({
        where: { userId: data.userId },
        create: data,
        update: data,
      });
    },
  },
  googleSheetConnection: {
    findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
      const pool = await getPool();
      let res;
      if (where.userId) {
        res = await pool.query("SELECT * FROM google_sheet_connections WHERE user_id = $1", [where.userId]);
      } else if (where.id) {
        res = await pool.query("SELECT * FROM google_sheet_connections WHERE id = $1", [where.id]);
      }
      if (!res || !res.rows || res.rows.length === 0) return null;
      return mapGoogleSheetConnectionRow(res.rows[0]);
    },
    findFirst: async ({ where }: { where: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM google_sheet_connections WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.spreadsheetId) {
        params.push(where.spreadsheetId);
        query += ` AND spreadsheet_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      if (!res.rows || res.rows.length === 0) return null;
      return mapGoogleSheetConnectionRow(res.rows[0]);
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = `gsheet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO google_sheet_connections (
          id, user_id, spreadsheet_id, spreadsheet_url, sheet_title, status, sync_status, last_synced_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          data.userId,
          data.spreadsheetId,
          data.spreadsheetUrl,
          data.sheetTitle || null,
          data.status || "CONNECTED",
          data.syncStatus || "IDLE",
          data.lastSyncedAt || null,
          now,
          now,
        ]
      );

      await syncToDisk();
      return (await postgresDbClient.googleSheetConnection.findUnique({ where: { userId: data.userId } }))!;
    },
    update: async ({ where, data }: { where: { userId?: string; id?: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.googleSheetConnection.findUnique({ where });
      if (!existing) throw new Error("Google Sheet Connection not found");

      const now = new Date().toISOString();
      const userId = where.userId || existing.userId;

      await pool.query(
        `UPDATE google_sheet_connections SET
          spreadsheet_id = COALESCE($1, spreadsheet_id),
          spreadsheet_url = COALESCE($2, spreadsheet_url),
          sheet_title = COALESCE($3, sheet_title),
          status = COALESCE($4, status),
          sync_status = COALESCE($5, sync_status),
          last_synced_at = COALESCE($6, last_synced_at),
          updated_at = $7
        WHERE user_id = $8`,
        [
          data.spreadsheetId || null,
          data.spreadsheetUrl || null,
          data.sheetTitle || null,
          data.status || null,
          data.syncStatus || null,
          data.lastSyncedAt || null,
          now,
          userId,
        ]
      );

      await syncToDisk();
      return (await postgresDbClient.googleSheetConnection.findUnique({ where: { userId } }))!;
    },
    delete: async ({ where }: { where: { userId?: string; id?: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.googleSheetConnection.findUnique({ where });
      if (!existing) throw new Error("Google Sheet Connection not found");

      if (where.userId) {
        await pool.query("DELETE FROM google_sheet_connections WHERE user_id = $1", [where.userId]);
      } else if (where.id) {
        await pool.query("DELETE FROM google_sheet_connections WHERE id = $1", [where.id]);
      }

      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any }) => {
      const pool = await getPool();
      if (where?.userId?.in) {
        for (const uid of where.userId.in) {
          await pool.query("DELETE FROM google_sheet_connections WHERE user_id = $1", [uid]);
        }
      } else if (where?.userId) {
        await pool.query("DELETE FROM google_sheet_connections WHERE user_id = $1", [where.userId]);
      } else {
        await pool.query("DELETE FROM google_sheet_connections");
      }
      await syncToDisk();
      return { count: 1 };
    },
    findMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM google_sheet_connections WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      return (res.rows || []).map(mapGoogleSheetConnectionRow);
    },
  },
  mealLog: {
    findMany: async ({ where, include }: { where?: any; include?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM meal_logs WHERE 1=1";
      const params: any[] = [];

      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.date) {
        if (typeof where.date === "string") {
          params.push(where.date);
          query += ` AND date = $${params.length}`;
        } else if (where.date && typeof where.date === "object") {
          if (where.date.in && Array.isArray(where.date.in)) {
            if (where.date.in.length === 0) {
              query += " AND 1=0";
            } else {
              const placeholders = where.date.in
                .map((d: string) => {
                  params.push(d);
                  return `$${params.length}`;
                })
                .join(", ");
              query += ` AND date IN (${placeholders})`;
            }
          }
          if (where.date.gte) {
            params.push(where.date.gte);
            query += ` AND date >= $${params.length}`;
          }
          if (where.date.lte) {
            params.push(where.date.lte);
            query += ` AND date <= $${params.length}`;
          }
        }
      }
      if (where?.mealType) {
        params.push(where.mealType);
        query += ` AND meal_type = $${params.length}`;
      }

      query += " ORDER BY created_at ASC";

      const res = await pool.query(query, params);
      const mealLogs = res.rows || [];

      if (include?.entries) {
        const enriched = [];
        for (const ml of mealLogs) {
          const entriesRes = await pool.query("SELECT * FROM meal_entries WHERE meal_log_id = $1 ORDER BY created_at ASC", [ml.id]);
          const entries = [];
          for (const erow of entriesRes.rows || []) {
            let foodObj = undefined;
            if (include.entries.include?.food) {
              const fRes = await pool.query("SELECT * FROM foods WHERE id = $1", [erow.food_id]);
              if (fRes.rows && fRes.rows.length > 0) {
                foodObj = mapFoodRow(fRes.rows[0]);
              }
            }
            entries.push(mapMealEntryRow(erow, foodObj));
          }
          enriched.push(mapMealLogRow(ml, entries));
        }
        return enriched;
      }

      return mealLogs.map((ml: any) => mapMealLogRow(ml));
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM meal_logs WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const ml = res.rows[0];

      if (include?.entries) {
        const entriesRes = await pool.query("SELECT * FROM meal_entries WHERE meal_log_id = $1 ORDER BY created_at ASC", [ml.id]);
        const entries = [];
        for (const erow of entriesRes.rows || []) {
          let foodObj = undefined;
          if (include.entries.include?.food) {
            const fRes = await pool.query("SELECT * FROM foods WHERE id = $1", [erow.food_id]);
            if (fRes.rows && fRes.rows.length > 0) {
              foodObj = mapFoodRow(fRes.rows[0]);
            }
          }
          entries.push(mapMealEntryRow(erow, foodObj));
        }
        return mapMealLogRow(ml, entries);
      }

      return mapMealLogRow(ml);
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const logs = await postgresDbClient.mealLog.findMany({ where, include });
      return logs[0] || null;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const logs = await postgresDbClient.mealLog.findMany({ where });
      return logs.length;
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const pool = await getPool();
      const id = `meallog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO meal_logs (id, user_id, date, meal_type, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, data.userId, data.date, data.mealType, data.name || null, now, now]
      );

      if (data.entries?.create && Array.isArray(data.entries.create)) {
        for (const entryData of data.entries.create) {
          const entryId = `mealentry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          await pool.query(
            `INSERT INTO meal_entries (id, meal_log_id, food_id, quantity, quantity_unit, calculated_calories, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber, calculated_sugar, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              entryId,
              id,
              entryData.foodId,
              Number(entryData.quantity),
              entryData.quantityUnit || entryData.unit || "g",
              Number(entryData.calculatedCalories || 0),
              Number(entryData.calculatedProtein || 0),
              Number(entryData.calculatedCarbs || 0),
              Number(entryData.calculatedFat || 0),
              Number(entryData.calculatedFiber || 0),
              Number(entryData.calculatedSugar || 0),
              now,
              now,
            ]
          );
        }
      }

      await syncToDisk();

      const created = await postgresDbClient.mealLog.findUnique({ where: { id }, include });
      return created!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.mealLog.findUnique({ where });
      if (!existing) throw new Error("Meal log not found");

      await pool.query("DELETE FROM meal_entries WHERE meal_log_id = $1", [where.id]);
      await pool.query("DELETE FROM meal_logs WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM meal_logs WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  mealEntry: {
    findMany: async ({ where, include }: { where?: any; include?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM meal_entries WHERE 1=1";
      const params: any[] = [];

      if (where?.mealLogId) {
        params.push(where.mealLogId);
        query += ` AND meal_log_id = $${params.length}`;
      }
      if (where?.foodId) {
        params.push(where.foodId);
        query += ` AND food_id = $${params.length}`;
      }

      query += " ORDER BY created_at ASC";

      const res = await pool.query(query, params);
      const entries = res.rows || [];

      const mapped = [];
      for (const row of entries) {
        let foodObj = undefined;
        if (include?.food) {
          const fRes = await pool.query("SELECT * FROM foods WHERE id = $1", [row.food_id]);
          if (fRes.rows && fRes.rows.length > 0) {
            foodObj = mapFoodRow(fRes.rows[0]);
          }
        }
        mapped.push(mapMealEntryRow(row, foodObj));
      }
      return mapped;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM meal_entries WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];

      let foodObj = undefined;
      let mealLogObj = undefined;

      if (include?.food) {
        const fRes = await pool.query("SELECT * FROM foods WHERE id = $1", [row.food_id]);
        if (fRes.rows && fRes.rows.length > 0) {
          foodObj = mapFoodRow(fRes.rows[0]);
        }
      }

      if (include?.mealLog) {
        const mlRes = await pool.query("SELECT * FROM meal_logs WHERE id = $1", [row.meal_log_id]);
        if (mlRes.rows && mlRes.rows.length > 0) {
          mealLogObj = mapMealLogRow(mlRes.rows[0]);
        }
      }

      const entry = mapMealEntryRow(row, foodObj);
      return {
        ...entry,
        mealLog: mealLogObj,
      };
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const entries = await postgresDbClient.mealEntry.findMany({ where, include });
      return entries[0] || null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO meal_entries (
          id, meal_log_id, food_id, quantity, quantity_unit,
          calculated_calories, calculated_protein, calculated_carbs, calculated_fat, calculated_fiber, calculated_sugar,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          data.mealLogId,
          data.foodId,
          Number(data.quantity),
          data.quantityUnit.trim(),
          Number(data.calculatedCalories || 0),
          Number(data.calculatedProtein || 0),
          Number(data.calculatedCarbs || 0),
          Number(data.calculatedFat || 0),
          Number(data.calculatedFiber || 0),
          Number(data.calculatedSugar || 0),
          now,
          now,
        ]
      );

      await syncToDisk();

      const created = await postgresDbClient.mealEntry.findUnique({
        where: { id },
        include: { food: true },
      });
      return created!;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.mealEntry.findUnique({ where });
      if (!existing) throw new Error("Meal entry not found");

      const now = new Date().toISOString();

      await pool.query(
        `UPDATE meal_entries SET
          meal_log_id = COALESCE($1, meal_log_id),
          quantity = COALESCE($2, quantity),
          quantity_unit = COALESCE($3, quantity_unit),
          calculated_calories = COALESCE($4, calculated_calories),
          calculated_protein = COALESCE($5, calculated_protein),
          calculated_carbs = COALESCE($6, calculated_carbs),
          calculated_fat = COALESCE($7, calculated_fat),
          calculated_fiber = COALESCE($8, calculated_fiber),
          calculated_sugar = COALESCE($9, calculated_sugar),
          updated_at = $10
        WHERE id = $11`,
        [
          data.mealLogId !== undefined ? data.mealLogId : null,
          data.quantity !== undefined ? Number(data.quantity) : null,
          data.quantityUnit !== undefined ? data.quantityUnit.trim() : null,
          data.calculatedCalories !== undefined ? Number(data.calculatedCalories) : null,
          data.calculatedProtein !== undefined ? Number(data.calculatedProtein) : null,
          data.calculatedCarbs !== undefined ? Number(data.calculatedCarbs) : null,
          data.calculatedFat !== undefined ? Number(data.calculatedFat) : null,
          data.calculatedFiber !== undefined ? Number(data.calculatedFiber) : null,
          data.calculatedSugar !== undefined ? Number(data.calculatedSugar) : null,
          now,
          where.id,
        ]
      );

      await syncToDisk();

      const updated = await postgresDbClient.mealEntry.findUnique({
        where,
        include: { food: true },
      });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.mealEntry.findUnique({ where });
      if (!existing) throw new Error("Meal entry not found");

      await pool.query("DELETE FROM meal_entries WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
  },
  hydrationLog: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM hydration_logs WHERE 1=1";
      const params: any[] = [];

      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.date) {
        if (typeof where.date === "string") {
          params.push(where.date);
          query += ` AND date = $${params.length}`;
        } else if (where.date && typeof where.date === "object") {
          if (where.date.in && Array.isArray(where.date.in)) {
            if (where.date.in.length === 0) {
              query += " AND 1=0";
            } else {
              const placeholders = where.date.in
                .map((d: string) => {
                  params.push(d);
                  return `$${params.length}`;
                })
                .join(", ");
              query += ` AND date IN (${placeholders})`;
            }
          }
          if (where.date.gte) {
            params.push(where.date.gte);
            query += ` AND date >= $${params.length}`;
          }
          if (where.date.lte) {
            params.push(where.date.lte);
            query += ` AND date <= $${params.length}`;
          }
        }
      }

      query += " ORDER BY consumed_at ASC, created_at ASC";

      const res = await pool.query(query, params);
      return (res.rows || []).map(mapHydrationLogRow);
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM hydration_logs WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      return mapHydrationLogRow(res.rows[0]);
    },
    findFirst: async ({ where }: { where: any }) => {
      const logs = await postgresDbClient.hydrationLog.findMany({ where });
      return logs[0] || null;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const logs = await postgresDbClient.hydrationLog.findMany({ where });
      return logs.length;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = `hydra_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const consumed = data.consumedAt ? new Date(data.consumedAt).toISOString() : now;

      await pool.query(
        `INSERT INTO hydration_logs (id, user_id, amount_ml, beverage_type, date, consumed_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          data.userId,
          Number(data.amountMl),
          data.beverageType || "WATER",
          data.date,
          consumed,
          data.notes || null,
          now,
          now,
        ]
      );

      await syncToDisk();

      const created = await postgresDbClient.hydrationLog.findUnique({ where: { id } });
      return created!;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.hydrationLog.findUnique({ where });
      if (!existing) throw new Error("Hydration log not found");

      const now = new Date().toISOString();
      const consumed = data.consumedAt ? new Date(data.consumedAt).toISOString() : null;

      await pool.query(
        `UPDATE hydration_logs SET
          amount_ml = COALESCE($1, amount_ml),
          beverage_type = COALESCE($2, beverage_type),
          date = COALESCE($3, date),
          consumed_at = COALESCE($4, consumed_at),
          notes = COALESCE($5, notes),
          updated_at = $6
        WHERE id = $7`,
        [
          data.amountMl !== undefined ? Number(data.amountMl) : null,
          data.beverageType !== undefined ? data.beverageType : null,
          data.date !== undefined ? data.date : null,
          consumed,
          data.notes !== undefined ? data.notes : null,
          now,
          where.id,
        ]
      );

      await syncToDisk();

      const updated = await postgresDbClient.hydrationLog.findUnique({ where });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.hydrationLog.findUnique({ where });
      if (!existing) throw new Error("Hydration log not found");

      await pool.query("DELETE FROM hydration_logs WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM hydration_logs WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  activityLog: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM activity_logs WHERE 1=1";
      const params: any[] = [];

      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.date) {
        if (typeof where.date === "string") {
          params.push(where.date);
          query += ` AND date = $${params.length}`;
        } else if (where.date && typeof where.date === "object") {
          if (where.date.in && Array.isArray(where.date.in)) {
            if (where.date.in.length === 0) {
              query += " AND 1=0";
            } else {
              const placeholders = where.date.in
                .map((d: string) => {
                  params.push(d);
                  return `$${params.length}`;
                })
                .join(", ");
              query += ` AND date IN (${placeholders})`;
            }
          }
          if (where.date.gte) {
            params.push(where.date.gte);
            query += ` AND date >= $${params.length}`;
          }
          if (where.date.lte) {
            params.push(where.date.lte);
            query += ` AND date <= $${params.length}`;
          }
        }
      }
      if (where?.activityType) {
        params.push(where.activityType);
        query += ` AND activity_type = $${params.length}`;
      }
      if (where?.source) {
        params.push(where.source);
        query += ` AND source = $${params.length}`;
      }
      if (where?.externalId) {
        params.push(where.externalId);
        query += ` AND external_id = $${params.length}`;
      }
      if (where?.externalProvider) {
        params.push(where.externalProvider);
        query += ` AND external_provider = $${params.length}`;
      }

      query += " ORDER BY created_at DESC";

      const res = await pool.query(query, params);
      return (res.rows || []).map(mapActivityLogRow);
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM activity_logs WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      return mapActivityLogRow(res.rows[0]);
    },
    findFirst: async ({ where }: { where: any }) => {
      const logs = await postgresDbClient.activityLog.findMany({ where });
      return logs[0] || null;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const logs = await postgresDbClient.activityLog.findMany({ where });
      return logs.length;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO activity_logs (
          id, user_id, activity_type, running_type, source, external_id, external_provider,
          date, distance_km, moving_duration_seconds,
          elapsed_duration_seconds, average_pace_seconds_per_km, steps,
          calories_burned, elevation_gain_meters, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          id,
          data.userId,
          data.activityType || "RUN",
          data.runningType || null,
          data.source || "MANUAL",
          data.externalId || null,
          data.externalProvider || null,
          data.date,
          Number(data.distanceKm || 0),
          data.movingDurationSeconds !== undefined && data.movingDurationSeconds !== null
            ? Number(data.movingDurationSeconds)
            : data.durationMinutes !== undefined && data.durationMinutes !== null
            ? Number(data.durationMinutes) * 60
            : 0,
          data.elapsedDurationSeconds !== undefined && data.elapsedDurationSeconds !== null ? Number(data.elapsedDurationSeconds) : null,
          Number(data.averagePaceSecondsPerKm || data.avgPaceSeconds || 0),
          Number(data.steps || 0),
          Number(data.caloriesBurned || 0),
          Number(data.elevationGainMeters || 0),
          data.notes || null,
          now,
          now,
        ]
      );

      await syncToDisk();

      const created = await postgresDbClient.activityLog.findUnique({ where: { id } });
      return created!;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.activityLog.findUnique({ where });
      if (!existing) throw new Error("Activity log not found");

      const now = new Date().toISOString();

      await pool.query(
        `UPDATE activity_logs SET
          activity_type = COALESCE($1, activity_type),
          running_type = COALESCE($2, running_type),
          date = COALESCE($3, date),
          distance_km = COALESCE($4, distance_km),
          moving_duration_seconds = COALESCE($5, moving_duration_seconds),
          elapsed_duration_seconds = COALESCE($6, elapsed_duration_seconds),
          average_pace_seconds_per_km = COALESCE($7, average_pace_seconds_per_km),
          steps = COALESCE($8, steps),
          calories_burned = COALESCE($9, calories_burned),
          elevation_gain_meters = COALESCE($10, elevation_gain_meters),
          notes = COALESCE($11, notes),
          updated_at = $12
        WHERE id = $13`,
        [
          data.activityType !== undefined ? data.activityType : null,
          data.runningType !== undefined ? data.runningType : null,
          data.date !== undefined ? data.date : null,
          data.distanceKm !== undefined ? Number(data.distanceKm) : null,
          data.movingDurationSeconds !== undefined ? Number(data.movingDurationSeconds) : null,
          data.elapsedDurationSeconds !== undefined ? Number(data.elapsedDurationSeconds) : null,
          data.averagePaceSecondsPerKm !== undefined ? Number(data.averagePaceSecondsPerKm) : null,
          data.steps !== undefined ? Number(data.steps) : null,
          data.caloriesBurned !== undefined ? Number(data.caloriesBurned) : null,
          data.elevationGainMeters !== undefined ? Number(data.elevationGainMeters) : null,
          data.notes !== undefined ? data.notes : null,
          now,
          where.id,
        ]
      );

      await syncToDisk();

      const updated = await postgresDbClient.activityLog.findUnique({ where });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.activityLog.findUnique({ where });
      if (!existing) throw new Error("Activity log not found");

      await pool.query("DELETE FROM activity_logs WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM activity_logs WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  workoutSession: {
    findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM workout_sessions WHERE 1=1";
      const params: any[] = [];

      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.date) {
        if (typeof where.date === "string") {
          params.push(where.date);
          query += ` AND date = $${params.length}`;
        } else if (where.date && typeof where.date === "object") {
          if (where.date.in && Array.isArray(where.date.in)) {
            if (where.date.in.length === 0) {
              query += " AND 1=0";
            } else {
              const placeholders = where.date.in
                .map((d: string) => {
                  params.push(d);
                  return `$${params.length}`;
                })
                .join(", ");
              query += ` AND date IN (${placeholders})`;
            }
          }
          if (where.date.gte) {
            params.push(where.date.gte);
            query += ` AND date >= $${params.length}`;
          }
          if (where.date.lte) {
            params.push(where.date.lte);
            query += ` AND date <= $${params.length}`;
          }
        }
      }
      if (where?.workoutType) {
        params.push(where.workoutType);
        query += ` AND workout_type = $${params.length}`;
      }

      query += " ORDER BY created_at DESC";

      const res = await pool.query(query, params);
      const sessions = res.rows || [];

      if (include?.exercises) {
        const enriched = [];
        for (const s of sessions) {
          const exRes = await pool.query(
            "SELECT * FROM workout_exercises WHERE workout_session_id = $1 ORDER BY order_index ASC, created_at ASC",
            [s.id]
          );
          const exercises = [];
          for (const exRow of exRes.rows || []) {
            let sets: any[] = [];
            if (include.exercises?.include?.sets || include.exercises === true) {
              const setRes = await pool.query(
                "SELECT * FROM workout_sets WHERE workout_exercise_id = $1 ORDER BY set_number ASC",
                [exRow.id]
              );
              sets = (setRes.rows || []).map(mapWorkoutSetRow);
            }
            exercises.push(mapWorkoutExerciseRow(exRow, sets));
          }
          enriched.push(mapWorkoutSessionRow(s, exercises));
        }
        return enriched;
      }

      return sessions.map((s: any) => mapWorkoutSessionRow(s));
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM workout_sessions WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const s = res.rows[0];

      if (include?.exercises) {
        const exRes = await pool.query(
          "SELECT * FROM workout_exercises WHERE workout_session_id = $1 ORDER BY order_index ASC, created_at ASC",
          [s.id]
        );
        const exercises = [];
        for (const exRow of exRes.rows || []) {
          let sets: any[] = [];
          if (include.exercises?.include?.sets || include.exercises === true) {
            const setRes = await pool.query(
              "SELECT * FROM workout_sets WHERE workout_exercise_id = $1 ORDER BY set_number ASC",
              [exRow.id]
            );
            sets = (setRes.rows || []).map(mapWorkoutSetRow);
          }
          exercises.push(mapWorkoutExerciseRow(exRow, sets));
        }
        return mapWorkoutSessionRow(s, exercises);
      }

      return mapWorkoutSessionRow(s);
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const list = await postgresDbClient.workoutSession.findMany({ where, include });
      return list[0] || null;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const logs = await postgresDbClient.workoutSession.findMany({ where });
      return logs.length;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const sessionId = `wksess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO workout_sessions (id, user_id, workout_type, name, date, duration_seconds, calories_burned, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          sessionId,
          data.userId,
          data.workoutType || "GYM_WORKOUT",
          data.name.trim(),
          data.date,
          Number(data.durationSeconds || 0),
          Number(data.caloriesBurned || 0),
          data.notes || null,
          now,
          now,
        ]
      );

      // Handle nested exercises if provided
      if (data.exercises?.create && Array.isArray(data.exercises.create)) {
        for (let i = 0; i < data.exercises.create.length; i++) {
          const ex = data.exercises.create[i];
          const exId = `wkex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`;

          await pool.query(
            `INSERT INTO workout_exercises (id, workout_session_id, name, category, order_index, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [exId, sessionId, ex.name.trim(), ex.category || null, ex.orderIndex ?? i, ex.notes || null, now, now]
          );

          if (ex.sets?.create && Array.isArray(ex.sets.create)) {
            for (let j = 0; j < ex.sets.create.length; j++) {
              const st = ex.sets.create[j];
              const setId = `wkset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${j}`;

              await pool.query(
                `INSERT INTO workout_sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_km, notes, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  setId,
                  exId,
                  st.setNumber ?? j + 1,
                  st.reps !== undefined && st.reps !== null ? Number(st.reps) : null,
                  st.weightKg !== undefined && st.weightKg !== null ? Number(st.weightKg) : null,
                  st.durationSeconds !== undefined && st.durationSeconds !== null ? Number(st.durationSeconds) : null,
                  st.distanceKm !== undefined && st.distanceKm !== null ? Number(st.distanceKm) : null,
                  st.notes || null,
                  now,
                  now,
                ]
              );
            }
          }
        }
      }

      await syncToDisk();

      const created = await postgresDbClient.workoutSession.findUnique({
        where: { id: sessionId },
        include: { exercises: { include: { sets: true } } },
      });
      return created!;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.workoutSession.findUnique({ where });
      if (!existing) throw new Error("Workout session not found");

      const now = new Date().toISOString();

      await pool.query(
        `UPDATE workout_sessions SET
          workout_type = COALESCE($1, workout_type),
          name = COALESCE($2, name),
          date = COALESCE($3, date),
          duration_seconds = COALESCE($4, duration_seconds),
          calories_burned = COALESCE($5, calories_burned),
          notes = COALESCE($6, notes),
          updated_at = $7
        WHERE id = $8`,
        [
          data.workoutType !== undefined ? data.workoutType : null,
          data.name !== undefined ? data.name.trim() : null,
          data.date !== undefined ? data.date : null,
          data.durationSeconds !== undefined ? Number(data.durationSeconds) : null,
          data.caloriesBurned !== undefined ? Number(data.caloriesBurned) : null,
          data.notes !== undefined ? data.notes : null,
          now,
          where.id,
        ]
      );

      await syncToDisk();

      const updated = await postgresDbClient.workoutSession.findUnique({
        where,
        include: { exercises: { include: { sets: true } } },
      });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.workoutSession.findUnique({ where });
      if (!existing) throw new Error("Workout session not found");

      // Cascading delete
      const exercisesRes = await pool.query("SELECT id FROM workout_exercises WHERE workout_session_id = $1", [where.id]);
      for (const ex of exercisesRes.rows || []) {
        await pool.query("DELETE FROM workout_sets WHERE workout_exercise_id = $1", [ex.id]);
      }
      await pool.query("DELETE FROM workout_exercises WHERE workout_session_id = $1", [where.id]);
      await pool.query("DELETE FROM workout_sessions WHERE id = $1", [where.id]);

      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM workout_sessions WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  workoutExercise: {
    findMany: async ({ where, include }: { where?: any; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM workout_exercises WHERE 1=1";
      const params: any[] = [];
      if (where?.sessionId) {
        params.push(where.sessionId);
        query += ` AND workout_session_id = $${params.length}`;
      }
      if (where?.workoutSessionId) {
        params.push(where.workoutSessionId);
        query += ` AND workout_session_id = $${params.length}`;
      }
      query += " ORDER BY order_index ASC";
      const res = await pool.query(query, params);
      const items = (res.rows || []).map((r: any) => ({
        id: r.id,
        workoutSessionId: r.workout_session_id,
        name: r.name,
        category: r.category,
        orderIndex: Number(r.order_index),
        notes: r.notes,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      if (include?.sets) {
        for (const ex of items) {
          (ex as any).sets = await postgresDbClient.workoutSet.findMany({
            where: { workoutExerciseId: ex.id },
          });
        }
      }
      return items;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const exId = `wkex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO workout_exercises (id, workout_session_id, name, category, order_index, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [exId, data.workoutSessionId, data.name.trim(), data.category || null, data.orderIndex || 0, data.notes || null, now, now]
      );

      await syncToDisk();
      return { id: exId, ...data, createdAt: new Date(now), updatedAt: new Date(now) };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      await pool.query("DELETE FROM workout_sets WHERE workout_exercise_id = $1", [where.id]);
      await pool.query("DELETE FROM workout_exercises WHERE id = $1", [where.id]);
      await syncToDisk();
      return { id: where.id };
    },
  },
  workoutSet: {
    findMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM workout_sets WHERE 1=1";
      const params: any[] = [];
      if (where?.workoutExerciseId) {
        params.push(where.workoutExerciseId);
        query += ` AND workout_exercise_id = $${params.length}`;
      }
      query += " ORDER BY set_number ASC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        workoutExerciseId: r.workout_exercise_id,
        setNumber: Number(r.set_number),
        reps: r.reps !== null ? Number(r.reps) : null,
        weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
        durationSeconds: r.duration_seconds !== null ? Number(r.duration_seconds) : null,
        distanceKm: r.distance_km !== null ? Number(r.distance_km) : null,
        notes: r.notes,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const setId = `wkset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO workout_sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_km, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          setId,
          data.workoutExerciseId,
          Number(data.setNumber || 1),
          data.reps !== undefined && data.reps !== null ? Number(data.reps) : null,
          data.weightKg !== undefined && data.weightKg !== null ? Number(data.weightKg) : null,
          data.durationSeconds !== undefined && data.durationSeconds !== null ? Number(data.durationSeconds) : null,
          data.distanceKm !== undefined && data.distanceKm !== null ? Number(data.distanceKm) : null,
          data.notes || null,
          now,
          now,
        ]
      );

      await syncToDisk();
      return { id: setId, ...data, createdAt: new Date(now), updatedAt: new Date(now) };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      await pool.query("DELETE FROM workout_sets WHERE id = $1", [where.id]);
      await syncToDisk();
      return { id: where.id };
    },
  },
  workoutTemplate: {
    findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM workout_templates WHERE 1=1";
      const params: any[] = [];

      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.workoutType) {
        params.push(where.workoutType);
        query += ` AND workout_type = $${params.length}`;
      }
      if (where?.isFavorite !== undefined) {
        params.push(Boolean(where.isFavorite));
        query += ` AND is_favorite = $${params.length}`;
      }
      if (where?.isArchived !== undefined) {
        params.push(Boolean(where.isArchived));
        query += ` AND is_archived = $${params.length}`;
      }
      if (where?.name && typeof where.name === "object" && where.name.contains) {
        params.push(`%${where.name.contains.toLowerCase()}%`);
        query += ` AND LOWER(name) LIKE $${params.length}`;
      }

      query += " ORDER BY is_favorite DESC, updated_at DESC";

      const res = await pool.query(query, params);
      const rows = res.rows || [];

      if (include?.exercises) {
        const enriched = [];
        for (const r of rows) {
          const exRes = await pool.query(
            "SELECT * FROM workout_template_exercises WHERE workout_template_id = $1 ORDER BY order_index ASC, created_at ASC",
            [r.id]
          );
          const exercises = (exRes.rows || []).map(mapWorkoutTemplateExerciseRow);
          enriched.push(mapWorkoutTemplateRow(r, exercises));
        }
        return enriched;
      }

      return rows.map((r: any) => mapWorkoutTemplateRow(r));
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM workout_templates WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];

      if (include?.exercises) {
        const exRes = await pool.query(
          "SELECT * FROM workout_template_exercises WHERE workout_template_id = $1 ORDER BY order_index ASC, created_at ASC",
          [row.id]
        );
        const exercises = (exRes.rows || []).map(mapWorkoutTemplateExerciseRow);
        return mapWorkoutTemplateRow(row, exercises);
      }

      return mapWorkoutTemplateRow(row);
    },
    findFirst: async ({ where, include }: { where: any; include?: any }) => {
      const templates = await postgresDbClient.workoutTemplate.findMany({ where, include });
      return templates[0] || null;
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const pool = await getPool();
      const templateId = `wktpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO workout_templates (id, user_id, name, description, workout_type, is_favorite, is_archived, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          templateId,
          data.userId,
          data.name.trim(),
          data.description ? data.description.trim() : null,
          data.workoutType || "GYM_WORKOUT",
          Boolean(data.isFavorite),
          Boolean(data.isArchived),
          now,
          now,
        ]
      );

      if (data.exercises?.create) {
        for (let i = 0; i < data.exercises.create.length; i++) {
          const ex = data.exercises.create[i];
          const exId = `wktplex_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
          await pool.query(
            `INSERT INTO workout_template_exercises (
              id, workout_template_id, name, category, default_sets, default_reps,
              default_weight_kg, default_duration_seconds, notes, order_index, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              exId,
              templateId,
              ex.name.trim(),
              ex.category ? ex.category.trim() : null,
              ex.defaultSets !== undefined ? Number(ex.defaultSets) : 3,
              ex.defaultReps !== undefined && ex.defaultReps !== null ? Number(ex.defaultReps) : null,
              ex.defaultWeightKg !== undefined && ex.defaultWeightKg !== null ? Number(ex.defaultWeightKg) : null,
              ex.defaultDurationSeconds !== undefined && ex.defaultDurationSeconds !== null ? Number(ex.defaultDurationSeconds) : null,
              ex.notes ? ex.notes.trim() : null,
              ex.orderIndex !== undefined ? Number(ex.orderIndex) : i,
              now,
              now,
            ]
          );
        }
      }

      await syncToDisk();

      const created = await postgresDbClient.workoutTemplate.findUnique({
        where: { id: templateId },
        include: { exercises: true },
      });
      return created!;
    },
    update: async ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.workoutTemplate.findUnique({ where });
      if (!existing) throw new Error("Workout template not found");

      const now = new Date().toISOString();

      await pool.query(
        `UPDATE workout_templates SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          workout_type = COALESCE($3, workout_type),
          is_favorite = COALESCE($4, is_favorite),
          is_archived = COALESCE($5, is_archived),
          updated_at = $6
        WHERE id = $7`,
        [
          data.name !== undefined ? data.name.trim() : null,
          data.description !== undefined ? (data.description ? data.description.trim() : null) : null,
          data.workoutType !== undefined ? data.workoutType : null,
          data.isFavorite !== undefined ? Boolean(data.isFavorite) : null,
          data.isArchived !== undefined ? Boolean(data.isArchived) : null,
          now,
          where.id,
        ]
      );

      if (data.exercises?.deleteMany) {
        await pool.query("DELETE FROM workout_template_exercises WHERE workout_template_id = $1", [where.id]);
      }

      if (data.exercises?.create) {
        for (let i = 0; i < data.exercises.create.length; i++) {
          const ex = data.exercises.create[i];
          const exId = `wktplex_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
          await pool.query(
            `INSERT INTO workout_template_exercises (
              id, workout_template_id, name, category, default_sets, default_reps,
              default_weight_kg, default_duration_seconds, notes, order_index, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              exId,
              where.id,
              ex.name.trim(),
              ex.category ? ex.category.trim() : null,
              ex.defaultSets !== undefined ? Number(ex.defaultSets) : 3,
              ex.defaultReps !== undefined && ex.defaultReps !== null ? Number(ex.defaultReps) : null,
              ex.defaultWeightKg !== undefined && ex.defaultWeightKg !== null ? Number(ex.defaultWeightKg) : null,
              ex.defaultDurationSeconds !== undefined && ex.defaultDurationSeconds !== null ? Number(ex.defaultDurationSeconds) : null,
              ex.notes ? ex.notes.trim() : null,
              ex.orderIndex !== undefined ? Number(ex.orderIndex) : i,
              now,
              now,
            ]
          );
        }
      }

      await syncToDisk();

      const updated = await postgresDbClient.workoutTemplate.findUnique({
        where,
        include: { exercises: true },
      });
      return updated!;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.workoutTemplate.findUnique({ where });
      if (!existing) throw new Error("Workout template not found");

      await pool.query("DELETE FROM workout_template_exercises WHERE workout_template_id = $1", [where.id]);
      await pool.query("DELETE FROM workout_templates WHERE id = $1", [where.id]);

      await syncToDisk();
      return existing;
    },
  },
  workoutTemplateExercise: {
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const exId = `wktplex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO workout_template_exercises (
          id, workout_template_id, name, category, default_sets, default_reps,
          default_weight_kg, default_duration_seconds, notes, order_index, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          exId,
          data.workoutTemplateId,
          data.name.trim(),
          data.category ? data.category.trim() : null,
          data.defaultSets !== undefined ? Number(data.defaultSets) : 3,
          data.defaultReps !== undefined && data.defaultReps !== null ? Number(data.defaultReps) : null,
          data.defaultWeightKg !== undefined && data.defaultWeightKg !== null ? Number(data.defaultWeightKg) : null,
          data.defaultDurationSeconds !== undefined && data.defaultDurationSeconds !== null ? Number(data.defaultDurationSeconds) : null,
          data.notes ? data.notes.trim() : null,
          data.orderIndex !== undefined ? Number(data.orderIndex) : 0,
          now,
          now,
        ]
      );

      await syncToDisk();
      return { id: exId, ...data, createdAt: new Date(now), updatedAt: new Date(now) };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      await pool.query("DELETE FROM workout_template_exercises WHERE id = $1", [where.id]);
      await syncToDisk();
      return { id: where.id };
    },
    deleteMany: async ({ where }: { where: { workoutTemplateId?: string } }) => {
      const pool = await getPool();
      if (where?.workoutTemplateId) {
        await pool.query("DELETE FROM workout_template_exercises WHERE workout_template_id = $1", [where.workoutTemplateId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  aiConversation: {
    findMany: async ({ where, orderBy, include }: { where?: { userId?: string }; orderBy?: any; include?: { messages?: boolean } } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM ai_conversations";
      const params: any[] = [];
      if (where?.userId) {
        query += " WHERE user_id = $1";
        params.push(where.userId);
      }
      query += " ORDER BY last_message_at DESC, created_at DESC";

      const res = await pool.query(query, params);
      const rows = res.rows || [];

      const conversations = await Promise.all(
        rows.map(async (row: any) => {
          let messages: any[] = [];
          if (include?.messages) {
            const mRes = await pool.query(
              "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
              [row.id]
            );
            messages = (mRes.rows || []).map((m: any) => ({
              id: m.id,
              conversationId: m.conversation_id,
              role: m.role,
              content: m.content,
              metadata: m.metadata,
              createdAt: new Date(m.created_at),
            }));
          }

          return {
            id: row.id,
            userId: row.user_id,
            title: row.title || "New Conversation",
            lastMessageAt: new Date(row.last_message_at),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            ...(include?.messages ? { messages } : {}),
          };
        })
      );

      return conversations;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: { messages?: boolean } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM ai_conversations WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];

      let messages: any[] = [];
      if (include?.messages) {
        const mRes = await pool.query(
          "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
          [row.id]
        );
        messages = (mRes.rows || []).map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          createdAt: new Date(m.created_at),
        }));
      }

      return {
        id: row.id,
        userId: row.user_id,
        title: row.title || "New Conversation",
        lastMessageAt: new Date(row.last_message_at),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        ...(include?.messages ? { messages } : {}),
      };
    },
    findFirst: async ({ where, orderBy, include }: { where?: { userId?: string }; orderBy?: any; include?: { messages?: boolean } } = {}) => {
      const convs = await postgresDbClient.aiConversation.findMany({ where, include });
      return convs[0] || null;
    },
    create: async ({ data }: { data: { id?: string; userId: string; title?: string } }) => {
      const pool = await getPool();
      const id = data.id || `aiconv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const title = data.title || "New Conversation";

      await pool.query(
        `INSERT INTO ai_conversations (id, user_id, title, last_message_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, data.userId, title, now, now, now]
      );

      await syncToDisk();
      return {
        id,
        userId: data.userId,
        title,
        lastMessageAt: new Date(now),
        createdAt: new Date(now),
        updatedAt: new Date(now),
        messages: [],
      };
    },
    update: async ({ where, data }: { where: { id: string }; data: { title?: string; lastMessageAt?: Date } }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const lastMsg = data.lastMessageAt ? data.lastMessageAt.toISOString() : now;

      await pool.query(
        `UPDATE ai_conversations
         SET title = COALESCE($1, title), last_message_at = COALESCE($2, last_message_at), updated_at = $3
         WHERE id = $4`,
        [data.title || null, lastMsg, now, where.id]
      );

      await syncToDisk();
      return postgresDbClient.aiConversation.findUnique({ where });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.aiConversation.findUnique({ where });
      if (!existing) throw new Error("Conversation not found");

      await pool.query("DELETE FROM ai_messages WHERE conversation_id = $1", [where.id]);
      await pool.query("DELETE FROM ai_conversations WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where: { userId?: string } }) => {
      const pool = await getPool();
      if (where?.userId) {
        const convs = await pool.query("SELECT id FROM ai_conversations WHERE user_id = $1", [where.userId]);
        for (const row of convs.rows || []) {
          await pool.query("DELETE FROM ai_messages WHERE conversation_id = $1", [row.id]);
        }
        await pool.query("DELETE FROM ai_conversations WHERE user_id = $1", [where.userId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  aiMessage: {
    findMany: async ({ where, orderBy }: { where: { conversationId: string }; orderBy?: any }) => {
      const pool = await getPool();
      const res = await pool.query(
        "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [where.conversationId]
      );
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role,
        content: row.content,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
      }));
    },
    create: async ({ data }: { data: { id?: string; conversationId: string; role: string; content: string; metadata?: string | null } }) => {
      const pool = await getPool();
      const id = data.id || `aimsg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO ai_messages (id, conversation_id, role, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, data.conversationId, data.role, data.content, data.metadata || null, now]
      );

      // Update conversation last_message_at
      await pool.query(
        "UPDATE ai_conversations SET last_message_at = $1, updated_at = $1 WHERE id = $2",
        [now, data.conversationId]
      );

      await syncToDisk();
      return {
        id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata || null,
        createdAt: new Date(now),
      };
    },
    deleteMany: async ({ where }: { where: { conversationId?: string } }) => {
      const pool = await getPool();
      if (where?.conversationId) {
        await pool.query("DELETE FROM ai_messages WHERE conversation_id = $1", [where.conversationId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  aiMemory: {
    findMany: async ({ where, orderBy }: { where?: { userId?: string; category?: string }; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM ai_memories";
      const params: any[] = [];
      const clauses: string[] = [];

      if (where?.userId) {
        clauses.push(`user_id = $${params.length + 1}`);
        params.push(where.userId);
      }
      if (where?.category) {
        clauses.push(`category = $${params.length + 1}`);
        params.push(where.category);
      }

      if (clauses.length > 0) {
        query += " WHERE " + clauses.join(" AND ");
      }
      query += " ORDER BY importance DESC, created_at DESC";

      const res = await pool.query(query, params);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        content: row.content,
        importance: Number(row.importance || 1),
        source: row.source || "USER_STATED",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM ai_memories WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        content: row.content,
        importance: Number(row.importance || 1),
        source: row.source || "USER_STATED",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    create: async ({ data }: { data: { id?: string; userId: string; category?: string; content: string; importance?: number; source?: string } }) => {
      const pool = await getPool();
      const id = data.id || `aimem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO ai_memories (id, user_id, category, content, importance, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, data.userId, data.category || "GENERAL", data.content, data.importance || 1, data.source || "USER_STATED", now, now]
      );

      await syncToDisk();
      return {
        id,
        userId: data.userId,
        category: data.category || "GENERAL",
        content: data.content,
        importance: data.importance || 1,
        source: data.source || "USER_STATED",
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    },
    update: async ({ where, data }: { where: { id: string }; data: { category?: string; content?: string; importance?: number } }) => {
      const pool = await getPool();
      const now = new Date().toISOString();

      await pool.query(
        `UPDATE ai_memories
         SET category = COALESCE($1, category), content = COALESCE($2, content), importance = COALESCE($3, importance), updated_at = $4
         WHERE id = $5`,
        [data.category || null, data.content || null, data.importance || null, now, where.id]
      );

      await syncToDisk();
      return postgresDbClient.aiMemory.findUnique({ where });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.aiMemory.findUnique({ where });
      if (!existing) throw new Error("Memory not found");

      await pool.query("DELETE FROM ai_memories WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where: { userId?: string } }) => {
      const pool = await getPool();
      if (where?.userId) {
        await pool.query("DELETE FROM ai_memories WHERE user_id = $1", [where.userId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  friendship: {
    findMany: async (params?: { where?: any; orderBy?: any; include?: any }) => {
      const pool = await getPool();
      let query = `
        SELECT f.*, 
               u1.name as req_name, u1.username as req_username,
               u2.name as add_name, u2.username as add_username
        FROM friendships f
        LEFT JOIN users u1 ON f.requester_id = u1.id
        LEFT JOIN users u2 ON f.addressee_id = u2.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIdx = 1;

      if (params?.where) {
        const w = params.where;
        if (w.status) {
          query += ` AND f.status = $${paramIdx++}`;
          values.push(w.status);
        }
        if (w.requesterId) {
          query += ` AND f.requester_id = $${paramIdx++}`;
          values.push(w.requesterId);
        }
        if (w.addresseeId) {
          query += ` AND f.addressee_id = $${paramIdx++}`;
          values.push(w.addresseeId);
        }
        if (w.OR && Array.isArray(w.OR)) {
          const orClauses: string[] = [];
          for (const orItem of w.OR) {
            if (orItem.requesterId && orItem.addresseeId) {
              orClauses.push(`(f.requester_id = $${paramIdx++} AND f.addressee_id = $${paramIdx++})`);
              values.push(orItem.requesterId, orItem.addresseeId);
            } else if (orItem.requesterId) {
              orClauses.push(`f.requester_id = $${paramIdx++}`);
              values.push(orItem.requesterId);
            } else if (orItem.addresseeId) {
              orClauses.push(`f.addressee_id = $${paramIdx++}`);
              values.push(orItem.addresseeId);
            }
          }
          if (orClauses.length > 0) {
            query += ` AND (${orClauses.join(" OR ")})`;
          }
        }
      }

      query += " ORDER BY f.created_at DESC";
      const res = await pool.query(query, values);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        requesterId: row.requester_id,
        addresseeId: row.addressee_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        requester: {
          id: row.requester_id,
          name: row.req_name || "User",
          username: row.req_username || "user",
        },
        addressee: {
          id: row.addressee_id,
          name: row.add_name || "User",
          username: row.add_username || "user",
        },
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; requesterId_addresseeId?: { requesterId: string; addresseeId: string } } }) => {
      const pool = await getPool();
      let res;
      if (where.id) {
        res = await pool.query(
          `SELECT f.*, 
                  u1.name as req_name, u1.username as req_username,
                  u2.name as add_name, u2.username as add_username
           FROM friendships f
           LEFT JOIN users u1 ON f.requester_id = u1.id
           LEFT JOIN users u2 ON f.addressee_id = u2.id
           WHERE f.id = $1`,
          [where.id]
        );
      } else if (where.requesterId_addresseeId) {
        res = await pool.query(
          `SELECT f.*, 
                  u1.name as req_name, u1.username as req_username,
                  u2.name as add_name, u2.username as add_username
           FROM friendships f
           LEFT JOIN users u1 ON f.requester_id = u1.id
           LEFT JOIN users u2 ON f.addressee_id = u2.id
           WHERE f.requester_id = $1 AND f.addressee_id = $2`,
          [where.requesterId_addresseeId.requesterId, where.requesterId_addresseeId.addresseeId]
        );
      }
      if (!res?.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        requesterId: row.requester_id,
        addresseeId: row.addressee_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        requester: {
          id: row.requester_id,
          name: row.req_name || "User",
          username: row.req_username || "user",
        },
        addressee: {
          id: row.addressee_id,
          name: row.add_name || "User",
          username: row.add_username || "user",
        },
      };
    },
    findFirst: async ({ where }: { where: any }) => {
      const list = await postgresDbClient.friendship.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: { id?: string; requesterId: string; addresseeId: string; status?: string } }) => {
      const pool = await getPool();
      const id = data.id || `fr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const status = data.status || "PENDING";

      await pool.query(
        `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, data.requesterId, data.addresseeId, status, now, now]
      );

      await syncToDisk();
      return postgresDbClient.friendship.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => {
      const pool = await getPool();
      const now = new Date().toISOString();

      await pool.query(
        `UPDATE friendships SET status = $1, updated_at = $2 WHERE id = $3`,
        [data.status, now, where.id]
      );

      await syncToDisk();
      return postgresDbClient.friendship.findUnique({ where: { id: where.id } });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.friendship.findUnique({ where });
      if (!existing) throw new Error("Friendship not found");

      await pool.query("DELETE FROM friendships WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any }) => {
      const pool = await getPool();
      if (where?.OR) {
        for (const orItem of where.OR) {
          if (orItem.requesterId && orItem.addresseeId) {
            await pool.query("DELETE FROM friendships WHERE requester_id = $1 AND addressee_id = $2", [orItem.requesterId, orItem.addresseeId]);
          } else if (orItem.requesterId) {
            await pool.query("DELETE FROM friendships WHERE requester_id = $1", [orItem.requesterId]);
          } else if (orItem.addresseeId) {
            await pool.query("DELETE FROM friendships WHERE addressee_id = $1", [orItem.addresseeId]);
          }
        }
      } else if (where?.requesterId) {
        await pool.query("DELETE FROM friendships WHERE requester_id = $1", [where.requesterId]);
      } else if (where?.addresseeId) {
        await pool.query("DELETE FROM friendships WHERE addressee_id = $1", [where.addresseeId]);
      }
      await syncToDisk();
      return { count: 1 };
    },
  },
  userPrivacySettings: {
    findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
      const pool = await getPool();
      const res = where.userId
        ? await pool.query("SELECT * FROM user_privacy_settings WHERE user_id = $1", [where.userId])
        : await pool.query("SELECT * FROM user_privacy_settings WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        shareHealthScore: row.share_health_score || "PRIVATE",
        shareNutrition: row.share_nutrition || "PRIVATE",
        shareHydration: row.share_hydration || "PRIVATE",
        shareActivities: row.share_activities || "PRIVATE",
        shareWorkouts: row.share_workouts || "PRIVATE",
        shareAchievements: row.share_achievements || "PRIVATE",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    findFirst: async ({ where }: { where: any }) => {
      return postgresDbClient.userPrivacySettings.findUnique({ where });
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `priv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO user_privacy_settings (id, user_id, share_health_score, share_nutrition, share_hydration, share_activities, share_workouts, share_achievements, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          data.userId,
          data.shareHealthScore || "PRIVATE",
          data.shareNutrition || "PRIVATE",
          data.shareHydration || "PRIVATE",
          data.shareActivities || "PRIVATE",
          data.shareWorkouts || "PRIVATE",
          data.shareAchievements || "PRIVATE",
          now,
          now,
        ]
      );

      await syncToDisk();
      return postgresDbClient.userPrivacySettings.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { userId?: string; id?: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const keyCol = where.userId ? "user_id" : "id";
      const keyVal = where.userId || where.id;

      await pool.query(
        `UPDATE user_privacy_settings
         SET share_health_score = COALESCE($1, share_health_score),
             share_nutrition = COALESCE($2, share_nutrition),
             share_hydration = COALESCE($3, share_hydration),
             share_activities = COALESCE($4, share_activities),
             share_workouts = COALESCE($5, share_workouts),
             share_achievements = COALESCE($6, share_achievements),
             updated_at = $7
         WHERE ${keyCol} = $8`,
        [
          data.shareHealthScore || null,
          data.shareNutrition || null,
          data.shareHydration || null,
          data.shareActivities || null,
          data.shareWorkouts || null,
          data.shareAchievements || null,
          now,
          keyVal,
        ]
      );

      await syncToDisk();
      return postgresDbClient.userPrivacySettings.findUnique({ where });
    },
    upsert: async ({ where, create, update }: { where: { userId: string }; create: any; update: any }) => {
      const existing = await postgresDbClient.userPrivacySettings.findUnique({ where });
      if (existing) {
        return postgresDbClient.userPrivacySettings.update({ where, data: update });
      } else {
        return postgresDbClient.userPrivacySettings.create({ data: create });
      }
    },
    deleteMany: async ({ where }: { where?: { userId?: string } }) => {
      const pool = await getPool();
      if (where?.userId) {
        await pool.query("DELETE FROM user_privacy_settings WHERE user_id = $1", [where.userId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  friendRecommendation: {
    findMany: async (params?: { where?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = `
        SELECT r.*,
               u1.name as sender_name, u1.username as sender_username,
               u2.name as rec_name, u2.username as rec_username
        FROM friend_recommendations r
        LEFT JOIN users u1 ON r.sender_id = u1.id
        LEFT JOIN users u2 ON r.receiver_id = u2.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIdx = 1;

      if (params?.where?.receiverId) {
        query += ` AND r.receiver_id = $${paramIdx++}`;
        values.push(params.where.receiverId);
      }
      if (params?.where?.senderId) {
        query += ` AND r.sender_id = $${paramIdx++}`;
        values.push(params.where.senderId);
      }
      if (params?.where?.status) {
        query += ` AND r.status = $${paramIdx++}`;
        values.push(params.where.status);
      }

      query += " ORDER BY r.created_at DESC";
      const res = await pool.query(query, values);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        itemType: row.item_type,
        title: row.title,
        payload: row.payload,
        message: row.message,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        sender: {
          id: row.sender_id,
          name: row.sender_name || "Friend",
          username: row.sender_username || "friend",
        },
        receiver: {
          id: row.receiver_id,
          name: row.rec_name || "User",
          username: row.rec_username || "user",
        },
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query(
        `SELECT r.*,
                u1.name as sender_name, u1.username as sender_username,
                u2.name as rec_name, u2.username as rec_username
         FROM friend_recommendations r
         LEFT JOIN users u1 ON r.sender_id = u1.id
         LEFT JOIN users u2 ON r.receiver_id = u2.id
         WHERE r.id = $1`,
        [where.id]
      );
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        itemType: row.item_type,
        title: row.title,
        payload: row.payload,
        message: row.message,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        sender: {
          id: row.sender_id,
          name: row.sender_name || "Friend",
          username: row.sender_username || "friend",
        },
      };
    },
    findFirst: async ({ where }: { where: any }) => {
      const list = await postgresDbClient.friendRecommendation.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `recom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO friend_recommendations (id, sender_id, receiver_id, item_type, title, payload, message, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          data.senderId,
          data.receiverId,
          data.itemType,
          data.title,
          typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload),
          data.message || null,
          data.status || "PENDING",
          now,
          now,
        ]
      );

      await syncToDisk();
      return postgresDbClient.friendRecommendation.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();

      await pool.query(
        `UPDATE friend_recommendations
         SET status = COALESCE($1, status),
             updated_at = $2
         WHERE id = $3`,
        [data.status || null, now, where.id]
      );

      await syncToDisk();
      return postgresDbClient.friendRecommendation.findUnique({ where });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.friendRecommendation.findUnique({ where });
      if (!existing) throw new Error("Recommendation not found");

      await pool.query("DELETE FROM friend_recommendations WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any }) => {
      const pool = await getPool();
      if (where?.receiverId) {
        await pool.query("DELETE FROM friend_recommendations WHERE receiver_id = $1", [where.receiverId]);
      } else if (where?.senderId) {
        await pool.query("DELETE FROM friend_recommendations WHERE sender_id = $1", [where.senderId]);
      }
      await syncToDisk();
      return { count: 1 };
    },
  },
  notification: {
    findMany: async (params?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
      const pool = await getPool();
      let query = `
        SELECT n.*,
               u.name as actor_name, u.username as actor_username
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIdx = 1;

      if (params?.where?.userId) {
        query += ` AND n.user_id = $${paramIdx++}`;
        values.push(params.where.userId);
      }
      if (params?.where?.isRead !== undefined) {
        query += ` AND n.is_read = $${paramIdx++}`;
        values.push(params.where.isRead);
      }
      if (params?.where?.category) {
        query += ` AND n.category = $${paramIdx++}`;
        values.push(params.where.category);
      }
      if (params?.where?.type) {
        query += ` AND n.type = $${paramIdx++}`;
        values.push(params.where.type);
      }

      query += " ORDER BY n.created_at DESC";
      if (params?.take) {
        query += ` LIMIT ${Number(params.take)}`;
      }
      if (params?.skip) {
        query += ` OFFSET ${Number(params.skip)}`;
      }

      const res = await pool.query(query, values);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        actorId: row.actor_id,
        category: row.category || "SYSTEM",
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        actionUrl: row.action_url || row.link || null,
        metadata: row.metadata,
        isRead: Boolean(row.is_read),
        readAt: row.read_at ? new Date(row.read_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        actor: row.actor_id
          ? {
              id: row.actor_id,
              name: row.actor_name || "User",
              username: row.actor_username || "user",
            }
          : null,
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM notifications WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        actorId: row.actor_id,
        category: row.category || "SYSTEM",
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        actionUrl: row.action_url || row.link || null,
        metadata: row.metadata,
        isRead: Boolean(row.is_read),
        readAt: row.read_at ? new Date(row.read_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const readAt = data.readAt ? new Date(data.readAt).toISOString() : (data.isRead ? now : null);

      await pool.query(
        `INSERT INTO notifications (id, user_id, actor_id, category, type, title, message, link, action_url, metadata, is_read, read_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          id,
          data.userId,
          data.actorId || null,
          data.category || "SYSTEM",
          data.type,
          data.title,
          data.message,
          data.link || data.actionUrl || null,
          data.actionUrl || data.link || null,
          data.metadata ? (typeof data.metadata === "string" ? data.metadata : JSON.stringify(data.metadata)) : null,
          Boolean(data.isRead),
          readAt,
          now,
          now,
        ]
      );

      await syncToDisk();
      return postgresDbClient.notification.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const readAt = data.readAt !== undefined ? (data.readAt ? new Date(data.readAt).toISOString() : null) : (data.isRead ? now : undefined);

      let query = "UPDATE notifications SET updated_at = $1";
      const values: any[] = [now];
      let idx = 2;

      if (data.isRead !== undefined) {
        query += `, is_read = $${idx++}`;
        values.push(Boolean(data.isRead));
      }
      if (readAt !== undefined) {
        query += `, read_at = $${idx++}`;
        values.push(readAt);
      }

      query += ` WHERE id = $${idx}`;
      values.push(where.id);

      await pool.query(query, values);
      await syncToDisk();
      return postgresDbClient.notification.findUnique({ where });
    },
    updateMany: async ({ where, data }: { where: { userId: string; isRead?: boolean }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const readAt = data.readAt !== undefined ? (data.readAt ? new Date(data.readAt).toISOString() : null) : (data.isRead ? now : null);

      let query = "UPDATE notifications SET is_read = $1, read_at = $2, updated_at = $3 WHERE user_id = $4";
      const values: any[] = [Boolean(data.isRead), readAt, now, where.userId];
      if (where.isRead !== undefined) {
        query += " AND is_read = $5";
        values.push(where.isRead);
      }

      const res = await pool.query(query, values);
      await syncToDisk();
      return { count: res.rowCount || 1 };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.notification.findUnique({ where });
      if (!existing) throw new Error("Notification not found");

      await pool.query("DELETE FROM notifications WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: { userId?: string } }) => {
      const pool = await getPool();
      if (where?.userId) {
        await pool.query("DELETE FROM notifications WHERE user_id = $1", [where.userId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
    count: async (params?: { where?: { userId?: string; isRead?: boolean; category?: string } }) => {
      const pool = await getPool();
      let query = "SELECT COUNT(*) as count FROM notifications WHERE 1=1";
      const values: any[] = [];
      let idx = 1;
      if (params?.where?.userId) {
        query += ` AND user_id = $${idx++}`;
        values.push(params.where.userId);
      }
      if (params?.where?.isRead !== undefined) {
        query += ` AND is_read = $${idx++}`;
        values.push(params.where.isRead);
      }
      if (params?.where?.category) {
        query += ` AND category = $${idx++}`;
        values.push(params.where.category);
      }
      const res = await pool.query(query, values);
      return parseInt(res.rows?.[0]?.count || "0", 10);
    },
  },
  userNotificationPreference: {
    findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
      const pool = await getPool();
      let res;
      if (where.userId) {
        res = await pool.query("SELECT * FROM user_notification_preferences WHERE user_id = $1", [where.userId]);
      } else if (where.id) {
        res = await pool.query("SELECT * FROM user_notification_preferences WHERE id = $1", [where.id]);
      }
      if (!res?.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        hydrationReminders: Boolean(row.hydration_reminders),
        nutritionReminders: Boolean(row.nutrition_reminders),
        workoutReminders: Boolean(row.workout_reminders),
        activityReminders: Boolean(row.activity_reminders),
        friendNotifications: Boolean(row.friend_notifications),
        insightNotifications: Boolean(row.insight_notifications),
        featureRequestNotifications: Boolean(row.feature_request_notifications),
        systemNotifications: Boolean(row.system_notifications),
        quietHoursEnabled: Boolean(row.quiet_hours_enabled),
        quietHoursStart: row.quiet_hours_start || "22:00",
        quietHoursEnd: row.quiet_hours_end || "08:00",
        reminderFrequency: row.reminder_frequency || "MODERATE",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `notif_pref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO user_notification_preferences (
           id, user_id, hydration_reminders, nutrition_reminders, workout_reminders,
           activity_reminders, friend_notifications, insight_notifications,
           feature_request_notifications, system_notifications, quiet_hours_enabled,
           quiet_hours_start, quiet_hours_end, reminder_frequency, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          data.userId,
          data.hydrationReminders !== undefined ? Boolean(data.hydrationReminders) : true,
          data.nutritionReminders !== undefined ? Boolean(data.nutritionReminders) : true,
          data.workoutReminders !== undefined ? Boolean(data.workoutReminders) : false,
          data.activityReminders !== undefined ? Boolean(data.activityReminders) : true,
          data.friendNotifications !== undefined ? Boolean(data.friendNotifications) : true,
          data.insightNotifications !== undefined ? Boolean(data.insightNotifications) : true,
          data.featureRequestNotifications !== undefined ? Boolean(data.featureRequestNotifications) : true,
          data.systemNotifications !== undefined ? Boolean(data.systemNotifications) : true,
          data.quietHoursEnabled !== undefined ? Boolean(data.quietHoursEnabled) : false,
          data.quietHoursStart || "22:00",
          data.quietHoursEnd || "08:00",
          data.reminderFrequency || "MODERATE",
          now,
          now,
        ]
      );

      await syncToDisk();
      return postgresDbClient.userNotificationPreference.findUnique({ where: { userId: data.userId } });
    },
    update: async ({ where, data }: { where: { userId: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();

      await pool.query(
        `UPDATE user_notification_preferences
         SET hydration_reminders = COALESCE($1, hydration_reminders),
             nutrition_reminders = COALESCE($2, nutrition_reminders),
             workout_reminders = COALESCE($3, workout_reminders),
             activity_reminders = COALESCE($4, activity_reminders),
             friend_notifications = COALESCE($5, friend_notifications),
             insight_notifications = COALESCE($6, insight_notifications),
             feature_request_notifications = COALESCE($7, feature_request_notifications),
             system_notifications = COALESCE($8, system_notifications),
             quiet_hours_enabled = COALESCE($9, quiet_hours_enabled),
             quiet_hours_start = COALESCE($10, quiet_hours_start),
             quiet_hours_end = COALESCE($11, quiet_hours_end),
             reminder_frequency = COALESCE($12, reminder_frequency),
             updated_at = $13
         WHERE user_id = $14`,
        [
          data.hydrationReminders !== undefined ? Boolean(data.hydrationReminders) : null,
          data.nutritionReminders !== undefined ? Boolean(data.nutritionReminders) : null,
          data.workoutReminders !== undefined ? Boolean(data.workoutReminders) : null,
          data.activityReminders !== undefined ? Boolean(data.activityReminders) : null,
          data.friendNotifications !== undefined ? Boolean(data.friendNotifications) : null,
          data.insightNotifications !== undefined ? Boolean(data.insightNotifications) : null,
          data.featureRequestNotifications !== undefined ? Boolean(data.featureRequestNotifications) : null,
          data.systemNotifications !== undefined ? Boolean(data.systemNotifications) : null,
          data.quietHoursEnabled !== undefined ? Boolean(data.quietHoursEnabled) : null,
          data.quietHoursStart || null,
          data.quietHoursEnd || null,
          data.reminderFrequency || null,
          now,
          where.userId,
        ]
      );

      await syncToDisk();
      return postgresDbClient.userNotificationPreference.findUnique({ where });
    },
    upsert: async ({ where, create, update }: { where: { userId: string }; create: any; update: any }) => {
      const existing = await postgresDbClient.userNotificationPreference.findUnique({ where });
      if (existing) {
        return postgresDbClient.userNotificationPreference.update({ where, data: update });
      } else {
        return postgresDbClient.userNotificationPreference.create({ data: { ...create, userId: where.userId } });
      }
    },
  },
  privacySetting: {
    findUnique: async ({ where }: { where: { id?: string; userId_category?: { userId: string; category: string } } }) => {
      const pool = await getPool();
      let res;
      if (where.userId_category) {
        res = await pool.query(
          "SELECT * FROM privacy_settings WHERE user_id = $1 AND category = $2",
          [where.userId_category.userId, where.userId_category.category]
        );
      } else if (where.id) {
        res = await pool.query("SELECT * FROM privacy_settings WHERE id = $1", [where.id]);
      }
      if (!res?.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        visibility: row.visibility,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM privacy_settings WHERE 1=1";
      const values: any[] = [];
      let idx = 1;
      if (where?.userId) {
        query += ` AND user_id = $${idx++}`;
        values.push(where.userId);
      }
      if (where?.category) {
        query += ` AND category = $${idx++}`;
        values.push(where.category);
      }
      if (where?.visibility) {
        query += ` AND visibility = $${idx++}`;
        values.push(where.visibility);
      }
      const res = await pool.query(query, values);
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        visibility: row.visibility,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },
    findMany: async (params?: { where?: any; orderBy?: any }) => {
      const pool = await getPool();
      let query = "SELECT * FROM privacy_settings WHERE 1=1";
      const values: any[] = [];
      let idx = 1;
      if (params?.where?.userId) {
        query += ` AND user_id = $${idx++}`;
        values.push(params.where.userId);
      }
      if (params?.where?.category) {
        query += ` AND category = $${idx++}`;
        values.push(params.where.category);
      }
      if (params?.where?.visibility) {
        query += ` AND visibility = $${idx++}`;
        values.push(params.where.visibility);
      }
      query += " ORDER BY category ASC";
      const res = await pool.query(query, values);
      return (res.rows || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        visibility: row.visibility,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `ps_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO privacy_settings (id, user_id, category, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, category) DO UPDATE
         SET visibility = EXCLUDED.visibility, updated_at = EXCLUDED.updated_at`,
        [id, data.userId, data.category, data.visibility || "FRIENDS", now, now]
      );
      await syncToDisk();
      return postgresDbClient.privacySetting.findFirst({ where: { userId: data.userId, category: data.category } });
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      if (where.userId_category) {
        await pool.query(
          `UPDATE privacy_settings SET visibility = COALESCE($1, visibility), updated_at = $2 WHERE user_id = $3 AND category = $4`,
          [data.visibility || null, now, where.userId_category.userId, where.userId_category.category]
        );
      } else if (where.id) {
        await pool.query(
          `UPDATE privacy_settings SET visibility = COALESCE($1, visibility), updated_at = $2 WHERE id = $3`,
          [data.visibility || null, now, where.id]
        );
      }
      await syncToDisk();
      return postgresDbClient.privacySetting.findFirst({
        where: where.userId_category
          ? { userId: where.userId_category.userId, category: where.userId_category.category }
          : { id: where.id },
      });
    },
    upsert: async ({ where, create, update }: { where: any; create: any; update: any }) => {
      const existing = await postgresDbClient.privacySetting.findUnique({ where });
      if (existing) {
        return postgresDbClient.privacySetting.update({ where, data: update });
      } else {
        return postgresDbClient.privacySetting.create({ data: create });
      }
    },
    delete: async ({ where }: { where: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.privacySetting.findUnique({ where });
      if (where.userId_category) {
        await pool.query("DELETE FROM privacy_settings WHERE user_id = $1 AND category = $2", [
          where.userId_category.userId,
          where.userId_category.category,
        ]);
      } else if (where.id) {
        await pool.query("DELETE FROM privacy_settings WHERE id = $1", [where.id]);
      }
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: { userId?: string } }) => {
      const pool = await getPool();
      if (where?.userId) {
        await pool.query("DELETE FROM privacy_settings WHERE user_id = $1", [where.userId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  integrationConnection: {
    findUnique: async ({ where }: { where: any }) => {
      const pool = await getPool();
      if (where.userId_provider) {
        const res = await pool.query(
          "SELECT * FROM integration_connections WHERE user_id = $1 AND provider = $2",
          [where.userId_provider.userId, where.userId_provider.provider]
        );
        const r = res.rows[0];
        if (!r) return null;
        return {
          id: r.id,
          userId: r.user_id,
          provider: r.provider,
          status: r.status,
          accessToken: r.access_token,
          refreshToken: r.refresh_token,
          tokenExpiresAt: r.token_expires_at,
          externalUserId: r.external_user_id,
          externalUsername: r.external_username,
          scope: r.scope,
          metadata: r.metadata,
          lastSyncAt: r.last_sync_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }
      if (where.id) {
        const res = await pool.query("SELECT * FROM integration_connections WHERE id = $1", [where.id]);
        const r = res.rows[0];
        if (!r) return null;
        return {
          id: r.id,
          userId: r.user_id,
          provider: r.provider,
          status: r.status,
          accessToken: r.access_token,
          refreshToken: r.refresh_token,
          tokenExpiresAt: r.token_expires_at,
          externalUserId: r.external_user_id,
          externalUsername: r.external_username,
          scope: r.scope,
          metadata: r.metadata,
          lastSyncAt: r.last_sync_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }
      return null;
    },
    findFirst: async ({ where }: { where?: any }) => {
      const pool = await getPool();
      let q = "SELECT * FROM integration_connections WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        q += ` AND user_id = $${params.length}`;
      }
      if (where?.provider) {
        params.push(where.provider);
        q += ` AND provider = $${params.length}`;
      }
      if (where?.status) {
        params.push(where.status);
        q += ` AND status = $${params.length}`;
      }
      const res = await pool.query(q + " LIMIT 1", params);
      const r = res.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        userId: r.user_id,
        provider: r.provider,
        status: r.status,
        accessToken: r.access_token,
        refreshToken: r.refresh_token,
        tokenExpiresAt: r.token_expires_at,
        externalUserId: r.external_user_id,
        externalUsername: r.external_username,
        scope: r.scope,
        metadata: r.metadata,
        lastSyncAt: r.last_sync_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    },
    findMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let q = "SELECT * FROM integration_connections WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        q += ` AND user_id = $${params.length}`;
      }
      if (where?.provider) {
        params.push(where.provider);
        q += ` AND provider = $${params.length}`;
      }
      if (where?.status) {
        params.push(where.status);
        q += ` AND status = $${params.length}`;
      }
      const res = await pool.query(q + " ORDER BY created_at DESC", params);
      return res.rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        provider: r.provider,
        status: r.status,
        accessToken: r.access_token,
        refreshToken: r.refresh_token,
        tokenExpiresAt: r.token_expires_at,
        externalUserId: r.external_user_id,
        externalUsername: r.external_username,
        scope: r.scope,
        metadata: r.metadata,
        lastSyncAt: r.last_sync_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
      const now = new Date();
      await pool.query(
        `INSERT INTO integration_connections (
          id, user_id, provider, status, access_token, refresh_token, token_expires_at,
          external_user_id, external_username, scope, metadata, last_sync_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          id,
          data.userId,
          data.provider,
          data.status || "CONNECTED",
          data.accessToken || null,
          data.refreshToken || null,
          data.tokenExpiresAt || null,
          data.externalUserId || null,
          data.externalUsername || null,
          data.scope || null,
          typeof data.metadata === "object" ? JSON.stringify(data.metadata) : data.metadata || null,
          data.lastSyncAt || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.integrationConnection.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const pool = await getPool();
      const updates: string[] = [];
      const params: any[] = [];

      if (data.status !== undefined) {
        params.push(data.status);
        updates.push(`status = $${params.length}`);
      }
      if (data.accessToken !== undefined) {
        params.push(data.accessToken);
        updates.push(`access_token = $${params.length}`);
      }
      if (data.refreshToken !== undefined) {
        params.push(data.refreshToken);
        updates.push(`refresh_token = $${params.length}`);
      }
      if (data.tokenExpiresAt !== undefined) {
        params.push(data.tokenExpiresAt);
        updates.push(`token_expires_at = $${params.length}`);
      }
      if (data.externalUserId !== undefined) {
        params.push(data.externalUserId);
        updates.push(`external_user_id = $${params.length}`);
      }
      if (data.externalUsername !== undefined) {
        params.push(data.externalUsername);
        updates.push(`external_username = $${params.length}`);
      }
      if (data.scope !== undefined) {
        params.push(data.scope);
        updates.push(`scope = $${params.length}`);
      }
      if (data.metadata !== undefined) {
        params.push(typeof data.metadata === "object" ? JSON.stringify(data.metadata) : data.metadata);
        updates.push(`metadata = $${params.length}`);
      }
      if (data.lastSyncAt !== undefined) {
        params.push(data.lastSyncAt);
        updates.push(`last_sync_at = $${params.length}`);
      }

      params.push(new Date());
      updates.push(`updated_at = $${params.length}`);

      if (where.userId_provider) {
        params.push(where.userId_provider.userId);
        const uIdx = params.length;
        params.push(where.userId_provider.provider);
        const pIdx = params.length;
        await pool.query(
          `UPDATE integration_connections SET ${updates.join(", ")} WHERE user_id = $${uIdx} AND provider = $${pIdx}`,
          params
        );
        await syncToDisk();
        return postgresDbClient.integrationConnection.findUnique({ where });
      }

      if (where.id) {
        params.push(where.id);
        const idIdx = params.length;
        await pool.query(
          `UPDATE integration_connections SET ${updates.join(", ")} WHERE id = $${idIdx}`,
          params
        );
        await syncToDisk();
        return postgresDbClient.integrationConnection.findUnique({ where });
      }

      return null;
    },
    upsert: async ({ where, create, update }: { where: any; create: any; update: any }) => {
      const existing = await postgresDbClient.integrationConnection.findUnique({ where });
      if (existing) {
        return postgresDbClient.integrationConnection.update({ where, data: update });
      } else {
        return postgresDbClient.integrationConnection.create({ data: create });
      }
    },
    delete: async ({ where }: { where: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.integrationConnection.findUnique({ where });
      if (where.userId_provider) {
        await pool.query("DELETE FROM integration_connections WHERE user_id = $1 AND provider = $2", [
          where.userId_provider.userId,
          where.userId_provider.provider,
        ]);
      } else if (where.id) {
        await pool.query("DELETE FROM integration_connections WHERE id = $1", [where.id]);
      }
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: { userId?: any; provider?: string } } = {}) => {
      const pool = await getPool();
      let q = "DELETE FROM integration_connections WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        if (typeof where.userId === "object" && where.userId.in) {
          const placeholders = where.userId.in.map((id: string) => {
            params.push(id);
            return `$${params.length}`;
          }).join(", ");
          q += ` AND user_id IN (${placeholders})`;
        } else {
          params.push(where.userId);
          q += ` AND user_id = $${params.length}`;
        }
      }
      if (where?.provider) {
        params.push(where.provider);
        q += ` AND provider = $${params.length}`;
      }
      const res = await pool.query(q, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  preApprovedUser: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM pre_approved_users WHERE 1=1";
      const params: any[] = [];
      if (where?.identifier) {
        params.push(where.identifier.toLowerCase().trim());
        query += ` AND LOWER(identifier) = $${params.length}`;
      }
      if (where?.consumedAt === null) {
        query += " AND consumed_at IS NULL";
      } else if (where?.consumedAt !== undefined && where.consumedAt !== null) {
        params.push(where.consumedAt);
        query += ` AND consumed_at = $${params.length}`;
      }
      query += " ORDER BY created_at DESC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        identifier: r.identifier,
        identifierType: r.identifier_type || "EMAIL",
        notes: r.notes || null,
        createdByAdminId: r.created_by_admin_id || null,
        consumedAt: r.consumed_at ? new Date(r.consumed_at) : null,
        consumedByUserId: r.consumed_by_user_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; identifier?: string } }) => {
      const pool = await getPool();
      let query = "SELECT * FROM pre_approved_users WHERE ";
      let param = "";
      if (where.id) {
        query += "id = $1";
        param = where.id;
      } else if (where.identifier) {
        query += "LOWER(identifier) = LOWER($1)";
        param = where.identifier.toLowerCase().trim();
      } else {
        return null;
      }
      const res = await pool.query(query, [param]);
      if (!res.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        identifier: r.identifier,
        identifierType: r.identifier_type || "EMAIL",
        notes: r.notes || null,
        createdByAdminId: r.created_by_admin_id || null,
        consumedAt: r.consumed_at ? new Date(r.consumed_at) : null,
        consumedByUserId: r.consumed_by_user_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.preApprovedUser.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `pau_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      const identifier = data.identifier.toLowerCase().trim();
      await pool.query(
        `INSERT INTO pre_approved_users (id, identifier, identifier_type, notes, created_by_admin_id, consumed_at, consumed_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          identifier,
          data.identifierType || "EMAIL",
          data.notes || null,
          data.createdByAdminId || null,
          data.consumedAt ? new Date(data.consumedAt).toISOString() : null,
          data.consumedByUserId || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.preApprovedUser.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id?: string; identifier?: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      const keyCol = where.id ? "id" : "identifier";
      const keyVal = where.id || where.identifier?.toLowerCase().trim();
      await pool.query(
        `UPDATE pre_approved_users
         SET notes = COALESCE($1, notes),
             consumed_at = $2,
             consumed_by_user_id = $3,
             updated_at = $4
         WHERE ${keyCol} = $5`,
        [
          data.notes !== undefined ? data.notes : null,
          data.consumedAt ? new Date(data.consumedAt).toISOString() : null,
          data.consumedByUserId || null,
          now,
          keyVal,
        ]
      );
      await syncToDisk();
      return postgresDbClient.preApprovedUser.findUnique({ where });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.preApprovedUser.findUnique({ where });
      if (!existing) throw new Error("Pre-approved user not found");
      await pool.query("DELETE FROM pre_approved_users WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.preApprovedUser.findMany({ where });
      return list.length;
    },
  },
  featureRequest: {
    findMany: async ({ where, orderBy, take, skip }: { where?: any; orderBy?: any; take?: number; skip?: number } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM feature_requests WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.status) {
        params.push(where.status);
        query += ` AND status = $${params.length}`;
      }
      query += " ORDER BY created_at DESC";
      if (take) {
        query += ` LIMIT ${take}`;
      }
      if (skip) {
        query += ` OFFSET ${skip}`;
      }
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description,
        category: r.category || "GENERAL",
        priority: r.priority || "MEDIUM",
        status: r.status || "OPEN",
        adminResponse: r.admin_response || null,
        respondedAt: r.responded_at ? new Date(r.responded_at) : null,
        respondedByAdminId: r.responded_by_admin_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM feature_requests WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description,
        category: r.category || "GENERAL",
        priority: r.priority || "MEDIUM",
        status: r.status || "OPEN",
        adminResponse: r.admin_response || null,
        respondedAt: r.responded_at ? new Date(r.responded_at) : null,
        respondedByAdminId: r.responded_by_admin_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.featureRequest.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `fr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO feature_requests (id, user_id, title, description, category, priority, status, admin_response, responded_at, responded_by_admin_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          data.userId,
          data.title,
          data.description,
          data.category || "GENERAL",
          data.priority || "MEDIUM",
          data.status || "OPEN",
          data.adminResponse || null,
          data.respondedAt ? new Date(data.respondedAt).toISOString() : null,
          data.respondedByAdminId || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.featureRequest.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      await pool.query(
        `UPDATE feature_requests
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             priority = COALESCE($4, priority),
             status = COALESCE($5, status),
             admin_response = COALESCE($6, admin_response),
             responded_at = $7,
             responded_by_admin_id = $8,
             updated_at = $9
         WHERE id = $10`,
        [
          data.title !== undefined ? data.title : null,
          data.description !== undefined ? data.description : null,
          data.category !== undefined ? data.category : null,
          data.priority !== undefined ? data.priority : null,
          data.status !== undefined ? data.status : null,
          data.adminResponse !== undefined ? data.adminResponse : null,
          data.respondedAt ? new Date(data.respondedAt).toISOString() : null,
          data.respondedByAdminId !== undefined ? data.respondedByAdminId : null,
          now,
          where.id,
        ]
      );
      await syncToDisk();
      return postgresDbClient.featureRequest.findUnique({ where });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.featureRequest.findUnique({ where });
      if (!existing) throw new Error("Feature request not found");
      await pool.query("DELETE FROM feature_requests WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    count: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.featureRequest.findMany({ where });
      return list.length;
    },
  },
  goal: {
    findMany: async ({ where, orderBy, take, skip, include }: { where?: any; orderBy?: any; take?: number; skip?: number; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM goals WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      if (where?.status) {
        if (typeof where.status === "object" && where.status?.in) {
          const inPlaceholders = where.status.in.map((s: string) => {
            params.push(s);
            return `$${params.length}`;
          }).join(", ");
          query += ` AND status IN (${inPlaceholders})`;
        } else {
          params.push(where.status);
          query += ` AND status = $${params.length}`;
        }
      }
      query += " ORDER BY created_at DESC";
      if (take) {
        query += ` LIMIT ${take}`;
      }
      if (skip) {
        query += ` OFFSET ${skip}`;
      }
      const res = await pool.query(query, params);
      const goals = (res.rows || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        description: r.description || null,
        category: r.category,
        goalType: r.goal_type,
        targetValue: Number(r.target_value),
        currentValue: Number(r.current_value || 0),
        unit: r.unit,
        startDate: r.start_date,
        targetDate: r.target_date,
        status: r.status || "ACTIVE",
        completedAt: r.completed_at ? new Date(r.completed_at) : null,
        lastEvaluatedAt: r.last_evaluated_at ? new Date(r.last_evaluated_at) : null,
        metadata: r.metadata || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));

      if (include?.milestones) {
        for (const g of goals) {
          (g as any).milestones = await postgresDbClient.goalMilestone.findMany({
            where: { goalId: g.id },
            orderBy: { percentage: "asc" },
          });
        }
      }
      return goals;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM goals WHERE id = $1", [where.id]);
      if (!res.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      const goal = {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        description: r.description || null,
        category: r.category,
        goalType: r.goal_type,
        targetValue: Number(r.target_value),
        currentValue: Number(r.current_value || 0),
        unit: r.unit,
        startDate: r.start_date,
        targetDate: r.target_date,
        status: r.status || "ACTIVE",
        completedAt: r.completed_at ? new Date(r.completed_at) : null,
        lastEvaluatedAt: r.last_evaluated_at ? new Date(r.last_evaluated_at) : null,
        metadata: r.metadata || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
      if (include?.milestones) {
        (goal as any).milestones = await postgresDbClient.goalMilestone.findMany({
          where: { goalId: goal.id },
          orderBy: { percentage: "asc" },
        });
      }
      return goal;
    },
    findFirst: async ({ where, include }: { where?: any; include?: any } = {}) => {
      const list = await postgresDbClient.goal.findMany({ where, take: 1, include });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO goals (id, user_id, name, description, category, goal_type, target_value, current_value, unit, start_date, target_date, status, completed_at, last_evaluated_at, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          id,
          data.userId,
          data.name,
          data.description || null,
          data.category,
          data.goalType,
          Number(data.targetValue),
          Number(data.currentValue || 0),
          data.unit,
          data.startDate,
          data.targetDate,
          data.status || "ACTIVE",
          data.completedAt ? new Date(data.completedAt).toISOString() : null,
          data.lastEvaluatedAt ? new Date(data.lastEvaluatedAt).toISOString() : null,
          data.metadata || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.goal.findUnique({ where: { id }, include: { milestones: true } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      await pool.query(
        `UPDATE goals
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             goal_type = COALESCE($4, goal_type),
             target_value = COALESCE($5, target_value),
             current_value = COALESCE($6, current_value),
             unit = COALESCE($7, unit),
             start_date = COALESCE($8, start_date),
             target_date = COALESCE($9, target_date),
             status = COALESCE($10, status),
             completed_at = $11,
             last_evaluated_at = $12,
             metadata = COALESCE($13, metadata),
             updated_at = $14
         WHERE id = $15`,
        [
          data.name !== undefined ? data.name : null,
          data.description !== undefined ? data.description : null,
          data.category !== undefined ? data.category : null,
          data.goalType !== undefined ? data.goalType : null,
          data.targetValue !== undefined ? Number(data.targetValue) : null,
          data.currentValue !== undefined ? Number(data.currentValue) : null,
          data.unit !== undefined ? data.unit : null,
          data.startDate !== undefined ? data.startDate : null,
          data.targetDate !== undefined ? data.targetDate : null,
          data.status !== undefined ? data.status : null,
          data.completedAt ? new Date(data.completedAt).toISOString() : null,
          data.lastEvaluatedAt ? new Date(data.lastEvaluatedAt).toISOString() : null,
          data.metadata !== undefined ? data.metadata : null,
          now,
          where.id,
        ]
      );
      await syncToDisk();
      return postgresDbClient.goal.findUnique({ where, include: { milestones: true } });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.goal.findUnique({ where });
      if (!existing) throw new Error("Goal not found");
      await pool.query("DELETE FROM goal_milestones WHERE goal_id = $1", [where.id]);
      await pool.query("DELETE FROM goals WHERE id = $1", [where.id]);
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM goals WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
    count: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.goal.findMany({ where });
      return list.length;
    },
  },
  goalMilestone: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM goal_milestones WHERE 1=1";
      const params: any[] = [];
      if (where?.goalId) {
        params.push(where.goalId);
        query += ` AND goal_id = $${params.length}`;
      }
      if (where?.percentage) {
        params.push(where.percentage);
        query += ` AND percentage = $${params.length}`;
      }
      query += " ORDER BY percentage ASC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        goalId: r.goal_id,
        percentage: Number(r.percentage),
        reachedAt: new Date(r.reached_at),
        notifiedAt: r.notified_at ? new Date(r.notified_at) : null,
        createdAt: new Date(r.created_at),
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; goalId_percentage?: { goalId: string; percentage: number } } }) => {
      const pool = await getPool();
      if (where.id) {
        const res = await pool.query("SELECT * FROM goal_milestones WHERE id = $1", [where.id]);
        if (!res.rows || res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          goalId: r.goal_id,
          percentage: Number(r.percentage),
          reachedAt: new Date(r.reached_at),
          notifiedAt: r.notified_at ? new Date(r.notified_at) : null,
          createdAt: new Date(r.created_at),
        };
      }
      if (where.goalId_percentage) {
        const res = await pool.query(
          "SELECT * FROM goal_milestones WHERE goal_id = $1 AND percentage = $2",
          [where.goalId_percentage.goalId, where.goalId_percentage.percentage]
        );
        if (!res.rows || res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          goalId: r.goal_id,
          percentage: Number(r.percentage),
          reachedAt: new Date(r.reached_at),
          notifiedAt: r.notified_at ? new Date(r.notified_at) : null,
          createdAt: new Date(r.created_at),
        };
      }
      return null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.goalMilestone.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `gm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const reachedAt = data.reachedAt ? new Date(data.reachedAt).toISOString() : new Date().toISOString();
      const notifiedAt = data.notifiedAt ? new Date(data.notifiedAt).toISOString() : null;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO goal_milestones (id, goal_id, percentage, reached_at, notified_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (goal_id, percentage) DO NOTHING`,
        [id, data.goalId, Number(data.percentage), reachedAt, notifiedAt, now]
      );
      await syncToDisk();
      return postgresDbClient.goalMilestone.findUnique({ where: { id } });
    },
    upsert: async ({ where, update, create }: { where: { goalId_percentage: { goalId: string; percentage: number } }; update: any; create: any }) => {
      const existing = await postgresDbClient.goalMilestone.findUnique({ where });
      if (existing) {
        const pool = await getPool();
        await pool.query(
          `UPDATE goal_milestones SET notified_at = COALESCE($1, notified_at) WHERE id = $2`,
          [update.notifiedAt ? new Date(update.notifiedAt).toISOString() : null, existing.id]
        );
        await syncToDisk();
        return postgresDbClient.goalMilestone.findUnique({ where: { id: existing.id } });
      }
      return postgresDbClient.goalMilestone.create({ data: create });
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM goal_milestones WHERE 1=1";
      const params: any[] = [];
      if (where?.goalId) {
        params.push(where.goalId);
        query += ` AND goal_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  achievement: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM achievements WHERE 1=1";
      const params: any[] = [];
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      query += " ORDER BY points ASC, name ASC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.category,
        icon: r.icon,
        points: Number(r.points || 50),
        targetValue: Number(r.target_value),
        unit: r.unit,
        isSystem: Boolean(r.is_system),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; code?: string } }) => {
      const pool = await getPool();
      const col = where.id ? "id" : "code";
      const val = where.id || where.code;
      const res = await pool.query(`SELECT * FROM achievements WHERE ${col} = $1`, [val]);
      if (!res.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.category,
        icon: r.icon,
        points: Number(r.points || 50),
        targetValue: Number(r.target_value),
        unit: r.unit,
        isSystem: Boolean(r.is_system),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.achievement.findMany({ where });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || data.code;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO achievements (id, code, name, description, category, icon, points, target_value, unit, is_system, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           icon = EXCLUDED.icon,
           points = EXCLUDED.points,
           target_value = EXCLUDED.target_value,
           unit = EXCLUDED.unit,
           updated_at = EXCLUDED.updated_at`,
        [
          id,
          data.code,
          data.name,
          data.description,
          data.category,
          data.icon,
          Number(data.points || 50),
          Number(data.targetValue),
          data.unit,
          data.isSystem !== undefined ? Boolean(data.isSystem) : true,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.achievement.findUnique({ where: { id } });
    },
    upsert: async ({ where, update, create }: { where: { id?: string; code?: string }; update: any; create: any }) => {
      return postgresDbClient.achievement.create({ data: { ...update, ...create } });
    },
  },
  userAchievement: {
    findMany: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM user_achievements WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.achievementId) {
        params.push(where.achievementId);
        query += ` AND achievement_id = $${params.length}`;
      }
      query += " ORDER BY created_at DESC";
      const res = await pool.query(query, params);
      const items = (res.rows || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        achievementId: r.achievement_id,
        currentProgress: Number(r.current_progress || 0),
        unlockedAt: r.unlocked_at ? new Date(r.unlocked_at) : null,
        metadata: r.metadata || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      if (include?.achievement) {
        for (const ua of items) {
          (ua as any).achievement = await postgresDbClient.achievement.findUnique({
            where: { id: ua.achievementId },
          });
        }
      }
      return items;
    },
    findUnique: async ({ where, include }: { where: { id?: string; userId_achievementId?: { userId: string; achievementId: string } }; include?: any }) => {
      const pool = await getPool();
      let res: any;
      if (where.id) {
        res = await pool.query("SELECT * FROM user_achievements WHERE id = $1", [where.id]);
      } else if (where.userId_achievementId) {
        res = await pool.query(
          "SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2",
          [where.userId_achievementId.userId, where.userId_achievementId.achievementId]
        );
      }
      if (!res?.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      const ua = {
        id: r.id,
        userId: r.user_id,
        achievementId: r.achievement_id,
        currentProgress: Number(r.current_progress || 0),
        unlockedAt: r.unlocked_at ? new Date(r.unlocked_at) : null,
        metadata: r.metadata || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
      if (include?.achievement) {
        (ua as any).achievement = await postgresDbClient.achievement.findUnique({
          where: { id: ua.achievementId },
        });
      }
      return ua;
    },
    findFirst: async ({ where, include }: { where?: any; include?: any } = {}) => {
      const list = await postgresDbClient.userAchievement.findMany({ where, include });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `ua_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, unlocked_at, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, achievement_id) DO UPDATE SET
           current_progress = EXCLUDED.current_progress,
           unlocked_at = COALESCE(user_achievements.unlocked_at, EXCLUDED.unlocked_at),
           metadata = EXCLUDED.metadata,
           updated_at = EXCLUDED.updated_at`,
        [
          id,
          data.userId,
          data.achievementId,
          Number(data.currentProgress || 0),
          data.unlockedAt ? new Date(data.unlockedAt).toISOString() : null,
          data.metadata || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.userAchievement.findUnique({ where: { id }, include: { achievement: true } });
    },
    upsert: async ({ where, update, create }: { where: { userId_achievementId: { userId: string; achievementId: string } }; update: any; create: any }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.userAchievement.findUnique({ where });
      if (existing) {
        const now = new Date().toISOString();
        await pool.query(
          `UPDATE user_achievements
           SET current_progress = COALESCE($1, current_progress),
               unlocked_at = COALESCE($2, unlocked_at),
               metadata = COALESCE($3, metadata),
               updated_at = $4
           WHERE id = $5`,
          [
            update.currentProgress !== undefined ? Number(update.currentProgress) : null,
            update.unlockedAt ? new Date(update.unlockedAt).toISOString() : null,
            update.metadata !== undefined ? update.metadata : null,
            now,
            existing.id,
          ]
        );
        await syncToDisk();
        return postgresDbClient.userAchievement.findUnique({ where: { id: existing.id }, include: { achievement: true } });
      }
      return postgresDbClient.userAchievement.create({ data: create });
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM user_achievements WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  challenge: {
    findMany: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM challenges WHERE 1=1";
      const params: any[] = [];
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      query += " ORDER BY duration_days ASC, title ASC";
      const res = await pool.query(query, params);
      const list = (res.rows || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        description: r.description,
        category: r.category,
        targetValue: Number(r.target_value),
        unit: r.unit,
        durationDays: Number(r.duration_days),
        badgeIcon: r.badge_icon,
        isSystem: Boolean(r.is_system),
        isPublic: Boolean(r.is_public),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      if (include?.participants) {
        for (const ch of list) {
          (ch as any).participants = await postgresDbClient.challengeParticipant.findMany({
            where: { challengeId: ch.id },
          });
        }
      }
      return list;
    },
    findUnique: async ({ where, include }: { where: { id?: string; code?: string }; include?: any }) => {
      const pool = await getPool();
      const col = where.id ? "id" : "code";
      const val = where.id || where.code;
      const res = await pool.query(`SELECT * FROM challenges WHERE ${col} = $1`, [val]);
      if (!res.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      const ch = {
        id: r.id,
        code: r.code,
        title: r.title,
        description: r.description,
        category: r.category,
        targetValue: Number(r.target_value),
        unit: r.unit,
        durationDays: Number(r.duration_days),
        badgeIcon: r.badge_icon,
        isSystem: Boolean(r.is_system),
        isPublic: Boolean(r.is_public),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
      if (include?.participants) {
        (ch as any).participants = await postgresDbClient.challengeParticipant.findMany({
          where: { challengeId: ch.id },
        });
      }
      return ch;
    },
    findFirst: async ({ where, include }: { where?: any; include?: any } = {}) => {
      const list = await postgresDbClient.challenge.findMany({ where, include });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || data.code;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO challenges (id, code, title, description, category, target_value, unit, duration_days, badge_icon, is_system, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           target_value = EXCLUDED.target_value,
           unit = EXCLUDED.unit,
           duration_days = EXCLUDED.duration_days,
           badge_icon = EXCLUDED.badge_icon,
           updated_at = EXCLUDED.updated_at`,
        [
          id,
          data.code,
          data.title,
          data.description,
          data.category,
          Number(data.targetValue),
          data.unit,
          Number(data.durationDays),
          data.badgeIcon,
          data.isSystem !== undefined ? Boolean(data.isSystem) : true,
          data.isPublic !== undefined ? Boolean(data.isPublic) : true,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.challenge.findUnique({ where: { id } });
    },
    upsert: async ({ where, update, create }: { where: { id?: string; code?: string }; update: any; create: any }) => {
      return postgresDbClient.challenge.create({ data: { ...update, ...create } });
    },
  },
  challengeParticipant: {
    findMany: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM challenge_participants WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.challengeId) {
        params.push(where.challengeId);
        query += ` AND challenge_id = $${params.length}`;
      }
      if (where?.status) {
        params.push(where.status);
        query += ` AND status = $${params.length}`;
      }
      query += " ORDER BY joined_at DESC";
      const res = await pool.query(query, params);
      const items = (res.rows || []).map((r: any) => ({
        id: r.id,
        challengeId: r.challenge_id,
        userId: r.user_id,
        status: r.status || "JOINED",
        currentProgress: Number(r.current_progress || 0),
        joinedAt: new Date(r.joined_at),
        completedAt: r.completed_at ? new Date(r.completed_at) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      if (include?.challenge) {
        for (const cp of items) {
          (cp as any).challenge = await postgresDbClient.challenge.findUnique({
            where: { id: cp.challengeId },
          });
        }
      }
      return items;
    },
    findUnique: async ({ where, include }: { where: { id?: string; challengeId_userId?: { challengeId: string; userId: string } }; include?: any }) => {
      const pool = await getPool();
      let res: any;
      if (where.id) {
        res = await pool.query("SELECT * FROM challenge_participants WHERE id = $1", [where.id]);
      } else if (where.challengeId_userId) {
        res = await pool.query(
          "SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
          [where.challengeId_userId.challengeId, where.challengeId_userId.userId]
        );
      }
      if (!res?.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      const cp = {
        id: r.id,
        challengeId: r.challenge_id,
        userId: r.user_id,
        status: r.status || "JOINED",
        currentProgress: Number(r.current_progress || 0),
        joinedAt: new Date(r.joined_at),
        completedAt: r.completed_at ? new Date(r.completed_at) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
      if (include?.challenge) {
        (cp as any).challenge = await postgresDbClient.challenge.findUnique({
          where: { id: cp.challengeId },
        });
      }
      return cp;
    },
    findFirst: async ({ where, include }: { where?: any; include?: any } = {}) => {
      const list = await postgresDbClient.challengeParticipant.findMany({ where, include });
      return list.length > 0 ? list[0] : null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO challenge_participants (id, challenge_id, user_id, status, current_progress, joined_at, completed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (challenge_id, user_id) DO UPDATE SET
           status = EXCLUDED.status,
           current_progress = EXCLUDED.current_progress,
           completed_at = EXCLUDED.completed_at,
           updated_at = EXCLUDED.updated_at`,
        [
          id,
          data.challengeId,
          data.userId,
          data.status || "JOINED",
          Number(data.currentProgress || 0),
          data.joinedAt ? new Date(data.joinedAt).toISOString() : now,
          data.completedAt ? new Date(data.completedAt).toISOString() : null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.challengeParticipant.findUnique({ where: { id }, include: { challenge: true } });
    },
    update: async ({ where, data }: { where: { id?: string; challengeId_userId?: { challengeId: string; userId: string } }; data: any }) => {
      const pool = await getPool();
      const now = new Date().toISOString();
      let whereClause = "";
      const params: any[] = [
        data.status !== undefined ? data.status : null,
        data.currentProgress !== undefined ? Number(data.currentProgress) : null,
        data.completedAt ? new Date(data.completedAt).toISOString() : null,
        now,
      ];
      if (where.id) {
        params.push(where.id);
        whereClause = `WHERE id = $${params.length}`;
      } else if (where.challengeId_userId) {
        params.push(where.challengeId_userId.challengeId);
        params.push(where.challengeId_userId.userId);
        whereClause = `WHERE challenge_id = $${params.length - 1} AND user_id = $${params.length}`;
      }
      await pool.query(
        `UPDATE challenge_participants
         SET status = COALESCE($1, status),
             current_progress = COALESCE($2, current_progress),
             completed_at = $3,
             updated_at = $4
         ${whereClause}`,
        params
      );
      await syncToDisk();
      return postgresDbClient.challengeParticipant.findUnique({ where, include: { challenge: true } });
    },
    upsert: async ({ where, update, create }: { where: { challengeId_userId: { challengeId: string; userId: string } }; update: any; create: any }) => {
      const existing = await postgresDbClient.challengeParticipant.findUnique({ where });
      if (existing) {
        return postgresDbClient.challengeParticipant.update({ where, data: update });
      }
      return postgresDbClient.challengeParticipant.create({ data: create });
    },
    delete: async ({ where }: { where: { id?: string; challengeId_userId?: { challengeId: string; userId: string } } }) => {
      const pool = await getPool();
      const existing = await postgresDbClient.challengeParticipant.findUnique({ where });
      if (!existing) throw new Error("Challenge participant not found");
      if (where.id) {
        await pool.query("DELETE FROM challenge_participants WHERE id = $1", [where.id]);
      } else if (where.challengeId_userId) {
        await pool.query("DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2", [
          where.challengeId_userId.challengeId,
          where.challengeId_userId.userId,
        ]);
      }
      await syncToDisk();
      return existing;
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM challenge_participants WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.challengeId) {
        params.push(where.challengeId);
        query += ` AND challenge_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  get aIConversation() {
    return this.aiConversation;
  },
  get aIMessage() {
    return this.aiMessage;
  },
  get aIMemory() {
    return this.aiMemory;
  },
  get Friendship() {
    return this.friendship;
  },
  get UserPrivacySettings() {
    return this.userPrivacySettings;
  },
  get PrivacySetting() {
    return this.privacySetting;
  },
  get privacySettings() {
    return this.privacySetting;
  },
  get FriendRecommendation() {
    return this.friendRecommendation;
  },
  get Notification() {
    return this.notification;
  },
  get IntegrationConnection() {
    return this.integrationConnection;
  },
  get integrationConnections() {
    return this.integrationConnection;
  },
  get PreApprovedUser() {
    return this.preApprovedUser;
  },
  get preApprovedUsers() {
    return this.preApprovedUser;
  },
  get FeatureRequest() {
    return this.featureRequest;
  },
  get featureRequests() {
    return this.featureRequest;
  },
  get Goal() {
    return this.goal;
  },
  get goals() {
    return this.goal;
  },
  get GoalMilestone() {
    return this.goalMilestone;
  },
  get goalMilestones() {
    return this.goalMilestone;
  },
  get Achievement() {
    return this.achievement;
  },
  get achievements() {
    return this.achievement;
  },
  get UserAchievement() {
    return this.userAchievement;
  },
  get userAchievements() {
    return this.userAchievement;
  },
  get Challenge() {
    return this.challenge;
  },
  get challenges() {
    return this.challenge;
  },
  get ChallengeParticipant() {
    return this.challengeParticipant;
  },
  get challengeParticipants() {
    return this.challengeParticipant;
  },
  weeklyPlan: {
    findMany: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM weekly_plans WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (where?.status) {
        params.push(where.status);
        query += ` AND status = $${params.length}`;
      }
      if (where?.startDate) {
        params.push(where.startDate);
        query += ` AND start_date = $${params.length}`;
      }
      query += " ORDER BY start_date DESC";
      const res = await pool.query(query, params);
      const plans = (res.rows || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        startDate: r.start_date,
        endDate: r.end_date,
        goalSummary: r.goal_summary,
        status: r.status || "ACTIVE",
        notes: r.notes || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      if (include?.items) {
        for (const p of plans) {
          (p as any).items = await postgresDbClient.weeklyPlanItem.findMany({
            where: { weeklyPlanId: p.id },
            orderBy: { date: "asc" },
          });
        }
      }
      return plans;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM weekly_plans WHERE id = $1", [where.id]);
      if (!res?.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      const plan = {
        id: r.id,
        userId: r.user_id,
        startDate: r.start_date,
        endDate: r.end_date,
        goalSummary: r.goal_summary,
        status: r.status || "ACTIVE",
        notes: r.notes || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
      if (include?.items) {
        (plan as any).items = await postgresDbClient.weeklyPlanItem.findMany({
          where: { weeklyPlanId: plan.id },
          orderBy: { date: "asc" },
        });
      }
      return plan;
    },
    findFirst: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any } = {}) => {
      const list = await postgresDbClient.weeklyPlan.findMany({ where, orderBy, include });
      return list[0] || null;
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `wplan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO weekly_plans (id, user_id, start_date, end_date, goal_summary, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          data.userId,
          data.startDate,
          data.endDate,
          data.goalSummary,
          data.status || "ACTIVE",
          data.notes || null,
          now,
          now,
        ]
      );
      if (data.items?.create && Array.isArray(data.items.create)) {
        for (const itm of data.items.create) {
          await postgresDbClient.weeklyPlanItem.create({
            data: {
              weeklyPlanId: id,
              date: itm.date,
              category: itm.category,
              title: itm.title,
              description: itm.description || null,
              targetData: typeof itm.targetData === "object" ? JSON.stringify(itm.targetData) : itm.targetData || null,
              isCompleted: itm.isCompleted || false,
            },
          });
        }
      }
      await syncToDisk();
      return postgresDbClient.weeklyPlan.findUnique({ where: { id }, include: { items: true } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const fields: string[] = [];
      const params: any[] = [where.id];
      if (data.goalSummary !== undefined) {
        params.push(data.goalSummary);
        fields.push(`goal_summary = $${params.length}`);
      }
      if (data.status !== undefined) {
        params.push(data.status);
        fields.push(`status = $${params.length}`);
      }
      if (data.notes !== undefined) {
        params.push(data.notes);
        fields.push(`notes = $${params.length}`);
      }
      params.push(new Date().toISOString());
      fields.push(`updated_at = $${params.length}`);
      if (fields.length > 0) {
        await pool.query(`UPDATE weekly_plans SET ${fields.join(", ")} WHERE id = $1`, params);
        await syncToDisk();
      }
      return postgresDbClient.weeklyPlan.findUnique({ where: { id: where.id }, include: { items: true } });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      await pool.query("DELETE FROM weekly_plan_items WHERE weekly_plan_id = $1", [where.id]);
      await pool.query("DELETE FROM weekly_plans WHERE id = $1", [where.id]);
      await syncToDisk();
      return { id: where.id };
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM weekly_plans WHERE 1=1";
      const params: any[] = [];
      if (where?.userId) {
        params.push(where.userId);
        query += ` AND user_id = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  weeklyPlanItem: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM weekly_plan_items WHERE 1=1";
      const params: any[] = [];
      if (where?.weeklyPlanId) {
        params.push(where.weeklyPlanId);
        query += ` AND weekly_plan_id = $${params.length}`;
      }
      if (where?.date) {
        params.push(where.date);
        query += ` AND date = $${params.length}`;
      }
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      query += " ORDER BY date ASC, created_at ASC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        weeklyPlanId: r.weekly_plan_id,
        date: r.date,
        category: r.category,
        title: r.title,
        description: r.description || null,
        targetData: r.target_data || null,
        isCompleted: Boolean(r.is_completed),
        matchedActivityId: r.matched_activity_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      const res = await pool.query("SELECT * FROM weekly_plan_items WHERE id = $1", [where.id]);
      if (!res?.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        weeklyPlanId: r.weekly_plan_id,
        date: r.date,
        category: r.category,
        title: r.title,
        description: r.description || null,
        targetData: r.target_data || null,
        isCompleted: Boolean(r.is_completed),
        matchedActivityId: r.matched_activity_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `witem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO weekly_plan_items (id, weekly_plan_id, date, category, title, description, target_data, is_completed, matched_activity_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          data.weeklyPlanId,
          data.date,
          data.category,
          data.title,
          data.description || null,
          typeof data.targetData === "object" ? JSON.stringify(data.targetData) : data.targetData || null,
          data.isCompleted ? true : false,
          data.matchedActivityId || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.weeklyPlanItem.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const pool = await getPool();
      const fields: string[] = [];
      const params: any[] = [where.id];
      if (data.title !== undefined) {
        params.push(data.title);
        fields.push(`title = $${params.length}`);
      }
      if (data.description !== undefined) {
        params.push(data.description);
        fields.push(`description = $${params.length}`);
      }
      if (data.category !== undefined) {
        params.push(data.category);
        fields.push(`category = $${params.length}`);
      }
      if (data.date !== undefined) {
        params.push(data.date);
        fields.push(`date = $${params.length}`);
      }
      if (data.isCompleted !== undefined) {
        params.push(Boolean(data.isCompleted));
        fields.push(`is_completed = $${params.length}`);
      }
      if (data.matchedActivityId !== undefined) {
        params.push(data.matchedActivityId || null);
        fields.push(`matched_activity_id = $${params.length}`);
      }
      if (data.targetData !== undefined) {
        params.push(typeof data.targetData === "object" ? JSON.stringify(data.targetData) : data.targetData || null);
        fields.push(`target_data = $${params.length}`);
      }
      params.push(new Date().toISOString());
      fields.push(`updated_at = $${params.length}`);
      if (fields.length > 0) {
        await pool.query(`UPDATE weekly_plan_items SET ${fields.join(", ")} WHERE id = $1`, params);
        await syncToDisk();
      }
      return postgresDbClient.weeklyPlanItem.findUnique({ where: { id: where.id } });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const pool = await getPool();
      await pool.query("DELETE FROM weekly_plan_items WHERE id = $1", [where.id]);
      await syncToDisk();
      return { id: where.id };
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      if (where?.weeklyPlanId) {
        await pool.query("DELETE FROM weekly_plan_items WHERE weekly_plan_id = $1", [where.weeklyPlanId]);
        await syncToDisk();
      }
      return { count: 1 };
    },
  },
  systemSetting: {
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      const pool = await getPool();
      let query = "SELECT * FROM system_settings WHERE 1=1";
      const params: any[] = [];
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      if (where?.key) {
        params.push(where.key);
        query += ` AND key = $${params.length}`;
      }
      query += " ORDER BY category ASC, key ASC";
      const res = await pool.query(query, params);
      return (res.rows || []).map((r: any) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        category: r.category,
        description: r.description || null,
        isSecret: Boolean(r.is_secret),
        updatedByAdminId: r.updated_by_admin_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; key?: string } }) => {
      const pool = await getPool();
      let query = "SELECT * FROM system_settings WHERE ";
      let param = "";
      if (where.id) {
        query += "id = $1";
        param = where.id;
      } else if (where.key) {
        query += "key = $1";
        param = where.key;
      } else {
        return null;
      }
      const res = await pool.query(query, [param]);
      if (!res?.rows || res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        key: r.key,
        value: r.value,
        category: r.category,
        description: r.description || null,
        isSecret: Boolean(r.is_secret),
        updatedByAdminId: r.updated_by_admin_id || null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      };
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const list = await postgresDbClient.systemSetting.findMany({ where });
      return list[0] || null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { key: string };
      create: any;
      update: any;
    }) => {
      const existing = await postgresDbClient.systemSetting.findUnique({ where });
      if (existing) {
        return postgresDbClient.systemSetting.update({ where: { key: where.key }, data: update });
      }
      return postgresDbClient.systemSetting.create({ data: create });
    },
    create: async ({ data }: { data: any }) => {
      const pool = await getPool();
      const id = data.id || `sset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO system_settings (id, key, value, category, description, is_secret, updated_by_admin_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          data.key,
          data.value,
          data.category || "GENERAL",
          data.description || null,
          data.isSecret !== undefined ? Boolean(data.isSecret) : false,
          data.updatedByAdminId || null,
          now,
          now,
        ]
      );
      await syncToDisk();
      return postgresDbClient.systemSetting.findUnique({ where: { id } });
    },
    update: async ({ where, data }: { where: { id?: string; key?: string }; data: any }) => {
      const pool = await getPool();
      const fields: string[] = [];
      const params: any[] = [];
      const keyCol = where.id ? "id" : "key";
      const keyVal = where.id || where.key;

      if (data.value !== undefined) {
        params.push(data.value);
        fields.push(`value = $${params.length}`);
      }
      if (data.category !== undefined) {
        params.push(data.category);
        fields.push(`category = $${params.length}`);
      }
      if (data.description !== undefined) {
        params.push(data.description);
        fields.push(`description = $${params.length}`);
      }
      if (data.isSecret !== undefined) {
        params.push(Boolean(data.isSecret));
        fields.push(`is_secret = $${params.length}`);
      }
      if (data.updatedByAdminId !== undefined) {
        params.push(data.updatedByAdminId);
        fields.push(`updated_by_admin_id = $${params.length}`);
      }
      params.push(new Date().toISOString());
      fields.push(`updated_at = $${params.length}`);

      params.push(keyVal);
      if (fields.length > 0) {
        await pool.query(`UPDATE system_settings SET ${fields.join(", ")} WHERE ${keyCol} = $${params.length}`, params);
        await syncToDisk();
      }
      return postgresDbClient.systemSetting.findUnique({ where });
    },
    delete: async ({ where }: { where: { id?: string; key?: string } }) => {
      const pool = await getPool();
      const keyCol = where.id ? "id" : "key";
      const keyVal = where.id || where.key;
      await pool.query(`DELETE FROM system_settings WHERE ${keyCol} = $1`, [keyVal]);
      await syncToDisk();
      return { success: true };
    },
    deleteMany: async ({ where }: { where?: any } = {}) => {
      const pool = await getPool();
      let query = "DELETE FROM system_settings WHERE 1=1";
      const params: any[] = [];
      if (where?.category) {
        params.push(where.category);
        query += ` AND category = $${params.length}`;
      }
      if (where?.key) {
        params.push(where.key);
        query += ` AND key = $${params.length}`;
      }
      const res = await pool.query(query, params);
      await syncToDisk();
      return { count: res.rowCount || 0 };
    },
  },
  get SystemSetting() {
    return this.systemSetting;
  },
  get systemSettings() {
    return this.systemSetting;
  },
  get WeeklyPlan() {
    return this.weeklyPlan;
  },
  get weeklyPlans() {
    return this.weeklyPlan;
  },
  get WeeklyPlanItem() {
    return this.weeklyPlanItem;
  },
  get weeklyPlanItems() {
    return this.weeklyPlanItem;
  },
};

/**
 * Centralized Database Client Instance
 * Automatically connects to production PostgreSQL via PrismaClient when DATABASE_URL is configured.
 * Seamlessly provides local development PostgreSQL emulation when offline / in sandbox mode.
 */
const effectiveDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

if (!process.env.DATABASE_URL && effectiveDatabaseUrl) {
  process.env.DATABASE_URL = effectiveDatabaseUrl;
}

const isRealPostgresConfigured = Boolean(
  process.env.FORCE_REAL_POSTGRES === "true" ||
  (process.env.VERCEL === "1" && effectiveDatabaseUrl) ||
  (effectiveDatabaseUrl &&
    (effectiveDatabaseUrl.startsWith("postgres://") || effectiveDatabaseUrl.startsWith("postgresql://")) &&
    !effectiveDatabaseUrl.includes("localhost:5432") &&
    !effectiveDatabaseUrl.includes("127.0.0.1:5432") &&
    !effectiveDatabaseUrl.includes("mock") &&
    !effectiveDatabaseUrl.includes("placeholder"))
);

function wrapWithModelAliases(client: any): any {
  if (!client) return client;
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (typeof prop === "string") {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        if (prop === "aiConversation") return target.aIConversation || target.aiConversation;
        if (prop === "aiMessage") return target.aIMessage || target.aiMessage;
        if (prop === "aiMemory") return target.aIMemory || target.aiMemory;
        if (prop === "aIConversation") return target.aiConversation || target.aIConversation;
        if (prop === "aIMessage") return target.aiMessage || target.aIMessage;
        if (prop === "aIMemory") return target.aiMemory || target.aIMemory;
        if (prop === "weeklyPlan") return target.WeeklyPlan || target.weeklyPlan;
        if (prop === "weeklyPlanItem") return target.WeeklyPlanItem || target.weeklyPlanItem;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const rawPrisma = isRealPostgresConfigured
  ? (globalForPrisma.prisma ??
      (globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })))
  : (postgresDbClient as unknown as PrismaClient);

export const prisma: PrismaClient = wrapWithModelAliases(rawPrisma);

export default prisma;

