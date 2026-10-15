import { SubjectItem, StreamType } from '../types';

export interface StreamMeta {
  id: StreamType;
  title: string;
  badge: string;
  description: string;
  accentColor: string;
  accentBg: string;
  defaultExams: string[];
}

export const STREAMS_CONFIG: Record<StreamType, StreamMeta> = {
  science: {
    id: 'science',
    title: 'Science',
    badge: 'PCM / PCB / CS',
    description: 'Physics, Chemistry, Math, Biology, Computing & Competitive Prep',
    accentColor: '#06B6D4', // Cyan
    accentBg: 'rgba(6, 182, 212, 0.1)',
    defaultExams: ['JEE Main / Advanced', 'NEET UG', 'CBSE / State Boards', 'KVPY / Olympiad', 'University STEM'],
  },
  commerce: {
    id: 'commerce',
    title: 'Commerce',
    badge: 'Fin & Business',
    description: 'Accountancy, Business Studies, Economics & Corporate Law',
    accentColor: '#10B981', // Emerald
    accentBg: 'rgba(16, 185, 129, 0.1)',
    defaultExams: ['CA Foundation / Inter', 'CBSE / ICSE Boards', 'CUET Commerce', 'CFA / CMA', 'MBA Entrance / IPMAT'],
  },
  arts: {
    id: 'arts',
    title: 'Arts & Humanities',
    badge: 'Liberal Arts & Social Sciences',
    description: 'History, Political Science, Psychology, Sociology & Literature',
    accentColor: '#8B5CF6', // Purple / Violet
    accentBg: 'rgba(139, 92, 246, 0.1)',
    defaultExams: ['UPSC Civil Services', 'CUET Humanities', 'State Boards / CBSE', 'State PCS', 'Law Entrance / CLAT'],
  },
};

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  // Science subjects
  {
    id: 'sci_phy',
    name: 'Physics',
    stream: 'science',
    color: '#0EA5E9',
    subTopics: [
      'Rotational Motion & Gravitation',
      'Electrodynamics & Magnetism',
      'Optics & Wave Motion',
      'Thermodynamics & Kinetic Theory',
      'Modern Physics & Semiconductors',
      'Kinematics & Work Energy Power',
    ],
  },
  {
    id: 'sci_chem',
    name: 'Chemistry',
    stream: 'science',
    color: '#06B6D4',
    subTopics: [
      'Organic Reaction Mechanisms',
      'Chemical Bonding & Molecular Structure',
      'Electrochemistry & Chemical Kinetics',
      'Coordination Compounds & d-Block',
      'Equilibrium & Thermodynamics',
      'Hydrocarbons & Carbonyls',
    ],
  },
  {
    id: 'sci_math',
    name: 'Mathematics',
    stream: 'science',
    color: '#3B82F6',
    subTopics: [
      'Differential & Integral Calculus',
      'Vectors & 3D Geometry',
      'Probability & Combinatorics',
      'Matrices & Determinants',
      'Coordinate Geometry & Conic Sections',
      'Trigonometry & Complex Numbers',
    ],
  },
  {
    id: 'sci_bio',
    name: 'Biology',
    stream: 'science',
    color: '#14B8A6',
    subTopics: [
      'Human Physiology & Organ Systems',
      'Genetics & Evolution',
      'Cell Biology & Biomolecules',
      'Ecology & Biodiversity',
      'Plant Physiology & Photosynthesis',
      'Biotechnology & Applications',
    ],
  },
  {
    id: 'sci_cs',
    name: 'Computer Science',
    stream: 'science',
    color: '#6366F1',
    subTopics: [
      'Data Structures & Algorithms',
      'Object Oriented Programming',
      'Database Management & SQL',
      'Computer Networks & Protocols',
      'Operating Systems Fundamentals',
      'Web Technologies & APIs',
    ],
  },

  // Commerce subjects
  {
    id: 'com_acc',
    name: 'Accountancy',
    stream: 'commerce',
    color: '#10B981',
    subTopics: [
      'Partnership Firms & Goodwill',
      'Accounting for Share Capital & Debentures',
      'Cash Flow Statements & Ratio Analysis',
      'Financial Statements of Not-For-Profit',
      'Depreciation & Ledger Reconciliation',
      'Computerised Accounting Systems',
    ],
  },
  {
    id: 'com_bst',
    name: 'Business Studies',
    stream: 'commerce',
    color: '#34D399',
    subTopics: [
      'Principles of Scientific Management',
      'Financial Management & Capital Structure',
      'Marketing Management & Branding',
      'Consumer Protection & Ethics',
      'Planning, Organising & Staffing',
      'Directing & Controlling Mechanisms',
    ],
  },
  {
    id: 'com_eco',
    name: 'Economics',
    stream: 'commerce',
    color: '#059669',
    subTopics: [
      'Macroeconomics: National Income Accounting',
      'Money, Banking & Monetary Policy',
      'Government Budget & Balance of Payments',
      'Microeconomics: Consumer & Producer Theory',
      'Indian Economic Development Post-1991',
      'Inflation, Employment & Sustainable Growth',
    ],
  },
  {
    id: 'com_appmath',
    name: 'Applied Mathematics',
    stream: 'commerce',
    color: '#0D9488',
    subTopics: [
      'Financial Mathematics & Annuities',
      'Probability Distributions & Hypothesis Testing',
      'Linear Programming & Optimization',
      'Index Numbers & Time Series',
      'Calculus for Business & Marginal Cost',
    ],
  },
  {
    id: 'com_tax',
    name: 'Commercial Law & Taxation',
    stream: 'commerce',
    color: '#15803D',
    subTopics: [
      'Indian Contract Act & Sale of Goods',
      'GST & Indirect Taxes Framework',
      'Income Tax Deductions & Computations',
      'Negotiable Instruments Act',
      'Corporate Governance & Filing',
    ],
  },

  // Arts & Humanities subjects
  {
    id: 'art_hist',
    name: 'History',
    stream: 'arts',
    color: '#8B5CF6',
    subTopics: [
      'Ancient Indian Civilizations & Harappa',
      'Medieval Dynasties & Architecture',
      'Indian National Movement & Independence',
      'World Wars & Decolonization',
      'Renaissance, Enlightenment & Revolutions',
      'Cold War Era & Non-Aligned Movement',
    ],
  },
  {
    id: 'art_pol',
    name: 'Political Science',
    stream: 'arts',
    color: '#A855F7',
    subTopics: [
      'Indian Constitution & Fundamental Rights',
      'Federalism, Judiciary & Parliament',
      'International Relations & Global Geopolitics',
      'Political Ideologies: Liberalism, Socialism, Feminism',
      'Contemporary World Politics & Global Security',
      'Public Policy Formulation & Governance',
    ],
  },
  {
    id: 'art_psy',
    name: 'Psychology',
    stream: 'arts',
    color: '#C084FC',
    subTopics: [
      'Cognitive Processes: Memory & Attention',
      'Human Development Across Lifespan',
      'Theories of Personality & Intelligence',
      'Psychological Disorders & Psychotherapy',
      'Social Influence, Group Dynamics & Attitudes',
      'Stress, Coping Mechanisms & Positive Psychology',
    ],
  },
  {
    id: 'art_soc',
    name: 'Sociology',
    stream: 'arts',
    color: '#7C3AED',
    subTopics: [
      'Structure of Indian Society & Demography',
      'Social Institutions: Family, Caste & Kinship',
      'Social Inequality, Stratification & Exclusion',
      'Social Movements & Collective Action',
      'Modernization, Westernization & Globalization',
      'Sociological Thinkers: Marx, Weber, Durkheim',
    ],
  },
  {
    id: 'art_eng',
    name: 'English Literature',
    stream: 'arts',
    color: '#6D28D9',
    subTopics: [
      'Shakespearean Drama & Renaissance Poetry',
      'Romantic & Victorian Literature',
      'Modernist Prose & Stream of Consciousness',
      'Post-Colonial Literature & Diaspora',
      'Critical Theory & Literary Analysis',
      'Formal Writing, Essays & Rhetoric',
    ],
  },
  {
    id: 'art_geo',
    name: 'Geography',
    stream: 'arts',
    color: '#9333EA',
    subTopics: [
      'Geomorphology & Plate Tectonics',
      'Climatology & Oceanography',
      'Human Geography & Settlement Patterns',
      'Resource Economics & Sustainable Land Use',
      'Physical Geography of the Subcontinent',
      'GIS, Remote Sensing & Cartography',
    ],
  },
];
