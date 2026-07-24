import {
  Activity,
  BadgeCheck,
  Banknote,
  Bell,
  Blocks,
  Brain,
  Bus,
  Calculator,
  CalendarClock,
  Camera,
  ChartNoAxesCombined,
  ClipboardCheck,
  Cloud,
  Cpu,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  IdCard,
  KeyRound,
  Landmark,
  Laptop,
  Layers,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Palette,
  PieChart,
  Plug,
  Presentation,
  Receipt,
  RefreshCw,
  Route,
  ScanFace,
  School,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

/* ------------------------------------------------------------------ Nav */

export type NavItem = {
  label: string
  href: string
  children?: { label: string; description: string; href: string; icon: LucideIcon }[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Solutions',
    href: '#why',
    children: [
      {
        label: 'K-12 Schools',
        description: 'Single-campus operations, end to end.',
        href: '#why',
        icon: School,
      },
      {
        label: 'Multi-Campus Groups',
        description: 'Consolidated control across every branch.',
        href: '#why',
        icon: Landmark,
      },
      {
        label: 'Coaching & Institutes',
        description: 'Batches, tests and fee cycles at scale.',
        href: '#modules',
        icon: Presentation,
      },
      {
        label: 'Universities',
        description: 'Departments, credits and semester flows.',
        href: '#modules',
        icon: GraduationCap,
      },
    ],
  },
  {
    label: 'Modules',
    href: '#modules',
    children: [
      {
        label: 'Academics',
        description: 'Timetable, LMS, exams, report cards.',
        href: '#modules',
        icon: Library,
      },
      {
        label: 'Finance',
        description: 'Fees, payroll, ledgers, reconciliation.',
        href: '#modules',
        icon: Wallet,
      },
      {
        label: 'Operations',
        description: 'Transport, hostel, inventory, visitors.',
        href: '#modules',
        icon: Bus,
      },
      {
        label: 'People',
        description: 'Students, staff, HR and admissions CRM.',
        href: '#modules',
        icon: Users,
      },
    ],
  },
  { label: 'AI', href: '#ai' },
  { label: 'Pricing', href: '#pricing' },
  {
    label: 'Resources',
    href: '#faq',
    children: [
      {
        label: 'Documentation',
        description: 'Guides, API reference and recipes.',
        href: '#faq',
        icon: FileText,
      },
      {
        label: 'Migration Playbook',
        description: 'Move from any legacy ERP in 14 days.',
        href: '#faq',
        icon: RefreshCw,
      },
      {
        label: 'Security & Compliance',
        description: 'DPDP, ISO posture and data residency.',
        href: '#features',
        icon: ShieldCheck,
      },
      {
        label: 'Support',
        description: 'Onboarding, training and SLAs.',
        href: '#faq',
        icon: LifeBuoy,
      },
    ],
  },
  { label: 'Company', href: '#footer' },
]

/* ---------------------------------------------------------------- Stats */

export const TRUST_STATS = [
  { value: 420, suffix: '+', label: 'Schools onboarding', hint: 'Founding cohort' },
  { value: 380000, suffix: '+', label: 'Students managed', hint: 'Across campuses' },
  { value: 24000, suffix: '+', label: 'Teachers empowered', hint: 'Daily active' },
  { value: 310000, suffix: '+', label: 'Parents connected', hint: 'On mobile' },
]

/* -------------------------------------------------------------- Problems */

export const PROBLEMS = [
  {
    title: 'Manual work everywhere',
    body: 'Attendance registers, fee receipts and marksheets re-typed into spreadsheets — every single day.',
    metric: '18 hrs/week lost',
    icon: ClipboardCheck,
  },
  {
    title: 'Six disconnected tools',
    body: 'One vendor for fees, another for transport, a WhatsApp group for parents. Nothing reconciles.',
    metric: '6 logins per staffer',
    icon: Layers,
  },
  {
    title: 'Paper records',
    body: 'Admission forms in cupboards, TCs hand-written, audit trails that vanish when a file goes missing.',
    metric: '0% searchable',
    icon: FileText,
  },
  {
    title: 'Broken communication',
    body: 'Parents chase teachers for updates. Circulars get lost. Fee reminders never reach the right person.',
    metric: '41% message reach',
    icon: MessageSquare,
  },
]

export const SOLUTIONS = [
  {
    title: 'One automated system of record',
    body: 'Biometric and face-recognition attendance flows straight into analytics, payroll and parent alerts.',
    metric: '18 hrs returned',
    icon: Workflow,
  },
  {
    title: 'One platform, one login',
    body: '100+ native modules sharing a single data model. No integrations to babysit, no CSV exports.',
    metric: '1 login, all roles',
    icon: LayoutDashboard,
  },
  {
    title: 'Fully digital, fully auditable',
    body: 'Every admission, receipt and certificate is versioned, searchable and exportable in one click.',
    metric: '100% audit trail',
    icon: Database,
  },
  {
    title: 'Communication that lands',
    body: 'WhatsApp, SMS, email and in-app — routed automatically, with delivery receipts on every message.',
    metric: '98% delivery',
    icon: Bell,
  },
]

/* --------------------------------------------------------------- Modules */

export type ModuleCategory =
  | 'People'
  | 'Academics'
  | 'Finance'
  | 'Operations'
  | 'Intelligence'
  | 'Platform'

export type ModuleItem = {
  name: string
  category: ModuleCategory
  icon: LucideIcon
  featured?: boolean
  blurb?: string
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  'People',
  'Academics',
  'Finance',
  'Operations',
  'Intelligence',
  'Platform',
]

export const MODULES: ModuleItem[] = [
  // People
  { name: 'Student Management', category: 'People', icon: GraduationCap, featured: true, blurb: 'Unified 360° student record from enquiry to alumni.' },
  { name: 'Teacher Management', category: 'People', icon: Users, featured: true, blurb: 'Workload, substitutions, appraisals and certifications.' },
  { name: 'Admissions CRM', category: 'People', icon: UserPlus, featured: true, blurb: 'Lead capture, follow-ups and conversion analytics.' },
  { name: 'HR & Recruitment', category: 'People', icon: UserCheck },
  { name: 'Payroll', category: 'Finance', icon: Calculator, featured: true, blurb: 'Statutory-compliant salary runs with one-click payouts.' },
  { name: 'Staff Attendance', category: 'People', icon: ClipboardCheck },
  { name: 'Leave Management', category: 'People', icon: CalendarClock },
  { name: 'Alumni Network', category: 'People', icon: Trophy },
  { name: 'Parent Portal', category: 'People', icon: Smartphone, featured: true, blurb: 'Fees, attendance, results and chat in one app.' },
  { name: 'Student Portal', category: 'People', icon: Laptop },
  { name: 'Teacher Portal', category: 'People', icon: Presentation },
  { name: 'Counselling & Discipline', category: 'People', icon: LifeBuoy },
  { name: 'Behaviour Tracking', category: 'People', icon: Activity },
  { name: 'Employee Self Service', category: 'People', icon: IdCard },

  // Academics
  { name: 'Attendance', category: 'Academics', icon: ClipboardCheck, featured: true, blurb: 'Period-wise capture with instant absentee alerts.' },
  { name: 'Face Recognition', category: 'Academics', icon: ScanFace, featured: true, blurb: 'Contactless roll-call in under four seconds a class.' },
  { name: 'Timetable Engine', category: 'Academics', icon: CalendarClock, featured: true, blurb: 'Conflict-free schedules generated in seconds.' },
  { name: 'Assignments', category: 'Academics', icon: FileText },
  { name: 'Learning Management', category: 'Academics', icon: Library, featured: true, blurb: 'Courses, live classes, resources and completion tracking.' },
  { name: 'Examination', category: 'Academics', icon: FileSpreadsheet, featured: true, blurb: 'Seating, invigilation, grading and result publishing.' },
  { name: 'Online Assessments', category: 'Academics', icon: Laptop },
  { name: 'Question Bank', category: 'Academics', icon: Database },
  { name: 'Report Cards', category: 'Academics', icon: FileText },
  { name: 'Grading Schemes', category: 'Academics', icon: BadgeCheck },
  { name: 'Curriculum Planner', category: 'Academics', icon: Route },
  { name: 'Lesson Plans', category: 'Academics', icon: Presentation },
  { name: 'Homework Diary', category: 'Academics', icon: FileText },
  { name: 'Certificates', category: 'Academics', icon: BadgeCheck },
  { name: 'ID Cards', category: 'Academics', icon: IdCard },
  { name: 'Transfer Certificates', category: 'Academics', icon: FileText },
  { name: 'Co-curricular', category: 'Academics', icon: Trophy },
  { name: 'Sports Management', category: 'Academics', icon: Trophy },
  { name: 'Library', category: 'Academics', icon: Library, featured: true, blurb: 'Cataloguing, issue-return and fine automation.' },
  { name: 'Labs & Practicals', category: 'Academics', icon: FlaskConical },
  { name: 'Field Trips', category: 'Academics', icon: MapPin },

  // Finance
  { name: 'Fee Management', category: 'Finance', icon: Receipt, featured: true, blurb: 'Structures, concessions, instalments and reminders.' },
  { name: 'Online Payments', category: 'Finance', icon: CreditCard, featured: true, blurb: 'UPI, cards and netbanking with auto-reconciliation.' },
  { name: 'Fee Concessions', category: 'Finance', icon: Banknote },
  { name: 'Scholarships', category: 'Finance', icon: Trophy },
  { name: 'Accounting Ledger', category: 'Finance', icon: Landmark },
  { name: 'Expense Management', category: 'Finance', icon: Wallet },
  { name: 'Purchase Orders', category: 'Finance', icon: Package },
  { name: 'Vendor Management', category: 'Finance', icon: Warehouse },
  { name: 'Budget Planning', category: 'Finance', icon: PieChart },
  { name: 'Bank Reconciliation', category: 'Finance', icon: RefreshCw },
  { name: 'GST & Compliance', category: 'Finance', icon: ShieldCheck },
  { name: 'Refunds & Adjustments', category: 'Finance', icon: RefreshCw },
  { name: 'Fee Analytics', category: 'Finance', icon: ChartNoAxesCombined },
  { name: 'Due Escalations', category: 'Finance', icon: Bell },

  // Operations
  { name: 'Transport', category: 'Operations', icon: Bus, featured: true, blurb: 'Routes, stops, fees and driver rosters.' },
  { name: 'Live GPS Tracking', category: 'Operations', icon: MapPin, featured: true, blurb: 'Real-time bus location shared with parents.' },
  { name: 'Route Optimiser', category: 'Operations', icon: Route },
  { name: 'Hostel', category: 'Operations', icon: Warehouse },
  { name: 'Mess & Canteen', category: 'Operations', icon: Package },
  { name: 'Health Records', category: 'Operations', icon: HeartPulse },
  { name: 'Infirmary', category: 'Operations', icon: HeartPulse },
  { name: 'Inventory', category: 'Operations', icon: Package },
  { name: 'Asset Register', category: 'Operations', icon: Database },
  { name: 'Uniform Store', category: 'Operations', icon: Package },
  { name: 'Visitor Management', category: 'Operations', icon: UserCheck },
  { name: 'Gate Pass', category: 'Operations', icon: KeyRound },
  { name: 'Front Desk', category: 'Operations', icon: Bell },
  { name: 'Maintenance Tickets', category: 'Operations', icon: LifeBuoy },
  { name: 'Housekeeping', category: 'Operations', icon: RefreshCw },
  { name: 'Security & CCTV Hooks', category: 'Operations', icon: Camera },
  { name: 'Event Management', category: 'Operations', icon: CalendarClock },
  { name: 'Notice Board', category: 'Operations', icon: Bell },
  { name: 'Biometric Devices', category: 'Operations', icon: Fingerprint },
  { name: 'RFID Attendance', category: 'Operations', icon: Fingerprint },

  // Intelligence
  { name: 'AI Suite', category: 'Intelligence', icon: Sparkles, featured: true, blurb: 'Ten role-aware copilots trained on your school data.' },
  { name: 'Workflow Builder', category: 'Intelligence', icon: Workflow, featured: true, blurb: 'Drag-and-drop automation across every module.' },
  { name: 'Analytics Studio', category: 'Intelligence', icon: ChartNoAxesCombined, featured: true, blurb: 'Board-ready dashboards with drill-down to a student.' },
  { name: 'Report Designer', category: 'Intelligence', icon: FileSpreadsheet },
  { name: 'Predictive Insights', category: 'Intelligence', icon: Brain },
  { name: 'Dropout Risk Scoring', category: 'Intelligence', icon: Activity },
  { name: 'Fee Default Prediction', category: 'Intelligence', icon: PieChart },
  { name: 'Performance Trends', category: 'Intelligence', icon: ChartNoAxesCombined },
  { name: 'Benchmarking', category: 'Intelligence', icon: Trophy },
  { name: 'Board Reports', category: 'Intelligence', icon: FileText },
  { name: 'Custom KPIs', category: 'Intelligence', icon: Activity },
  { name: 'Data Warehouse Sync', category: 'Intelligence', icon: Database },

  // Platform
  { name: 'Role Permissions', category: 'Platform', icon: KeyRound, featured: true, blurb: 'Granular RBAC down to the field level.' },
  { name: 'Enterprise Security', category: 'Platform', icon: ShieldCheck, featured: true, blurb: 'Encryption at rest, SSO, and full audit logging.' },
  { name: 'Audit Logs', category: 'Platform', icon: FileText },
  { name: 'Multi-School Console', category: 'Platform', icon: Landmark, featured: true, blurb: 'Run 2 campuses or 200 from one control plane.' },
  { name: 'White Label', category: 'Platform', icon: Palette },
  { name: 'Custom Domains', category: 'Platform', icon: Cloud },
  { name: 'Open REST & GraphQL API', category: 'Platform', icon: Plug, featured: true, blurb: 'Everything in the UI is available over the API.' },
  { name: 'Webhooks', category: 'Platform', icon: Plug },
  { name: 'Integrations Hub', category: 'Platform', icon: Blocks },
  { name: 'Offline Sync', category: 'Platform', icon: RefreshCw },
  { name: 'Mobile Apps', category: 'Platform', icon: Smartphone },
  { name: 'SMS Gateway', category: 'Platform', icon: MessageSquare },
  { name: 'WhatsApp Business', category: 'Platform', icon: MessageSquare },
  { name: 'Email Campaigns', category: 'Platform', icon: Mail },
  { name: 'Push Notifications', category: 'Platform', icon: Bell },
  { name: 'Backup & Restore', category: 'Platform', icon: Database },
  { name: 'Data Residency', category: 'Platform', icon: Lock },
  { name: 'Single Sign-On', category: 'Platform', icon: KeyRound },
  { name: 'Two-Factor Auth', category: 'Platform', icon: Lock },
  { name: 'Sandbox Environments', category: 'Platform', icon: Cpu },
  { name: 'Import & Migration', category: 'Platform', icon: RefreshCw },
  { name: 'Settings & Branding', category: 'Platform', icon: Palette },
  { name: 'Localisation', category: 'Platform', icon: Route },
  { name: 'Uptime Monitoring', category: 'Platform', icon: Activity },
  { name: 'Developer Console', category: 'Platform', icon: Cpu },
  { name: 'Marketplace Apps', category: 'Platform', icon: Blocks },
]

/* -------------------------------------------------------------- AI cards */

export const AI_AGENTS = [
  {
    name: 'AI Principal',
    role: 'Institutional command',
    icon: Landmark,
    prompt: 'Which classes slipped this term and why?',
    answer:
      'Grade 9-B dropped 7.2% in Science. Attendance fell alongside it after the section change on 14 Aug.',
  },
  {
    name: 'AI Teacher',
    role: 'Classroom copilot',
    icon: Presentation,
    prompt: 'Draft a remedial plan for my bottom quartile.',
    answer: '11 students flagged. Generated a 3-week plan with worksheets and parent notes.',
  },
  {
    name: 'AI Student',
    role: 'Personal tutor',
    icon: GraduationCap,
    prompt: 'Explain photosynthesis for my exam tomorrow.',
    answer: 'Built a 12-card revision deck from your syllabus and last test errors.',
  },
  {
    name: 'AI Parent',
    role: 'Family assistant',
    icon: Smartphone,
    prompt: 'How is my child doing this month?',
    answer: 'Attendance 96%, Maths up 11%, one pending fee instalment due 5 Nov.',
  },
  {
    name: 'AI HR',
    role: 'People operations',
    icon: UserCheck,
    prompt: 'Who needs a substitute tomorrow?',
    answer: '4 teachers on leave. Suggested swaps with zero timetable conflicts.',
  },
  {
    name: 'AI Finance',
    role: 'Revenue intelligence',
    icon: Wallet,
    prompt: 'Project this quarter’s collection.',
    answer: '₹2.84 Cr expected — 94% confidence. ₹18.6 L at risk across 62 families.',
  },
  {
    name: 'AI Timetable',
    role: 'Schedule generator',
    icon: CalendarClock,
    prompt: 'Rebuild the timetable without Friday labs.',
    answer: '1,248 slots recomputed in 6.2s. Zero clashes, workload variance under 4%.',
  },
  {
    name: 'AI Attendance',
    role: 'Pattern analysis',
    icon: ScanFace,
    prompt: 'Flag chronic absentees early.',
    answer: '23 students trending toward the 75% threshold. Alerts drafted for parents.',
  },
  {
    name: 'AI Report Cards',
    role: 'Narrative generation',
    icon: FileText,
    prompt: 'Write remarks for section 7-A.',
    answer: '46 personalised remarks drafted from marks, behaviour and activity data.',
  },
  {
    name: 'AI Fee Prediction',
    role: 'Collection forecasting',
    icon: PieChart,
    prompt: 'Who will default next cycle?',
    answer: '62 families ranked by risk with the best-performing reminder channel each.',
  },
]

/* ------------------------------------------------------------- Workflow */

export const WORKFLOW_NODES = [
  {
    title: 'Admission Confirmed',
    kind: 'Trigger',
    detail: 'When an application moves to Enrolled',
    icon: UserPlus,
    tone: 'brand' as const,
  },
  {
    title: 'Generate Fee Plan',
    kind: 'Action',
    detail: 'Create instalments from the class fee structure',
    icon: Receipt,
    tone: 'azure' as const,
  },
  {
    title: 'Notify Parent',
    kind: 'Action',
    detail: 'WhatsApp + email with the payment link',
    icon: MessageSquare,
    tone: 'aqua' as const,
  },
  {
    title: 'Issue Certificates',
    kind: 'Action',
    detail: 'ID card, bonafide and admission letter',
    icon: BadgeCheck,
    tone: 'brand' as const,
  },
]

/* -------------------------------------------------------------- Features */

export const FEATURES = [
  {
    title: 'Cloud Native',
    body: 'Multi-tenant architecture on auto-scaling infrastructure. 99.98% uptime, zero maintenance windows.',
    icon: Cloud,
  },
  {
    title: 'Role Based Access',
    body: 'Field-level permissions across 40+ predefined roles, or design your own in minutes.',
    icon: KeyRound,
  },
  {
    title: 'Enterprise Security',
    body: 'AES-256 at rest, TLS 1.3 in transit, SSO, 2FA and immutable audit logs on every record.',
    icon: ShieldCheck,
  },
  {
    title: 'Offline Sync',
    body: 'Attendance and marks keep working through outages, then reconcile automatically.',
    icon: RefreshCw,
  },
  {
    title: 'Biometric & RFID',
    body: 'Native drivers for fingerprint, face and card devices. No middleware, no polling scripts.',
    icon: Fingerprint,
  },
  {
    title: 'WhatsApp, SMS & Email',
    body: 'Official Business API templates with delivery receipts and per-channel fallbacks.',
    icon: MessageSquare,
  },
  {
    title: 'Live GPS',
    body: 'Fleet telemetry streamed to parents and the transport desk with geofence alerts.',
    icon: MapPin,
  },
  {
    title: 'Real-Time Analytics',
    body: 'Every dashboard recomputes as data lands. No nightly batch, no stale numbers.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Open API',
    body: 'REST and GraphQL with webhooks, so your website, app or BI tool stays in sync.',
    icon: Plug,
  },
]

/* ---------------------------------------------------------- Integrations */

export const INTEGRATIONS = [
  { name: 'Razorpay', tag: 'Payments' },
  { name: 'Google Meet', tag: 'Live Classes' },
  { name: 'Zoom', tag: 'Live Classes' },
  { name: 'Microsoft 365', tag: 'Identity' },
  { name: 'Google Workspace', tag: 'Identity' },
  { name: 'WhatsApp Business', tag: 'Messaging' },
  { name: 'SMS Gateways', tag: 'Messaging' },
  { name: 'SMTP / Email', tag: 'Messaging' },
  { name: 'Biometric Devices', tag: 'Hardware' },
  { name: 'RFID Readers', tag: 'Hardware' },
  { name: 'Tally', tag: 'Accounting' },
  { name: 'Power BI', tag: 'Analytics' },
]

/* -------------------------------------------------------------- Pricing */

export type Plan = {
  name: string
  tagline: string
  price: string
  unit: string
  annualNote: string
  cta: string
  featured?: boolean
  highlights: string[]
}

export const PLANS: Plan[] = [
  {
    name: 'Starter',
    tagline: 'For single schools getting off paper.',
    price: '₹29',
    unit: '/ student / month',
    annualNote: 'Billed annually · min 300 students',
    cta: 'Start free trial',
    highlights: [
      'Students, staff & attendance',
      'Fee management + online payments',
      'Parent & teacher mobile apps',
      'SMS and email communication',
      'Standard reports',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    tagline: 'For schools running the whole campus on one system.',
    price: '₹59',
    unit: '/ student / month',
    annualNote: 'Billed annually · min 500 students',
    cta: 'Book live demo',
    featured: true,
    highlights: [
      'Everything in Starter',
      'All 100+ modules unlocked',
      'AI Suite with 10 copilots',
      'Workflow Builder & automations',
      'WhatsApp Business API',
      'Transport, GPS, hostel & library',
      'Analytics Studio',
      'Priority support with 4-hr SLA',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For groups operating multiple campuses.',
    price: '₹99',
    unit: '/ student / month',
    annualNote: 'Billed annually · min 2,000 students',
    cta: 'Talk to sales',
    highlights: [
      'Everything in Professional',
      'Multi-school control plane',
      'White label & custom domains',
      'SSO, SCIM and data residency',
      'Dedicated success manager',
      'Custom integrations',
      '99.98% uptime SLA',
    ],
  },
  {
    name: 'Custom',
    tagline: 'For boards, trusts and government programmes.',
    price: "Let's talk",
    unit: '',
    annualNote: 'Volume and public-sector pricing',
    cta: 'Contact us',
    highlights: [
      'On-premise or private cloud',
      'Bespoke module development',
      'Data migration at scale',
      'Onsite training programmes',
      'Procurement & tender support',
    ],
  },
]

/* --------------------------------------------------------- Testimonials */

export const TESTIMONIALS = [
  {
    quote:
      'We replaced four vendors in a single term. The part nobody believes is that fee reconciliation now takes minutes instead of a fortnight.',
    name: 'Principal, CBSE Senior Secondary',
    meta: 'Pune · 2,400 students',
    initials: 'PS',
    stat: '₹41 L recovered in dues',
    video: true,
  },
  {
    quote:
      'Face-recognition attendance changed the morning entirely. Parents get the notification before the first bell rings.',
    name: 'Head of Operations, Group of Schools',
    meta: 'Jaipur · 3 campuses',
    initials: 'HO',
    stat: '4 sec per class roll-call',
    video: false,
  },
  {
    quote:
      'The AI Principal briefing is the first thing I open. It tells me what moved and what needs me — not another dashboard to decode.',
    name: 'Director, International School',
    meta: 'Bengaluru · 1,800 students',
    initials: 'DI',
    stat: '18 hrs/week saved',
    video: true,
  },
  {
    quote:
      'Migration took eleven days including ten years of historical records. Our old ERP took nine months to set up.',
    name: 'IT Head, Trust-run Schools',
    meta: 'Nagpur · 6 campuses',
    initials: 'IT',
    stat: '11-day go-live',
    video: false,
  },
  {
    quote:
      'Transport used to be phone calls all morning. Now parents watch the bus on a map and the calls simply stopped.',
    name: 'Transport Manager, Day-Boarding School',
    meta: 'Indore · 42 buses',
    initials: 'TM',
    stat: '92% fewer calls',
    video: false,
  },
]

/* ------------------------------------------------------------------ FAQ */

export const FAQS = [
  {
    q: 'How long does implementation actually take?',
    a: 'A single campus is typically live in 14 days — that includes data migration, role setup, staff training and a parallel-run week. Multi-campus groups average four to six weeks. You get a named onboarding lead for the entire period.',
  },
  {
    q: 'Can you migrate our existing data?',
    a: 'Yes. We import from Excel, Tally, and every major ERP including Teachmint, Fedena, Entab and MyClassCampus. Historical fee ledgers, marks and attendance come across with their audit trail intact. Migration is included at no cost on annual plans.',
  },
  {
    q: 'What happens to our data if we leave?',
    a: 'It stays yours. Export everything — records, documents and ledgers — in open formats at any time from the admin console, no support ticket required. We also provide a full database dump on request during offboarding.',
  },
  {
    q: 'Is the AI trained on our students’ data?',
    a: 'Your data is never used to train shared models. Each school runs against an isolated context, all inference is logged for audit, and AI features can be disabled per role or turned off entirely from settings.',
  },
  {
    q: 'Does it work when the internet goes down?',
    a: 'Attendance, marks entry and fee collection continue offline on the mobile and desktop apps, then sync automatically with conflict resolution when the connection returns.',
  },
  {
    q: 'How is pricing calculated for seasonal enrolment?',
    a: 'You are billed on your enrolled headcount at the start of each term, not peak admissions traffic. Enquiries, alumni and staff accounts are never counted as students.',
  },
  {
    q: 'Which hardware do you support?',
    a: 'Fingerprint, face and RFID devices from eSSL, Mantra, ZKTeco, Realtime and Hikvision work out of the box. GPS trackers stream over standard protocols, so most fleet hardware connects without custom work.',
  },
  {
    q: 'Can we white-label it for our group?',
    a: 'On Enterprise and above, yes — your logo, palette, custom domain and branded parent apps on both stores. Parents never see the BuildSchoolOS name unless you want them to.',
  },
]

/* --------------------------------------------------------------- Footer */

export const FOOTER_LINKS = [
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press Kit', 'Partners', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API Reference', 'Migration Guide', 'Blog', 'Changelog'],
  },
  {
    title: 'Support',
    links: ['Help Centre', 'Onboarding', 'Training', 'System Status', 'Report an Issue'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'DPDP Compliance', 'Security', 'SLA'],
  },
]
