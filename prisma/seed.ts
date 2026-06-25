import { PrismaClient, TechnicalLevel } from "@prisma/client";

const db = new PrismaClient();

const PREBUILT_PERSONAS: Array<{
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: TechnicalLevel;
  goals: string;
  frustrations: string;
  tags: string[];
}> = [
  {
    label: "Student",
    name: "Alex Chen",
    age: 20,
    occupation: "University Student",
    technicalLevel: "MEDIUM",
    goals:
      "Find information quickly and cheaply. Access resources from a mobile device.",
    frustrations:
      "Paywalls, complex navigation, slow-loading pages, forms with too many fields.",
    tags: ["student", "mobile-first", "budget-conscious"],
  },
  {
    label: "Software Developer",
    name: "Priya Sharma",
    age: 28,
    occupation: "Senior Frontend Engineer",
    technicalLevel: "HIGH",
    goals:
      "Access technical documentation, evaluate developer experience, find API references.",
    frustrations:
      "Lack of technical depth, missing keyboard shortcuts, no dark mode, cluttered UI.",
    tags: ["developer", "technical", "power-user"],
  },
  {
    label: "Senior Citizen",
    name: "Robert Wilson",
    age: 68,
    occupation: "Retired Teacher",
    technicalLevel: "LOW",
    goals:
      "Complete simple tasks without confusion. Understand what the website offers immediately.",
    frustrations:
      "Small text, confusing jargon, too many options, no phone support, auto-playing media.",
    tags: ["senior", "accessibility", "low-tech"],
  },
  {
    label: "Small Business Owner",
    name: "Maria Santos",
    age: 42,
    occupation: "Owner, Retail Boutique",
    technicalLevel: "MEDIUM",
    goals:
      "Quickly assess value proposition and pricing. Evaluate if the tool saves time.",
    frustrations:
      "Hidden pricing, long onboarding, unclear ROI, no free trial.",
    tags: ["business", "pragmatic", "value-focused"],
  },
  {
    label: "Teacher",
    name: "James Okafor",
    age: 35,
    occupation: "High School Science Teacher",
    technicalLevel: "MEDIUM",
    goals: "Find usable classroom tools. Share resources easily with students.",
    frustrations:
      "Expensive subscriptions, student data privacy concerns, complex setup.",
    tags: ["educator", "collaborative", "budget-constrained"],
  },
  {
    label: "Accessibility User",
    name: "Linda Park",
    age: 45,
    occupation: "Administrative Coordinator",
    technicalLevel: "MEDIUM",
    goals:
      "Navigate the site using a screen reader and keyboard only. Access all features without a mouse.",
    frustrations:
      "Missing alt text, poor focus indicators, inaccessible modals, low color contrast.",
    tags: ["accessibility", "screen-reader", "keyboard-navigation"],
  },
  {
    label: "Product Manager",
    name: "David Kim",
    age: 33,
    occupation: "Senior Product Manager, SaaS",
    technicalLevel: "HIGH",
    goals:
      "Evaluate the product's competitive positioning, onboarding flow, and feature set.",
    frustrations:
      "Vague feature descriptions, no comparison charts, unclear user personas.",
    tags: ["product", "strategic", "decision-maker"],
  },
  {
    label: "Banker",
    name: "Susan Patel",
    age: 55,
    occupation: "Branch Manager, Commercial Bank",
    technicalLevel: "LOW",
    goals:
      "Assess credibility and trustworthiness. Find security and compliance information.",
    frustrations: "Informal tone, missing trust signals, overwhelming design.",
    tags: ["finance", "trust-focused", "conservative"],
  },
];

async function main() {
  console.log("Seeding prebuilt personas...");

  for (const persona of PREBUILT_PERSONAS) {
    await db.persona.upsert({
      where: { label: persona.label },
      create: {
        label: persona.label,
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        technicalLevel: persona.technicalLevel,
        goals: persona.goals,
        frustrations: persona.frustrations,
        tags: [...persona.tags],
        isPrebuilt: true,
        isActive: true,
      },
      update: {
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        technicalLevel: persona.technicalLevel,
        goals: persona.goals,
        frustrations: persona.frustrations,
        tags: [...persona.tags],
        isPrebuilt: true,
        isActive: true,
      },
    });
    console.log(`✓ ${persona.label}`);
  }

  console.log(`Seeded ${PREBUILT_PERSONAS.length} prebuilt personas.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
