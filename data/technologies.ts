import type { Technology } from "@/types";

/**
 * The canonical technology dataset — the sole source of the TechStack marquee
 * and the reference target for every `Technology.id` in the data layer
 * (Requirements 4.1, 4.11, 11.1).
 *
 * ## Conventions established here for every `data/*.ts` module
 *
 * - **One named export**, typed against the entity type imported from the
 *   `@/types` barrel. No default exports, so call sites read the same way
 *   everywhere and re-exports stay explicit.
 * - **Data only.** No functions, no derived values, no imports beyond types.
 *   Selection/filtering lives in `lib/data-access.ts`; components never import
 *   this module directly.
 * - **Stable kebab-case ids.** Ids are content, not display text: once written
 *   they are referenced from other datasets and must not be renamed casually.
 * - **Grouped and commented** in the order the UI consumes it.
 *
 * ## Ids are a public contract
 *
 * `Project.technologies`, `Hackathon.technologies`, and
 * `Certification.technologies` hold `Technology.id` values rather than embedded
 * copies, and `lib/validate-data.ts` fails the build when any of them fails to
 * resolve here. Ids are therefore the obvious lowercase form of the name with
 * punctuation dropped (`nextjs`, `nodejs`, `scikit-learn`, `github-actions`) and
 * are unique across the whole dataset.
 *
 * ## Category coverage
 *
 * All six `TechCategory` values are represented, each with enough entries for a
 * marquee row to scroll without a visible gap (Requirements 11.1, 11.3). Entries
 * are grouped by category below and `TechCategoryRow` renders each group in this
 * order.
 *
 * ## Icon convention: `icon` is a path under `public/`
 *
 * `Technology.icon` is `"/images/tech/<id>.svg"` — the brand mark as a local SVG
 * asset, its filename always exactly the entry's `id`, so the path is derivable
 * from the id and a missing asset is trivially traceable to one entry.
 *
 * Two alternatives were rejected. A brand-icon package (`simple-icons` and
 * friends) would contradict Requirement 1.6, which makes Lucide React the
 * exclusive icon library; and Lucide itself ships no brand glyphs, so an "icon
 * identifier" resolved against Lucide could only ever yield one generic glyph
 * per category, leaving badges within a row indistinguishable. Locally hosted
 * brand SVGs are content assets rather than an icon library, so they satisfy
 * both constraints — and being self-hosted they cost no extra request to a third
 * party and cannot break when an upstream package renames a slug.
 *
 * `TechBadge` (task 26.1) resolves the path and must degrade gracefully to a
 * generic Lucide glyph when an asset is absent, because `public/images/tech/`
 * is populated separately (see the image audit in tasks 42.9 / 46.2). Nothing
 * here is a hard runtime dependency on the asset existing.
 *
 * ## Colour convention
 *
 * `color` is the official brand hex, in plain `#rrggbb` form — the only shape
 * `resolveBadgeColor` in `components/shared/Badge.tsx` accepts, since anything
 * else silently degrades. `Badge` applies it to the badge border and icon, so
 * brands whose official colour is black or near-black would be invisible in the
 * dark theme: those entries **omit** `color` and fall back to Badge's
 * token-driven default tone, which is legible in both themes by construction.
 */
