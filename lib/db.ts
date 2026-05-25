import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = global.prisma || new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

if (process.env.NODE_ENV === "development") {
  global.prisma = db;
}

export default db;