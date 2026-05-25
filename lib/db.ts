import { PrismaClient } from "@prisma/client";

const db = global.prisma || new PrismaClient({
    log: ["query", "info", "warn", "error"],
})

if (process.env.NODE_ENV === "development") {
    global.prisma = db;
}

export default db;