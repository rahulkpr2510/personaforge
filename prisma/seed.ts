import { PrismaClient, TechnicalLevel, UserRole } from "@prisma/client";
import "dotenv/config";

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  // Optional: create an initial admin user you can associate with later
  const admin = await prisma.user.upsert({
    where: { email: "rahulkpr2510@gmail.com" },
    update: {},
    create: {
      email: "rahulkpr2510@gmail.com",
      clerkId: "user_3FAVGzv6rTo2buKvuwrgyvzUAKI", // you can update this to match a real Clerk user later
      name: "Seed Admin",
      role: UserRole.ADMIN,
    },
  });

  // Prebuilt personas (ownerId null, isPrebuilt = true)
  const prebuilt = [
    {
      label: "Student",
      name: "Aarav, 20-year-old CS student",
      age: 20,
      occupation: "Undergraduate student",
      technicalLevel: TechnicalLevel.HIGH,
      goals:
        "Quickly understand product value, sign up using minimal friction, compare plans and discounts.",
      frustrations:
        "Long forms, unclear pricing, hidden student discounts, slow navigation.",
      isPrebuilt: true,
    },
    {
      label: "Software Developer",
      name: "Priya, 28-year-old backend engineer",
      age: 28,
      occupation: "Software engineer",
      technicalLevel: TechnicalLevel.HIGH,
      goals:
        "Evaluate technical depth, API docs, performance and integration details before adopting a tool.",
      frustrations:
        "Marketing-heavy pages, missing docs, no clear onboarding path, lack of dark mode.",
      isPrebuilt: true,
    },
    {
      label: "Senior Citizen",
      name: "Ramesh, 62-year-old retired banker",
      age: 62,
      occupation: "Retired banker",
      technicalLevel: TechnicalLevel.LOW,
      goals:
        "Complete simple tasks safely (pay bills, check balances) with clear guidance.",
      frustrations:
        "Small fonts, low contrast, too many options, confusing jargon.",
      isPrebuilt: true,
    },
    {
      label: "Small Business Owner",
      name: "Anita, 40-year-old shop owner",
      age: 40,
      occupation: "Retail shop owner",
      technicalLevel: TechnicalLevel.MEDIUM,
      goals:
        "Understand pricing quickly, see value for business, get started without IT support.",
      frustrations:
        "Complex onboarding, unclear ROI, hidden fees, lack of human support options.",
      isPrebuilt: true,
    },
    {
      label: "Accessibility User",
      name: "Vikram, 30-year-old screen reader user",
      age: 30,
      occupation: "Support specialist",
      technicalLevel: TechnicalLevel.MEDIUM,
      goals:
        "Access all flows via keyboard/screen reader with proper semantics and labels.",
      frustrations:
        "Missing ARIA labels, unlabeled buttons, keyboard traps, low contrast.",
      isPrebuilt: true,
    },
  ];

  for (const p of prebuilt) {
    await prisma.persona.upsert({
      where: { label: p.label },
      update: {},
      create: {
        ...p,
        ownerId: null,
        tags: [],
      },
    });
  }

  console.log("Seed completed. Admin:", admin.email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
