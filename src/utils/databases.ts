import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";

const redis = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const prisma = new PrismaClient();

export { prisma, redis };
