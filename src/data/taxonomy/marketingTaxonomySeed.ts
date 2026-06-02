export type MarketingTaxonomyCategory =
  | "Core Marketing / Strategy"
  | "Product Management"
  | "Service Management"
  | "Integrated Marketing Communication"
  | "Consumer Behavior"
  | "Branding"
  | "Marketing Research"
  | "Digital Marketing"
  | "Customer Experience"
  | "Emerging Marketing Topics";

export type MarketingTaxonomyTier = "core" | "extended";
export type MarketingTaxonomyReviewStatus = "approved_seed" | "candidate_seed";

export interface MarketingTaxonomyTerm {
  aliases: string[];
  canonicalLabel: string;
  category: MarketingTaxonomyCategory;
  description: string;
  id: string;
  relatedTerms: string[];
  reviewStatus: MarketingTaxonomyReviewStatus;
  tier: MarketingTaxonomyTier;
  useAsDefaultTag: boolean;
}

interface CategorySeed {
  category: MarketingTaxonomyCategory;
  coreDimensions: string[];
  coreRoots: string[];
  extendedDimensions: string[];
  extendedRoots: string[];
}

const categorySeeds: CategorySeed[] = [
  {
    category: "Core Marketing / Strategy",
    coreDimensions: ["strategy", "planning", "analysis"],
    coreRoots: [
      "market orientation",
      "segmentation",
      "targeting",
      "positioning",
      "value proposition",
      "competitive advantage",
      "marketing mix",
      "market share",
      "customer value",
      "growth strategy"
    ],
    extendedDimensions: ["diagnostic", "playbook"],
    extendedRoots: [
      "blue ocean framing",
      "market disruption",
      "category entry",
      "portfolio logic",
      "scenario planning",
      "strategic fit",
      "market sensing",
      "go-to-market motion",
      "pricing corridor",
      "demand shaping"
    ]
  },
  {
    category: "Product Management",
    coreDimensions: ["design", "lifecycle", "portfolio"],
    coreRoots: [
      "product concept",
      "product line",
      "product lifecycle",
      "new product development",
      "minimum viable product",
      "product-market fit",
      "feature prioritization",
      "roadmap",
      "product differentiation",
      "product quality"
    ],
    extendedDimensions: ["discovery", "governance"],
    extendedRoots: [
      "prototype testing",
      "backlog hygiene",
      "launch readiness",
      "product analytics",
      "feature adoption",
      "sunset planning",
      "platform product",
      "ecosystem product",
      "product telemetry",
      "usage signal"
    ]
  },
  {
    category: "Service Management",
    coreDimensions: ["quality", "delivery", "recovery"],
    coreRoots: [
      "service quality",
      "service encounter",
      "service blueprint",
      "service failure",
      "service recovery",
      "service process",
      "frontline employee",
      "customer waiting time",
      "service evidence",
      "service productivity"
    ],
    extendedDimensions: ["experience", "operations"],
    extendedRoots: [
      "queue design",
      "self-service technology",
      "service robot",
      "service script",
      "service climate",
      "complaint handling",
      "service guarantee",
      "omnichannel service",
      "service personalization",
      "co-created service"
    ]
  },
  {
    category: "Integrated Marketing Communication",
    coreDimensions: ["message", "media", "effectiveness"],
    coreRoots: [
      "advertising",
      "public relations",
      "sales promotion",
      "personal selling",
      "direct marketing",
      "media planning",
      "message strategy",
      "creative strategy",
      "campaign evaluation",
      "communication objective"
    ],
    extendedDimensions: ["activation", "coordination"],
    extendedRoots: [
      "earned media",
      "owned media",
      "paid media",
      "influencer briefing",
      "content calendar",
      "brand storytelling",
      "sponsorship activation",
      "native advertising",
      "cross-channel orchestration",
      "campaign attribution"
    ]
  },
  {
    category: "Consumer Behavior",
    coreDimensions: ["motivation", "decision", "response"],
    coreRoots: [
      "consumer perception",
      "consumer attitude",
      "consumer learning",
      "consumer motivation",
      "purchase intention",
      "decision journey",
      "consumer involvement",
      "reference group",
      "customer satisfaction",
      "customer loyalty"
    ],
    extendedDimensions: ["psychology", "context"],
    extendedRoots: [
      "habit formation",
      "choice overload",
      "loss aversion",
      "social proof",
      "consumer identity",
      "impulse buying",
      "brand attachment",
      "post-purchase regret",
      "consumer trust",
      "perceived risk"
    ]
  },
  {
    category: "Branding",
    coreDimensions: ["identity", "equity", "architecture"],
    coreRoots: [
      "brand identity",
      "brand image",
      "brand equity",
      "brand awareness",
      "brand association",
      "brand personality",
      "brand loyalty",
      "brand positioning",
      "brand extension",
      "brand architecture"
    ],
    extendedDimensions: ["meaning", "governance"],
    extendedRoots: [
      "brand salience",
      "brand resonance",
      "brand authenticity",
      "brand community",
      "brand love",
      "brand heritage",
      "brand purpose",
      "employer brand",
      "private label brand",
      "luxury brand"
    ]
  },
  {
    category: "Marketing Research",
    coreDimensions: ["method", "measurement", "insight"],
    coreRoots: [
      "survey research",
      "focus group",
      "depth interview",
      "experimental design",
      "sampling",
      "measurement validity",
      "reliability",
      "market insight",
      "data analysis",
      "research ethics"
    ],
    extendedDimensions: ["analytics", "evidence"],
    extendedRoots: [
      "conjoint analysis",
      "cluster analysis",
      "sentiment analysis",
      "text analytics",
      "ethnographic research",
      "netnography",
      "customer analytics",
      "marketing dashboard",
      "data triangulation",
      "research audit trail"
    ]
  },
  {
    category: "Digital Marketing",
    coreDimensions: ["channel", "optimization", "measurement"],
    coreRoots: [
      "search engine optimization",
      "search advertising",
      "social media marketing",
      "email marketing",
      "content marketing",
      "mobile marketing",
      "conversion rate",
      "landing page",
      "web analytics",
      "digital attribution"
    ],
    extendedDimensions: ["automation", "platform"],
    extendedRoots: [
      "programmatic advertising",
      "marketing automation",
      "retargeting",
      "customer data platform",
      "social listening",
      "growth hacking",
      "app store optimization",
      "creator economy",
      "short-form video",
      "livestream commerce"
    ]
  },
  {
    category: "Customer Experience",
    coreDimensions: ["journey", "touchpoint", "relationship"],
    coreRoots: [
      "customer journey",
      "touchpoint",
      "customer pain point",
      "customer delight",
      "customer effort",
      "customer engagement",
      "customer retention",
      "customer lifetime value",
      "net promoter score",
      "experience design"
    ],
    extendedDimensions: ["journey ops", "experience metric"],
    extendedRoots: [
      "journey orchestration",
      "voice of customer",
      "customer health score",
      "churn signal",
      "experience recovery",
      "customer onboarding",
      "loyalty program",
      "relationship marketing",
      "customer success",
      "community experience"
    ]
  },
  {
    category: "Emerging Marketing Topics",
    coreDimensions: ["innovation", "governance", "impact"],
    coreRoots: [
      "sustainable marketing",
      "green marketing",
      "social marketing",
      "inclusive marketing",
      "ethical marketing",
      "AI marketing",
      "platform strategy",
      "sharing economy",
      "privacy",
      "marketing technology"
    ],
    extendedDimensions: ["frontier", "risk"],
    extendedRoots: [
      "generative AI marketing",
      "algorithmic personalization",
      "synthetic media",
      "immersive commerce",
      "metaverse retail",
      "blockchain loyalty",
      "zero-party data",
      "dark pattern",
      "responsible AI",
      "attention economy"
    ]
  }
];

