import type { FeedbackItem } from "./types";

// Sample product feedback with intentional themes (onboarding, performance, pricing,
// reliability, mobile, search, support, docs, feature requests, praise) so the
// deterministic mock pipeline produces clean, curated-labeled groups in the demo.
// One deliberate oddball (f34) stays ungrouped so the metrics tab shows a real
// unsupported rate.
export const sampleFeedback: FeedbackItem[] = [
  { id: "f1", text: "The onboarding was confusing and I couldn't figure out how to get started.", source: "app review" },
  { id: "f2", text: "The onboarding flow needs clearer steps to get started.", source: "survey" },
  { id: "f3", text: "I got lost during onboarding — too many steps to get started.", source: "support" },
  { id: "f4", text: "Onboarding was confusing and I gave up before finishing the setup steps.", source: "app review" },

  { id: "f5", text: "The app is really slow, pages take ages loading.", source: "app review" },
  { id: "f6", text: "Performance is terrible, everything loads slowly.", source: "survey" },
  { id: "f7", text: "Slow loading times make it frustrating to use, especially the dashboard.", source: "support" },
  { id: "f8", text: "Constant lag and slow performance when loading large lists.", source: "app review" },
  { id: "f9", text: "Loading spinner forever — performance needs work.", source: "survey" },

  { id: "f10", text: "Way too expensive for what you get, the pricing is steep.", source: "app review" },
  { id: "f11", text: "The pricing plans are confusing and expensive.", source: "survey" },
  { id: "f12", text: "Cost is too high, the cheapest plan is still expensive.", source: "support" },
  { id: "f13", text: "Pricing made me cancel, simply too expensive.", source: "app review" },

  { id: "f14", text: "It keeps crashing with an error on save.", source: "support" },
  { id: "f15", text: "Frequent crashes and a weird error bug on save.", source: "app review" },
  { id: "f16", text: "Hit a crash bug with an error popup that lost my work.", source: "support" },
  { id: "f17", text: "Random errors and crashes make it feel unreliable.", source: "survey" },
  { id: "f18", text: "Every export fails with an error and sometimes a crash.", source: "app review" },

  { id: "f19", text: "The mobile app is missing half the features of desktop.", source: "app review" },
  { id: "f20", text: "Mobile app is clunky on my phone, and half the features are missing.", source: "survey" },
  { id: "f21", text: "Please stop treating the mobile app as an afterthought, the phone version is missing features.", source: "support" },

  { id: "f22", text: "Search never finds what I need, the results are bad.", source: "app review" },
  { id: "f23", text: "Search results are irrelevant, hard to find anything.", source: "survey" },
  { id: "f24", text: "Improve search — I can't find old items in the results.", source: "support" },

  { id: "f25", text: "Support was slow to respond, waited days for an answer.", source: "survey" },
  { id: "f26", text: "Support response time is terrible, waited days for a reply.", source: "support" },

  { id: "f27", text: "Documentation is thin, the help docs don't cover the basics.", source: "app review" },
  { id: "f28", text: "The docs are thin and the documentation is missing examples.", source: "survey" },

  { id: "f29", text: "Please add integrations with Slack and Jira.", source: "survey" },
  { id: "f30", text: "Please add a dark mode option.", source: "app review" },

  { id: "f31", text: "Love the product overall, just needs polish.", source: "app review" },
  { id: "f32", text: "Great tool, the team is responsive.", source: "survey" },
  { id: "f33", text: "Honestly the best in its category once you learn it.", source: "app review" },

  { id: "f34", text: "The invoice PDF export mangles currency symbols.", source: "support" },
];

export const sampleCsv =
  "text,source\n" +
  sampleFeedback.map((f) => `"${f.text.replace(/"/g, '""')}","${f.source ?? ""}"`).join("\n");
