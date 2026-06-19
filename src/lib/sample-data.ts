import type { FeedbackItem } from "./types";

// Sample product feedback with intentional themes (onboarding, performance, pricing,
// reliability, mobile, search, support) so clustering produces clean groups in the demo.
export const sampleFeedback: FeedbackItem[] = [
  { id: "f1", text: "The onboarding was confusing and I couldn't figure out how to get started.", source: "app review" },
  { id: "f2", text: "Setup took forever, the onboarding flow needs clearer steps.", source: "survey" },
  { id: "f3", text: "I got lost during onboarding — too many steps to get started.", source: "support" },
  { id: "f4", text: "Onboarding confusing, gave up before finishing setup.", source: "app review" },

  { id: "f5", text: "The app is really slow, pages take ages loading.", source: "app review" },
  { id: "f6", text: "Performance is terrible, everything loads slowly.", source: "survey" },
  { id: "f7", text: "Slow loading times make it frustrating to use, especially the dashboard.", source: "support" },
  { id: "f8", text: "Constant lag and slow performance when loading large lists.", source: "app review" },
  { id: "f9", text: "Loading spinner forever — performance needs work.", source: "survey" },

  { id: "f10", text: "Way too expensive for what you get, the pricing is steep.", source: "app review" },
  { id: "f11", text: "The pricing plans are confusing and expensive.", source: "survey" },
  { id: "f12", text: "Cost is too high, the cheapest plan is still expensive.", source: "support" },
  { id: "f13", text: "Pricing made me cancel, simply too expensive.", source: "app review" },

  { id: "f14", text: "The app keeps crashing whenever I open a report.", source: "support" },
  { id: "f15", text: "Frequent crashes and a weird error on save.", source: "app review" },
  { id: "f16", text: "Hit a crash bug that lost my work, very broken.", source: "support" },
  { id: "f17", text: "Random errors and crashes make it unreliable.", source: "survey" },
  { id: "f18", text: "A bug causes a crash every time I export.", source: "app review" },

  { id: "f19", text: "The mobile app is missing half the features of desktop.", source: "app review" },
  { id: "f20", text: "Mobile app is clunky and hard to use on my phone.", source: "survey" },
  { id: "f21", text: "Please improve the mobile app, it feels like an afterthought.", source: "support" },

  { id: "f22", text: "Search never finds what I need, the results are bad.", source: "app review" },
  { id: "f23", text: "Search results are irrelevant, hard to find anything.", source: "survey" },
  { id: "f24", text: "Improve search — I can't find old items in the results.", source: "support" },

  { id: "f25", text: "Support was slow to respond and the docs are thin.", source: "survey" },
  { id: "f26", text: "Documentation is incomplete, support took days.", source: "support" },
  { id: "f27", text: "Help docs don't cover the basics, needed support.", source: "app review" },

  { id: "f28", text: "Love the product overall, just needs polish.", source: "app review" },
  { id: "f29", text: "Great tool, the team is responsive.", source: "survey" },
  { id: "f30", text: "Honestly the best in its category once you learn it.", source: "app review" },
  { id: "f31", text: "Integrations would be a nice addition someday.", source: "survey" },
  { id: "f32", text: "Dark mode please!", source: "app review" },
];

export const sampleCsv =
  "text,source\n" +
  sampleFeedback.map((f) => `"${f.text.replace(/"/g, '""')}","${f.source ?? ""}"`).join("\n");