export const technologies: Technology[] = [
  /* ------------------------------- Frontend ------------------------------- */
  {
    id: "typescript",
    name: "TypeScript",
    category: "Frontend",
    icon: "/images/tech/typescript.svg",
    website: "https://www.typescriptlang.org",
    color: "#3178C6",
    proficiency: 95,
  },
  {
    id: "react",
    name: "React",
    category: "Frontend",
    icon: "/images/tech/react.svg",
    website: "https://react.dev",
    color: "#61DAFB",
    proficiency: 95,
  },
  {
    // Brand colour is pure black; omitted so the badge stays legible in dark.
    id: "nextjs",
    name: "Next.js",
    category: "Frontend",
    icon: "/images/tech/nextjs.svg",
    website: "https://nextjs.org",
    proficiency: 90,
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    category: "Frontend",
    icon: "/images/tech/tailwindcss.svg",
    website: "https://tailwindcss.com",
    color: "#06B6D4",
    proficiency: 92,
  },
  {
    id: "framer-motion",
    name: "Framer Motion",
    category: "Frontend",
    icon: "/images/tech/framer-motion.svg",
    website: "https://motion.dev",
    color: "#0055FF",
    proficiency: 80,
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "Frontend",
    icon: "/images/tech/javascript.svg",
    website: "https://developer.mozilla.org/docs/Web/JavaScript",
    color: "#F7DF1E",
    proficiency: 93,
  },
  {
    id: "redux",
    name: "Redux",
    category: "Frontend",
    icon: "/images/tech/redux.svg",
    website: "https://redux.js.org",
    color: "#764ABC",
    proficiency: 75,
  },
  {
    id: "vuejs",
    name: "Vue.js",
    category: "Frontend",
    icon: "/images/tech/vuejs.svg",
    website: "https://vuejs.org",
    color: "#4FC08D",
    proficiency: 65,
  },
  {
    id: "html5",
    name: "HTML5",
    category: "Frontend",
    icon: "/images/tech/html5.svg",
    website: "https://developer.mozilla.org/docs/Web/HTML",
    color: "#E34F26",
    proficiency: 95,
  },
  {
    id: "css3",
    name: "CSS3",
    category: "Frontend",
    icon: "/images/tech/css3.svg",
    website: "https://developer.mozilla.org/docs/Web/CSS",
    color: "#1572B6",
    proficiency: 90,
  },

  /* -------------------------------- Backend ------------------------------- */
  {
    id: "c",
    name: "C",
    category: "Backend",
    icon: "/images/tech/c.svg",
    website: "https://en.wikipedia.org/wiki/C_(programming_language)",
    color: "#A8B9CC",
    proficiency: 78,
  },
  {
    id: "cpp",
    name: "C++",
    category: "Backend",
    icon: "/images/tech/cpp.svg",
    website: "https://isocpp.org",
    color: "#00599C",
    proficiency: 80,
  },
  {
    id: "flask",
    name: "Flask",
    category: "Backend",
    icon: "/images/tech/flask.svg",
    website: "https://flask.palletsprojects.com",
    proficiency: 74,
  },
  {
    id: "nodejs",
    name: "Node.js",
    category: "Backend",
    icon: "/images/tech/nodejs.svg",
    website: "https://nodejs.org",
    color: "#5FA04E",
    proficiency: 90,
  },
  {
    // Brand colour is pure black; omitted so the badge stays legible in dark.
    id: "express",
    name: "Express",
    category: "Backend",
    icon: "/images/tech/express.svg",
    website: "https://expressjs.com",
    proficiency: 85,
  },
  {
    id: "nestjs",
    name: "NestJS",
    category: "Backend",
    icon: "/images/tech/nestjs.svg",
    website: "https://nestjs.com",
    color: "#E0234E",
    proficiency: 75,
  },
  {
    id: "python",
    name: "Python",
    category: "Backend",
    icon: "/images/tech/python.svg",
    website: "https://www.python.org",
    color: "#3776AB",
    proficiency: 88,
  },
  {
    id: "fastapi",
    name: "FastAPI",
    category: "Backend",
    icon: "/images/tech/fastapi.svg",
    website: "https://fastapi.tiangolo.com",
    color: "#009688",
    proficiency: 80,
  },
  {
    // Official green is very dark (#092E20); omitted for dark-theme legibility.
    id: "django",
    name: "Django",
    category: "Backend",
    icon: "/images/tech/django.svg",
    website: "https://www.djangoproject.com",
    proficiency: 70,
  },
  {
    id: "go",
    name: "Go",
    category: "Backend",
    icon: "/images/tech/go.svg",
    website: "https://go.dev",
    color: "#00ADD8",
    proficiency: 65,
  },
  {
    id: "graphql",
    name: "GraphQL",
    category: "Backend",
    icon: "/images/tech/graphql.svg",
    website: "https://graphql.org",
    color: "#E10098",
    proficiency: 78,
  },
  {
    id: "rust",
    name: "Rust",
    category: "Backend",
    icon: "/images/tech/rust.svg",
    website: "https://www.rust-lang.org",
    color: "#CE422B",
    proficiency: 55,
  },

  /* ------------------------------- Database ------------------------------- */
  {
    id: "sql",
    name: "SQL",
    category: "Database",
    icon: "/images/tech/sql.svg",
    website: "https://en.wikipedia.org/wiki/SQL",
    color: "#4479A1",
    proficiency: 84,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    icon: "/images/tech/postgresql.svg",
    website: "https://www.postgresql.org",
    color: "#4169E1",
    proficiency: 88,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "Database",
    icon: "/images/tech/mongodb.svg",
    website: "https://www.mongodb.com",
    color: "#47A248",
    proficiency: 85,
  },
  {
    id: "mysql",
    name: "MySQL",
    category: "Database",
    icon: "/images/tech/mysql.svg",
    website: "https://www.mysql.com",
    color: "#4479A1",
    proficiency: 80,
  },
  {
    id: "redis",
    name: "Redis",
    category: "Database",
    icon: "/images/tech/redis.svg",
    website: "https://redis.io",
    color: "#FF4438",
    proficiency: 75,
  },
  {
    // Official navy (#003B57) reads as black on dark surfaces; omitted.
    id: "sqlite",
    name: "SQLite",
    category: "Database",
    icon: "/images/tech/sqlite.svg",
    website: "https://www.sqlite.org",
    proficiency: 82,
  },
  {
    // Brand slate (#2D3748) is too dark to tint a dark-theme badge; omitted.
    id: "prisma",
    name: "Prisma",
    category: "Database",
    icon: "/images/tech/prisma.svg",
    website: "https://www.prisma.io",
    proficiency: 84,
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    icon: "/images/tech/supabase.svg",
    website: "https://supabase.com",
    color: "#3FCF8E",
    proficiency: 78,
  },
  {
    id: "firebase",
    name: "Firebase",
    category: "Database",
    icon: "/images/tech/firebase.svg",
    website: "https://firebase.google.com",
    color: "#FFCA28",
    proficiency: 72,
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    category: "Database",
    icon: "/images/tech/elasticsearch.svg",
    website: "https://www.elastic.co/elasticsearch",
    color: "#4DD0E1",
    proficiency: 60,
  },

  /* -------------------------------- DevOps -------------------------------- */
  {
    id: "docker",
    name: "Docker",
    category: "DevOps",
    icon: "/images/tech/docker.svg",
    website: "https://www.docker.com",
    color: "#2496ED",
    proficiency: 85,
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "DevOps",
    icon: "/images/tech/kubernetes.svg",
    website: "https://kubernetes.io",
    color: "#326CE5",
    proficiency: 70,
  },
  {
    id: "aws",
    name: "AWS",
    category: "DevOps",
    icon: "/images/tech/aws.svg",
    website: "https://aws.amazon.com",
    color: "#FF9900",
    proficiency: 78,
  },
  {
    // Brand colour is pure black; omitted so the badge stays legible in dark.
    id: "vercel",
    name: "Vercel",
    category: "DevOps",
    icon: "/images/tech/vercel.svg",
    website: "https://vercel.com",
    proficiency: 90,
  },
  {
    id: "github-actions",
    name: "GitHub Actions",
    category: "DevOps",
    icon: "/images/tech/github-actions.svg",
    website: "https://github.com/features/actions",
    color: "#2088FF",
    proficiency: 82,
  },
  {
    id: "terraform",
    name: "Terraform",
    category: "DevOps",
    icon: "/images/tech/terraform.svg",
    website: "https://www.terraform.io",
    color: "#844FBA",
    proficiency: 65,
  },
  {
    id: "nginx",
    name: "NGINX",
    category: "DevOps",
    icon: "/images/tech/nginx.svg",
    website: "https://nginx.org",
    color: "#009639",
    proficiency: 72,
  },
  {
    id: "linux",
    name: "Linux",
    category: "DevOps",
    icon: "/images/tech/linux.svg",
    website: "https://www.kernel.org",
    color: "#FCC624",
    proficiency: 85,
  },
  {
    id: "git",
    name: "Git",
    category: "DevOps",
    icon: "/images/tech/git.svg",
    website: "https://git-scm.com",
    color: "#F05032",
    proficiency: 92,
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "DevOps",
    icon: "/images/tech/grafana.svg",
    website: "https://grafana.com",
    color: "#F46800",
    proficiency: 60,
  },

  /* -------------------------------- AI/ML --------------------------------- */
  {
    id: "pytorch",
    name: "PyTorch",
    category: "AI/ML",
    icon: "/images/tech/pytorch.svg",
    website: "https://pytorch.org",
    color: "#EE4C2C",
    proficiency: 80,
  },
  {
    id: "tensorflow",
    name: "TensorFlow",
    category: "AI/ML",
    icon: "/images/tech/tensorflow.svg",
    website: "https://www.tensorflow.org",
    color: "#FF6F00",
    proficiency: 72,
  },
  {
    id: "scikit-learn",
    name: "scikit-learn",
    category: "AI/ML",
    icon: "/images/tech/scikit-learn.svg",
    website: "https://scikit-learn.org",
    color: "#F7931E",
    proficiency: 82,
  },
  {
    // Brand navy (#150458) is unreadable as a dark-theme tint; omitted.
    id: "pandas",
    name: "pandas",
    category: "AI/ML",
    icon: "/images/tech/pandas.svg",
    website: "https://pandas.pydata.org",
    proficiency: 88,
  },
  {
    id: "numpy",
    name: "NumPy",
    category: "AI/ML",
    icon: "/images/tech/numpy.svg",
    website: "https://numpy.org",
    color: "#4DABCF",
    proficiency: 86,
  },
  {
    // Brand colour is near-black teal (#1C3C3C); omitted.
    id: "langchain",
    name: "LangChain",
    category: "AI/ML",
    icon: "/images/tech/langchain.svg",
    website: "https://www.langchain.com",
    proficiency: 76,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    category: "AI/ML",
    icon: "/images/tech/huggingface.svg",
    website: "https://huggingface.co",
    color: "#FFD21E",
    proficiency: 74,
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "AI/ML",
    icon: "/images/tech/openai.svg",
    website: "https://openai.com",
    color: "#74AA9C",
    proficiency: 85,
  },
  {
    id: "opencv",
    name: "OpenCV",
    category: "AI/ML",
    icon: "/images/tech/opencv.svg",
    website: "https://opencv.org",
    color: "#5C3EE8",
    proficiency: 62,
  },

  /* --------------------------------- Web3 --------------------------------- */
  {
    // Brand grey (#363636) is indistinguishable from the dark surface; omitted.
    id: "solidity",
    name: "Solidity",
    category: "Web3",
    icon: "/images/tech/solidity.svg",
    website: "https://soliditylang.org",
    proficiency: 70,
  },
  {
    // Brand colour is near-black (#3C3C3D); omitted.
    id: "ethereum",
    name: "Ethereum",
    category: "Web3",
    icon: "/images/tech/ethereum.svg",
    website: "https://ethereum.org",
    proficiency: 72,
  },
  {
    id: "hardhat",
    name: "Hardhat",
    category: "Web3",
    icon: "/images/tech/hardhat.svg",
    website: "https://hardhat.org",
    color: "#FFF100",
    proficiency: 68,
  },
  {
    id: "evm",
    name: "EVM",
    category: "Web3",
    icon: "/images/tech/evm.svg",
    website: "https://ethereum.org/en/developers/docs/evm/",
    proficiency: 65,
  },
  {
    id: "ethers-js",
    name: "Ethers.js",
    category: "Web3",
    icon: "/images/tech/ethers-js.svg",
    website: "https://docs.ethers.org",
    color: "#2535A0",
    proficiency: 66,
  },
  {
    id: "web3js",
    name: "Web3.js",
    category: "Web3",
    icon: "/images/tech/web3js.svg",
    website: "https://web3js.org",
    color: "#F16822",
    proficiency: 60,
  },
  {
    id: "ipfs",
    name: "IPFS",
    category: "Web3",
    icon: "/images/tech/ipfs.svg",
    website: "https://ipfs.tech",
    color: "#65C2CB",
    proficiency: 58,
  },
  {
    id: "metamask",
    name: "MetaMask",
    category: "Web3",
    icon: "/images/tech/metamask.svg",
    website: "https://metamask.io",
    color: "#F6851B",
    proficiency: 64,
  },
  {
    id: "polygon",
    name: "Polygon",
    category: "Web3",
    icon: "/images/tech/polygon.svg",
    website: "https://polygon.technology",
    color: "#7B3FE4",
    proficiency: 55,
  },
  {
    // Brand colour is near-black (#1B1B1B); omitted.
    id: "wagmi",
    name: "Wagmi",
    category: "Web3",
    icon: "/images/tech/wagmi.svg",
    website: "https://wagmi.sh",
  },
];
