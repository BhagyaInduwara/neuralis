export const SITE = {
  name: "NEURALIS",
  tagline: "COMPUTING BEYOND THE LIMIT.",
  description:
    "Neuralis builds next-generation computational systems for intelligent infrastructure.",
  contactEmail: "hello@neuralis.systems",
};

export type SectionId =
  | "hero"
  | "technology"
  | "performance"
  | "architecture"
  | "about"
  | "cta";

export interface SectionMeta {
  id: SectionId;
  label: string;
  index: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: "hero", label: "SYSTEM", index: "01" },
  { id: "technology", label: "TECHNOLOGY", index: "02" },
  { id: "performance", label: "PERFORMANCE", index: "03" },
  { id: "architecture", label: "ARCHITECTURE", index: "04" },
  { id: "about", label: "ABOUT", index: "05" },
  { id: "cta", label: "CONNECT", index: "06" },
];

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "SYSTEM", href: "#hero" },
  { label: "TECHNOLOGY", href: "#technology" },
  { label: "RESEARCH", href: "#architecture" },
  { label: "ABOUT", href: "#about" },
];

export const HERO_READOUTS = [
  { label: "CORE FREQUENCY", value: "4.80 GHz" },
  { label: "THERMAL STATE", value: "OPTIMAL" },
  { label: "PROCESS NODE", value: "03 NM" },
  { label: "SYSTEM STATUS", value: "ONLINE" },
];

export const TECHNOLOGY_CARDS = [
  {
    index: "01",
    title: "NEURAL PROCESSING",
    description:
      "Dedicated tensor pathways engineered for sustained inference at extreme density, without compromising thermal ceilings.",
  },
  {
    index: "02",
    title: "EDGE COMPUTATION",
    description:
      "Distributed compute nodes that bring intelligence to the point of need, minimizing latency across the network fabric.",
  },
  {
    index: "03",
    title: "HIGH-DENSITY ARCHITECTURE",
    description:
      "Stacked interconnects and precision lithography deliver more computational surface in a fraction of the footprint.",
  },
];

export const PERFORMANCE_STATS = [
  { value: 4.8, decimals: 1, suffix: "", unit: "GHz", label: "PEAK CORE CLOCK" },
  {
    value: 99.98,
    decimals: 2,
    suffix: "%",
    unit: "",
    label: "SYSTEM RELIABILITY",
  },
  { value: 3, decimals: 0, suffix: "", unit: "NM", label: "PROCESS GEOMETRY" },
];

export interface ArchitectureNode {
  id: string;
  label: string;
  description: string;
  angle: number;
}

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: "processing",
    label: "PROCESSING",
    description: "Multi-core execution lanes handling parallel workloads in real time.",
    angle: -90,
  },
  {
    id: "memory",
    label: "MEMORY",
    description: "High-bandwidth stacked memory feeding data to the core without bottlenecks.",
    angle: -18,
  },
  {
    id: "network",
    label: "NETWORK",
    description: "Low-latency fabric linking every node across the compute cluster.",
    angle: 54,
  },
  {
    id: "aicore",
    label: "AI CORE",
    description: "Dedicated matrix units purpose-built for neural inference and training.",
    angle: 126,
  },
  {
    id: "datafabric",
    label: "DATA FABRIC",
    description: "Unified storage layer synchronizing state across the entire system.",
    angle: 198,
  },
];

export const FOOTER_LINKS = [
  { label: "SYSTEMS", href: "#technology" },
  { label: "RESEARCH", href: "#architecture" },
  { label: "CAREERS", href: `mailto:${SITE.contactEmail}?subject=Careers` },
  { label: "CONTACT", href: `mailto:${SITE.contactEmail}` },
];
