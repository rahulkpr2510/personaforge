import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Next.js needs this to use the neon serverless driver over WebSocket
neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion: number | undefined;
};

// Increment schema version whenever Prisma schema changes so hot-reload recreates the client
const SCHEMA_VERSION = 2;

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaVersion !== SCHEMA_VERSION
) {
  globalForPrisma.prisma.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaVersion = SCHEMA_VERSION;
}
