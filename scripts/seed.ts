import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "conti_merque";

if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  await users.createIndex({ username: 1 }, { unique: true });

  const existing = await users.findOne({ username: "admin" });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin", 10);
    await users.insertOne({
      username: "admin",
      passwordHash,
      role: "master",
      createdAt: new Date(),
      createdBy: "seed",
    });
    console.log('Seeded master user: admin / admin (CHANGE ON FIRST LOGIN)');
  } else {
    console.log("Master user 'admin' already exists, skipping.");
  }

  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
