import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// User roles
const UserRole = {
  ADMIN: "ADMIN",
  RECRUITER: "RECRUITER",
  INTERVIEWER: "INTERVIEWER",
} as const;

// Application statuses
const ApplicationStatus = {
  PENDING: "PENDING",
  WAIT_RESULT: "WAIT_RESULT",
  PASS_INTERVIEW: "PASS_INTERVIEW",
  REJECT_INTERVIEW: "REJECT_INTERVIEW",
  REJECT: "REJECT",
} as const;

async function main() {
  console.log("Seeding database...");

  console.log("Seeding admin user...");
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    10
  );

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@demo.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@demo.com",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("Seeding sample recruiter...");
  const recruiterPassword = await bcrypt.hash("recruiter123", 10);
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@demo.com" },
    update: {},
    create: {
      email: "recruiter@demo.com",
      passwordHash: recruiterPassword,
      role: UserRole.RECRUITER,
      isActive: true,
      firstName: "Recruiter",
      lastName: "User",
    },
  });

  console.log("Seeding sample interviewer...");
  const interviewerPassword = await bcrypt.hash("interviewer123", 10);
  const interviewer = await prisma.user.upsert({
    where: { email: "interviewer@demo.com" },
    update: {},
    create: {
      email: "interviewer@demo.com",
      passwordHash: interviewerPassword,
      role: UserRole.INTERVIEWER,
      isActive: true,
      firstName: "Interviewer",
      lastName: "User",
    },
  });

  console.log("Seeding completed successfully!");
  console.log({
    admin: { email: admin.email, role: admin.role },
    recruiter: { email: recruiter.email, role: recruiter.role },
    interviewer: { email: interviewer.email, role: interviewer.role },
  });
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
