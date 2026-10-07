export type Subject = "Physics" | "Chemistry" | "Mathematics";
export type StudyTask = {
  id: number;
  time: string;
  title: string;
  detail: string;
  duration: string;
  kind: "study" | "break" | "review";
  done: boolean;
};

export const seedTasks: StudyTask[] = [
  {
    id: 1,
    time: "08:00",
    title: "Mathematics",
    detail: "Integration · concept review",
    duration: "2h",
    kind: "study",
    done: true,
  },
  {
    id: 2,
    time: "09:30",
    title: "A proper pause",
    detail: "Step away from your desk",
    duration: "20 min",
    kind: "break",
    done: true,
  },
  {
    id: 3,
    time: "10:00",
    title: "Physics",
    detail: "Rotational motion · 12 problems",
    duration: "1h 45m",
    kind: "study",
    done: true,
  },
  {
    id: 4,
    time: "12:00",
    title: "Lunch, away from your notes",
    detail: "Let your mind reset",
    duration: "60 min",
    kind: "break",
    done: false,
  },
  {
    id: 5,
    time: "14:00",
    title: "Chemistry",
    detail: "Organic reactions · active recall",
    duration: "60 min",
    kind: "study",
    done: false,
  },
  {
    id: 6,
    time: "15:15",
    title: "Recovery time",
    detail: "A walk or anything you enjoy",
    duration: "30 min",
    kind: "break",
    done: false,
  },
  {
    id: 7,
    time: "16:00",
    title: "Mock review",
    detail: "Understand 3 mistakes, then stop",
    duration: "45 min",
    kind: "review",
    done: false,
  },
];

export const careerCatalog = [
  {
    name: "Computer science",
    tags: ["Technology", "Mathematics", "Problem solving"],
    icon: "⌘",
    study:
      "Algorithms, systems, software design and the foundations of computing.",
    routes: [
      "JEE / state CET",
      "University entrance exams",
      "University-specific admissions",
      "Related undergraduate degrees + specialisation",
    ],
    roles: ["Software engineer", "Systems designer", "Product engineer"],
  },
  {
    name: "Data & AI",
    tags: ["Technology", "Mathematics", "Research", "Data"],
    icon: "◌",
    study:
      "Statistics, computing, machine learning and how to reason with data.",
    routes: [
      "Engineering entrances",
      "BSc / BS mathematics or statistics",
      "University data-science programmes",
      "Computer science + focused postgraduate study",
    ],
    roles: ["Data analyst", "ML researcher", "Data scientist"],
  },
  {
    name: "Medicine & health",
    tags: ["Medicine", "Research", "Psychology"],
    icon: "✳",
    study:
      "Human biology, clinical sciences, public health and evidence-based care.",
    routes: [
      "NEET-UG",
      "Allied health programmes",
      "Life-science degrees",
      "Public health and research pathways",
    ],
    roles: ["Clinician", "Clinical researcher", "Public health specialist"],
  },
  {
    name: "Design & interaction",
    tags: ["Design", "Technology", "Psychology"],
    icon: "◈",
    study:
      "Visual communication, interaction, materials and human-centred problem solving.",
    routes: [
      "Design aptitude / institute admissions",
      "University design degrees",
      "Portfolio-based programmes",
      "Engineering + interaction design",
    ],
    roles: ["Product designer", "Service designer", "Design researcher"],
  },
  {
    name: "Economics & finance",
    tags: ["Business", "Finance", "Mathematics"],
    icon: "↗",
    study:
      "Markets, quantitative methods, policy, accounting and decision science.",
    routes: [
      "CUET / university entrance",
      "Economics undergraduate degrees",
      "Commerce pathways",
      "Mathematics + finance specialisation",
    ],
    roles: ["Economic analyst", "Financial researcher", "Policy associate"],
  },
  {
    name: "Psychology & behaviour",
    tags: ["Psychology", "Research", "Media"],
    icon: "⌁",
    study: "Human behaviour, research methods, cognition and social systems.",
    routes: [
      "CUET / university entrance",
      "BA / BSc psychology",
      "Behavioural science programmes",
      "Psychology + research specialisation",
    ],
    roles: ["Research assistant", "Behavioural researcher", "Counsellor*"],
  },
];

export const initialInterests = ["Technology", "Mathematics"];
export const successOptions = [
  "Getting into my preferred college",
  "Doing meaningful work",
  "Learning continuously",
  "Making my family proud",
  "Maintaining a balanced life",
  "Building something of my own",
  "Helping others",
  "Becoming financially independent",
];
