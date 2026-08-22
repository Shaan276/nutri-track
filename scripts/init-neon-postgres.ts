import { Pool } from "pg";
import bcrypt from "bcryptjs";

const NEON_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_zvjlA8fZOWm7@ep-small-union-avwsvu5b-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function initFullNeonPostgres() {
  console.log("\n================================================================================");
  console.log("🐘 PROVISIONING COMPLETE SCHEMAS ON NEON POSTGRESQL");
  console.log("================================================================================\n");

  const pool = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected to Neon PostgreSQL.\n");

    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191),
        email VARCHAR(191) UNIQUE,
        username VARCHAR(191) UNIQUE,
        password_hash VARCHAR(191),
        role VARCHAR(50) DEFAULT 'USER',
        account_status VARCHAR(50) DEFAULT 'APPROVED',
        approved_at TIMESTAMP,
        approved_by_admin_id VARCHAR(191),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) UNIQUE NOT NULL,
        age INT,
        gender VARCHAR(50),
        height_cm FLOAT,
        weight_kg FLOAT,
        activity_level VARCHAR(50),
        primary_goal VARCHAR(50),
        daily_calorie_target INT,
        daily_water_ml INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS system_settings (
        id VARCHAR(191) PRIMARY KEY,
        key VARCHAR(191) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        is_secret BOOLEAN DEFAULT FALSE,
        updated_by_admin_id VARCHAR(191),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS meal_logs (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        meal_type VARCHAR(50) NOT NULL,
        name VARCHAR(191) NOT NULL,
        calories FLOAT NOT NULL,
        protein_g FLOAT NOT NULL,
        carbs_g FLOAT NOT NULL,
        fat_g FLOAT NOT NULL,
        logged_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS hydration_logs (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        amount_ml INT NOT NULL,
        logged_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        name VARCHAR(191) NOT NULL,
        duration_minutes INT NOT NULL,
        calories_burned FLOAT NOT NULL,
        distance_km FLOAT,
        logged_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS workout_sessions (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        duration_minutes INT NOT NULL,
        calories_burned FLOAT NOT NULL,
        exercises JSONB,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS weekly_plans (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        week_start_date TIMESTAMP NOT NULL,
        week_end_date TIMESTAMP NOT NULL,
        target_calories INT,
        target_water_ml INT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS weekly_plan_items (
        id VARCHAR(191) PRIMARY KEY,
        weekly_plan_id VARCHAR(191) NOT NULL,
        day_of_week VARCHAR(50) NOT NULL,
        meal_type VARCHAR(50),
        title VARCHAR(191) NOT NULL,
        target_calories INT,
        target_protein_g FLOAT,
        target_carbs_g FLOAT,
        target_fat_g FLOAT,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS foods (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191),
        name VARCHAR(191) NOT NULL,
        brand VARCHAR(191),
        serving_size VARCHAR(100),
        calories FLOAT NOT NULL,
        protein_g FLOAT NOT NULL,
        carbs_g FLOAT NOT NULL,
        fat_g FLOAT NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS user_goals (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        type VARCHAR(50) NOT NULL,
        target_value FLOAT NOT NULL,
        current_value FLOAT DEFAULT 0,
        unit VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS user_achievements (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        badge_key VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS feature_requests (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        status VARCHAR(50) DEFAULT 'OPEN',
        admin_response TEXT,
        responded_at TIMESTAMP,
        responded_by_admin_id VARCHAR(191),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        actor_id VARCHAR(191),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        action_url VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
    ];

    for (const q of tableQueries) {
      await client.query(q);
    }
    console.log("  ✓ All 14 application tables created and verified in Neon PostgreSQL!");

    // Seed/Update Admin
    const adminEmail = "piyushpilkhwal74@gmail.com";
    const adminUsername = "shaan276";
    const adminPassHash = await bcrypt.hash("Shaan@946", 10);

    const existingAdmin = await client.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [adminEmail, adminUsername]
    );

    if (existingAdmin.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, name, email, username, password_hash, role, account_status, approved_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          "user_piyush_admin",
          "Piyush Pilkhwal",
          adminEmail,
          adminUsername,
          adminPassHash,
          "ADMIN",
          "APPROVED",
        ]
      );
      console.log("  ⭐ Admin account created in Neon database!");
    } else {
      await client.query(
        `UPDATE users SET password_hash = $1, role = 'ADMIN', account_status = 'APPROVED' WHERE email = $2 OR username = $3`,
        [adminPassHash, adminEmail, adminUsername]
      );
      console.log("  ⭐ Admin account verified in Neon database!");
    }

    client.release();
    console.log("\n================================================================================");
    console.log("✅ FULL NEON POSTGRESQL PROVISIONING COMPLETE!");
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ Error provisioning Neon:", err.message);
  } finally {
    await pool.end();
  }
}

initFullNeonPostgres();