export const marketingTaxonomySeed: MarketingTaxonomyTerm[] = categorySeeds.flatMap(
  (seed, categoryIndex) => [
    ...createTerms({
      categoryIndex,
      category: seed.category,
      dimensions: seed.coreDimensions,
      reviewStatus: "approved_seed",
      roots: seed.coreRoots,
      tier: "core",
      useAsDefaultTag: true
    }),
    ...createTerms({
      categoryIndex,
      category: seed.category,
      dimensions: seed.extendedDimensions,
      reviewStatus: "candidate_seed",
      roots: seed.extendedRoots,
      tier: "extended",
      useAsDefaultTag: false
    })
  ]
);

export const marketingTaxonomySummary = {
  approvedCoreCount: marketingTaxonomySeed.filter((term) => term.tier === "core").length,
  extendedCandidateCount: marketingTaxonomySeed.filter((term) => term.tier === "extended")
    .length,
  totalCount: marketingTaxonomySeed.length
};

function createTerms({
  category,
  categoryIndex,
  dimensions,
  reviewStatus,
  roots,
  tier,
  useAsDefaultTag
}: {
  category: MarketingTaxonomyCategory;
  categoryIndex: number;
  dimensions: string[];
  reviewStatus: MarketingTaxonomyReviewStatus;
  roots: string[];
  tier: MarketingTaxonomyTier;
  useAsDefaultTag: boolean;
}): MarketingTaxonomyTerm[] {
  return roots.flatMap((root, rootIndex) =>
    dimensions.map((dimension, dimensionIndex) => {
      const canonicalLabel = `${root} ${dimension}`;

      return {
        aliases: [root, canonicalLabel.replace(/ /g, "-"), `${root} ${dimensionIndex + 1}`],
        canonicalLabel,
        category,
        description: `${canonicalLabel} is a ${tier} marketing taxonomy seed term for ${category}.`,
        id: `mkt-${tier}-${String(categoryIndex + 1).padStart(2, "0")}-${String(
          rootIndex + 1
        ).padStart(2, "0")}-${String(dimensionIndex + 1).padStart(2, "0")}`,
        relatedTerms: roots
          .filter((relatedRoot) => relatedRoot !== root)
          .slice(0, 3)
          .map((relatedRoot) => `${relatedRoot} ${dimension}`),
        reviewStatus,
        tier,
        useAsDefaultTag
      };
    })
  );
}
