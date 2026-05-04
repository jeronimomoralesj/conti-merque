import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "conti_merque";

const [, , usernameArg, passwordArg, roleArg] = process.argv;
if (!usernameArg || !passwordArg) {
  console.error(
    "Usage: tsx scripts/create-user.ts <username> <password> [user|master]"
  );
  process.exit(1);
}
const username = usernameArg.toLowerCase().trim();
const role: "master" | "user" = roleArg === "master" ? "master" : "user";

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const users = client.db(dbName).collection("users");
  await users.createIndex({ username: 1 }, { unique: true });

  const passwordHash = await bcrypt.hash(passwordArg, 10);
  const now = new Date();
  const r = await users.updateOne(
    { username },
    {
      $set: { passwordHash, role },
      $setOnInsert: { username, createdAt: now, createdBy: "script" },
    },
    { upsert: true }
  );
  if (r.upsertedCount) console.log(`Created ${role}: ${username}`);
  else console.log(`Updated existing user: ${username} (role=${role}, password reset)`);
  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
