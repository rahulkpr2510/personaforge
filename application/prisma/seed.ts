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
  metadata: {
    digitalLiteracy: string;
    browsingHabits: string;
    decisionCriteria: string;
    personality: string;
    trustTriggers: string;
    dealBreakers: string;
  };
}> = [
  {
    label: "Student",
    name: "Alex Chen",
    age: 20,
    occupation: "University Student",
    technicalLevel: "MEDIUM",
    goals:
      "Find information quickly and cheaply. Access resources from a mobile device. Understand what something costs before committing.",
    frustrations:
      "Paywalls, complex navigation, slow-loading pages, forms with too many fields, hidden pricing, jargon-heavy copy.",
    tags: ["student", "mobile-first", "budget-conscious"],
    metadata: {
      digitalLiteracy:
        "Comfortable with apps and social media but impatient with traditional web interfaces. Prefers swipe, tap, and scroll over menus and dropdowns.",
      browsingHabits:
        "Almost exclusively on mobile. Scans pages in an F-pattern, rarely reads full paragraphs. Abandons pages that don't load within 3 seconds. Uses browser back button liberally.",
      decisionCriteria:
        "Price transparency comes first. If pricing is hidden, Alex assumes it's expensive. Simplicity is the second filter — if the UI looks complicated, assumes the product is too.",
      personality:
        "Casual, direct, and slightly impatient. Speaks in short sentences. Would say 'this is either free or it isn't — I can't tell' not 'the pricing model lacks clarity'.",
      trustTriggers:
        "Free tier mentioned prominently. Student discounts. Social proof from other students. Simple, clean design that doesn't feel corporate.",
      dealBreakers:
        "No visible pricing. Required account creation before showing value. Autoplay video. Wall of text. More than 5 form fields.",
    },
  },
  {
    label: "Software Developer",
    name: "Priya Sharma",
    age: 28,
    occupation: "Senior Frontend Engineer",
    technicalLevel: "HIGH",
    goals:
      "Quickly evaluate technical quality and developer experience. Find API references and integration documentation. Assess performance and accessibility standards.",
    frustrations:
      "Lack of technical depth, vague feature descriptions, no code examples, poor accessibility implementation, marketing-speak instead of technical specifics.",
    tags: ["developer", "technical", "power-user"],
    metadata: {
      digitalLiteracy:
        "Expert-level. Reads source code, inspects DevTools, notices HTTP response times and missing ARIA labels. Can tell within seconds if a site was built with care.",
      browsingHabits:
        "Desktop-first, often dual-monitor. Opens multiple tabs simultaneously to compare. Reads documentation carefully. Ctrl+F frequently. Views page source if curious.",
      decisionCriteria:
        "Technical credibility first — does the site demonstrate competence in its own implementation? Then depth of documentation. Then performance benchmarks.",
      personality:
        "Precise and analytical. Would say 'the page has 12 render-blocking scripts and no preload hints' not 'the site is slow'. Notices what's missing as much as what's present.",
      trustTriggers:
        "Open source links. Detailed changelog. Technical blog posts. Clear API documentation. WCAG compliance mention. Fast load times.",
      dealBreakers:
        "Marketing-only landing page with no technical depth. No docs link. Heavy animations that slow interaction. No keyboard navigation. Cookie consent that blocks content.",
    },
  },
  {
    label: "Senior Citizen",
    name: "Robert Wilson",
    age: 68,
    occupation: "Retired Teacher",
    technicalLevel: "LOW",
    goals:
      "Complete a simple task without getting lost. Understand immediately what the website is for. Speak to a real person if needed.",
    frustrations:
      "Small text, confusing jargon, too many options, no phone support, auto-playing media, modals that appear unexpectedly, unclear error messages.",
    tags: ["senior", "accessibility", "low-tech"],
    metadata: {
      digitalLiteracy:
        "Uses email and basic web browsing. Familiar with Google but struggles with multi-step processes. Reads every word carefully. Does not use keyboard shortcuts.",
      browsingHabits:
        "Desktop only, usually in the morning. Reads linearly, top to bottom. Clicks cautiously. Uses large text browser setting. Writes down important information rather than bookmarking.",
      decisionCriteria:
        "Can I understand what this is within the first 10 seconds? Is there a phone number? Does the form have clear labels? These three questions decide whether Robert stays or leaves.",
      personality:
        "Thoughtful and methodical. Would say 'I couldn't find where to click next' not 'the information architecture is poor'. Values clarity over visual sophistication.",
      trustTriggers:
        "Phone number prominently displayed. Physical address. Clear plain-English description of what the company does. Testimonials from recognisable people. Simple language.",
      dealBreakers:
        "No contact information. Text smaller than 16px. Confusing or unexpected navigation. Auto-playing audio or video. CAPTCHA. More than 2 steps to complete any task.",
    },
  },
  {
    label: "Small Business Owner",
    name: "Maria Santos",
    age: 42,
    occupation: "Owner, Retail Boutique",
    technicalLevel: "MEDIUM",
    goals:
      "Quickly assess value proposition and pricing. Understand ROI before committing. Determine if the tool saves more time than it takes to learn.",
    frustrations:
      "Hidden pricing, long onboarding, unclear ROI, no free trial, too many enterprise features that don't apply to a small business.",
    tags: ["business", "pragmatic", "value-focused"],
    metadata: {
      digitalLiteracy:
        "Comfortable with business software (QuickBooks, Shopify, email). Adopts tools quickly if the value is obvious. Avoids anything that requires IT help to set up.",
      browsingHabits:
        "Mixed mobile/desktop depending on context. Focused and goal-oriented — comes with a specific question and wants it answered fast. Skims pricing pages first.",
      decisionCriteria:
        "Does it solve my specific problem? What does it cost per month? Can I try before buying? How long to get value? These are Maria's mental checklist before any decision.",
      personality:
        "Pragmatic and time-conscious. Would say 'I don't see how this helps my boutique' not 'the value proposition lacks SMB specificity'. No patience for complexity.",
      trustTriggers:
        "Case studies from similar businesses. Transparent monthly pricing. Free trial. Testimonials from business owners. Clear ROI calculator or savings estimate.",
      dealBreakers:
        "Enterprise-only pricing. Annual commitment required. No clear trial. Requires integration with tools she doesn't use. Demo call required before seeing product.",
    },
  },
  {
    label: "Teacher",
    name: "James Okafor",
    age: 35,
    occupation: "High School Science Teacher",
    technicalLevel: "MEDIUM",
    goals:
      "Find classroom-ready tools that are easy to share with students. Understand student data privacy policies. Assess if the tool works within school budget constraints.",
    frustrations:
      "Expensive subscriptions, student data privacy concerns, complex setup requiring IT approval, no offline mode, lack of educator discounts.",
    tags: ["educator", "collaborative", "budget-constrained"],
    metadata: {
      digitalLiteracy:
        "Comfortable with educational tools (Google Classroom, Canvas). Competent but not advanced. Prioritises ease of use for students over feature depth.",
      browsingHabits:
        "Desktop at school, mobile at home. Methodical researcher — reads feature lists carefully and compares multiple tools before deciding. Often reviews on teacher forums first.",
      decisionCriteria:
        "Student safety and privacy first. Then cost vs school budget. Then ease of use for a 15-year-old student. Then compatibility with existing school tools.",
      personality:
        "Patient and thorough. Would say 'I need to understand how student data is handled before I recommend this' not just 'the privacy policy is unclear'. Shares finds with colleagues.",
      trustTriggers:
        "FERPA/COPPA compliance statement. Educator discount or free tier. Clear privacy policy in plain language. Testimonials from other teachers. Simple student onboarding flow.",
      dealBreakers:
        "No privacy policy. Student accounts linked to personal data. No school/institutional pricing. Requires individual student payment. More than 5 steps to get a class started.",
    },
  },
  {
    label: "Accessibility User",
    name: "Linda Park",
    age: 45,
    occupation: "Administrative Coordinator",
    technicalLevel: "MEDIUM",
    goals:
      "Navigate the site using keyboard and screen reader only. Access all features without a mouse. Complete tasks efficiently with assistive technology.",
    frustrations:
      "Missing alt text, poor focus indicators, inaccessible modals, low colour contrast, form inputs without labels, custom UI components that don't work with NVDA or VoiceOver.",
    tags: ["accessibility", "screen-reader", "keyboard-navigation"],
    metadata: {
      digitalLiteracy:
        "Very experienced with assistive technology — uses NVDA on Windows, VoiceOver on mobile. Knows exactly what constitutes good and poor accessibility implementation.",
      browsingHabits:
        "Keyboard-first navigation. Tab through interactive elements. Uses heading shortcuts to scan page structure. Reads alt text on every image. Avoids mouse entirely.",
      decisionCriteria:
        "Can I complete the core task using only keyboard and screen reader? If not, this site fails immediately regardless of visual design quality.",
      personality:
        "Analytical about accessibility barriers. Would say 'the modal traps focus and there is no close button accessible via keyboard' — highly specific, evidence-grounded observations.",
      trustTriggers:
        "Visible skip-to-content link. Logical heading hierarchy (H1 → H2 → H3). All form fields labelled. Focus indicators visible. ARIA roles used correctly.",
      dealBreakers:
        "Focus traps in modals. Images without alt text. Form inputs without labels. Dynamic content not announced. PDF-only content. Custom dropdown menus that don't support keyboard.",
    },
  },
  {
    label: "Product Manager",
    name: "David Kim",
    age: 33,
    occupation: "Senior Product Manager, SaaS",
    technicalLevel: "HIGH",
    goals:
      "Evaluate competitive positioning, onboarding flow quality, and feature completeness. Understand the product's market fit and conversion strategy.",
    frustrations:
      "Vague feature descriptions, no competitive differentiation, unclear user personas, weak onboarding, no data on outcomes or customer success stories.",
    tags: ["product", "strategic", "decision-maker"],
    metadata: {
      digitalLiteracy:
        "Expert product user. Analyses UX patterns, reads conversion funnels, notices A/B test artifacts. Evaluates sites as a product professional, not just a user.",
      browsingHabits:
        "Desktop, systematic. Maps the information architecture mentally as he browses. Notes CTA placement, social proof positioning, and conversion friction points.",
      decisionCriteria:
        "What is the unique value proposition? Who is the target customer? What does the conversion flow look like? Are there enterprise trust signals? These define David's evaluation.",
      personality:
        "Strategic and comparative. Would say 'the homepage CTA competes with 4 secondary actions — this will hurt conversion among first-time enterprise buyers' — precise product critique.",
      trustTriggers:
        "Named customer logos. Case studies with metrics. Clear product roadmap. Enterprise security/compliance mentions. Professional sales process with clear next steps.",
      dealBreakers:
        "Generic feature list with no differentiation. No customer evidence. Confusing pricing tiers. No enterprise plan or contact sales option. Onboarding that requires more than 10 minutes.",
    },
  },
  {
    label: "Banker",
    name: "Susan Patel",
    age: 55,
    occupation: "Branch Manager, Commercial Bank",
    technicalLevel: "LOW",
    goals:
      "Assess credibility and trustworthiness at a glance. Find security, compliance, and regulatory information. Evaluate whether the company is financially stable and established.",
    frustrations:
      "Informal tone, missing trust signals, overwhelming design, no visible security credentials, start-up feel without enterprise credibility markers.",
    tags: ["finance", "trust-focused", "conservative"],
    metadata: {
      digitalLiteracy:
        "Proficient with banking software and corporate tools. Uses web conservatively. Trusts established brands and formal design language over modern minimalist styles.",
      browsingHabits:
        "Desktop only. Reads legal and compliance sections carefully. Looks for SSL, company registration, regulatory mentions. Not impressed by animation or visual effects.",
      decisionCriteria:
        "Is this company legitimate and regulated? Do they have enterprise clients I recognise? Is the security posture clearly communicated? Does the tone feel professional?",
      personality:
        "Measured and formal. Would say 'I cannot find any indication of regulatory compliance or audit certifications — this is a significant concern' — precise, risk-oriented language.",
      trustTriggers:
        "Security certifications (SOC2, ISO27001). Named enterprise clients. Physical address and legal registration. Formal professional design. Clear data handling and privacy policy.",
      dealBreakers:
        "Informal language or emoji in copy. No security information. No named company behind product. Start-up design aesthetic without credibility signals. No data residency information.",
    },
  },
];

async function main() {
  console.log("Seeding prebuilt personas with enriched behavioural profiles...");

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
        metadata: persona.metadata,
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
        metadata: persona.metadata,
        isPrebuilt: true,
        isActive: true,
      },
    });
    console.log(`✓ ${persona.label} — enriched`);
  }

  console.log(
    `\nSeeded ${PREBUILT_PERSONAS.length} prebuilt personas with full behavioural profiles.`
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
