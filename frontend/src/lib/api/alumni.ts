import { createResource, textMatch } from "./createResource";

export interface Alumnus {
  id: string;
  name: string;
  batch: string;
  stream: string;
  occupation: string;
  employer: string;
  city: string;
  email: string;
  phone: string;
  mentor: boolean;
  interests: string[];
}

export interface AlumniFilters {
  search?: string;
  batch?: string;
  stream?: string;
  city?: string;
}

export const BATCH_OPTIONS = [
  "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014",
];

export const STREAM_OPTIONS = ["Science", "Commerce", "Arts"];

export const CITY_OPTIONS = [
  "Bengaluru", "Chennai", "Gurugram", "Guwahati", "Hyderabad",
  "Jaipur", "Jamshedpur", "Mumbai", "New Delhi", "Pune",
];

/** What an alumnus is willing to help the school with. */
export const INTEREST_OPTIONS = [
  "Career talks",
  "Mock interviews",
  "Internships",
  "Scholarship fund",
  "Alumni meet",
];

const seed: Alumnus[] = [
  { id: "ALM-001", name: "Rohan Deshpande",  batch: "2014", stream: "Science",  occupation: "Software Engineer",    employer: "Infosys",            city: "Pune",       email: "rohan.d@example.in",   phone: "98765-43210", mentor: true,  interests: ["Career talks", "Mock interviews"] },
  { id: "ALM-002", name: "Sneha Kulkarni",   batch: "2014", stream: "Commerce", occupation: "Chartered Accountant", employer: "Deloitte India",     city: "Mumbai",     email: "sneha.k@example.in",   phone: "98450-11223", mentor: true,  interests: ["Career talks", "Scholarship fund"] },
  { id: "ALM-003", name: "Aditya Menon",     batch: "2015", stream: "Science",  occupation: "Doctor (MBBS, MD)",    employer: "AIIMS Delhi",        city: "New Delhi",  email: "aditya.m@example.in",  phone: "99887-65432", mentor: false, interests: ["Alumni meet"] },
  { id: "ALM-004", name: "Priya Raghavan",   batch: "2015", stream: "Arts",     occupation: "Civil Servant (IAS)",  employer: "Govt. of Karnataka", city: "Bengaluru",  email: "priya.r@example.in",   phone: "90123-45678", mentor: true,  interests: ["Career talks", "Alumni meet"] },
  { id: "ALM-005", name: "Karthik Subraman", batch: "2016", stream: "Science",  occupation: "Data Scientist",       employer: "Flipkart",           city: "Bengaluru",  email: "karthik.s@example.in", phone: "88990-11223", mentor: false, interests: ["Internships"] },
  { id: "ALM-006", name: "Meera Bhattachar", batch: "2016", stream: "Commerce", occupation: "Investment Banker",    employer: "ICICI Securities",   city: "Mumbai",     email: "meera.b@example.in",   phone: "97654-32109", mentor: true,  interests: ["Scholarship fund", "Mock interviews"] },
  { id: "ALM-007", name: "Nikhil Chauhan",   batch: "2017", stream: "Science",  occupation: "Mechanical Engineer",  employer: "Tata Motors",        city: "Jamshedpur", email: "nikhil.c@example.in",  phone: "96543-21098", mentor: false, interests: ["Internships"] },
  { id: "ALM-008", name: "Tanvi Shah",       batch: "2017", stream: "Arts",     occupation: "Journalist",           employer: "The Hindu",          city: "Chennai",    email: "tanvi.s@example.in",   phone: "95432-10987", mentor: false, interests: ["Alumni meet"] },
  { id: "ALM-009", name: "Harsh Vardhan",    batch: "2018", stream: "Commerce", occupation: "Startup Founder",      employer: "GreenCart Pvt Ltd",  city: "Gurugram",   email: "harsh.v@example.in",   phone: "94321-09876", mentor: true,  interests: ["Career talks", "Internships"] },
  { id: "ALM-010", name: "Ritika Agarwal",   batch: "2018", stream: "Science",  occupation: "Architect",            employer: "Morphogenesis",      city: "New Delhi",  email: "ritika.a@example.in",  phone: "93210-98765", mentor: false, interests: [] },
  { id: "ALM-011", name: "Sameer Qureshi",   batch: "2019", stream: "Science",  occupation: "Research Scholar",     employer: "IISc Bengaluru",     city: "Bengaluru",  email: "sameer.q@example.in",  phone: "92109-87654", mentor: false, interests: ["Career talks"] },
  { id: "ALM-012", name: "Divya Pillai",     batch: "2019", stream: "Commerce", occupation: "Product Manager",      employer: "Zomato",             city: "Gurugram",   email: "divya.p@example.in",   phone: "91098-76543", mentor: true,  interests: ["Mock interviews", "Internships"] },
  { id: "ALM-013", name: "Abhinav Rathore",  batch: "2020", stream: "Arts",     occupation: "Lawyer",               employer: "AZB & Partners",     city: "Mumbai",     email: "abhinav.r@example.in", phone: "90987-65432", mentor: false, interests: [] },
  { id: "ALM-014", name: "Shreya Nambiar",   batch: "2020", stream: "Science",  occupation: "Cardiologist",         employer: "Apollo Hospitals",   city: "Hyderabad",  email: "shreya.n@example.in",  phone: "89876-54321", mentor: true,  interests: ["Career talks", "Scholarship fund"] },
  { id: "ALM-015", name: "Varun Malhotra",   batch: "2021", stream: "Commerce", occupation: "Financial Analyst",    employer: "HDFC Bank",          city: "Mumbai",     email: "varun.m@example.in",   phone: "88765-43210", mentor: false, interests: ["Alumni meet"] },
  { id: "ALM-016", name: "Ayesha Siddiqui",  batch: "2021", stream: "Science",  occupation: "Civil Engineer",       employer: "L&T Construction",   city: "Chennai",    email: "ayesha.s@example.in",  phone: "87654-32109", mentor: false, interests: ["Internships"] },
  { id: "ALM-017", name: "Manav Kapoor",     batch: "2022", stream: "Arts",     occupation: "Graphic Designer",     employer: "Freelance",          city: "Jaipur",     email: "manav.k@example.in",   phone: "86543-21098", mentor: false, interests: ["Alumni meet"] },
  { id: "ALM-018", name: "Ishani Barua",     batch: "2022", stream: "Science",  occupation: "M.Tech Student",       employer: "IIT Guwahati",       city: "Guwahati",   email: "ishani.b@example.in",  phone: "85432-10987", mentor: true,  interests: ["Career talks", "Mock interviews"] },
];

export const alumniApi = createResource<Alumnus, AlumniFilters>({
  idPrefix: "alm",
  seed,
  uniqueBy: { field: "email", label: "Email" },
  defaults: { mentor: false, interests: [] },
  matches: (row, { search, batch, stream, city }) => {
    if (batch && row.batch !== batch) return false;
    if (stream && row.stream !== stream) return false;
    if (city && row.city !== city) return false;
    return textMatch(search, row.name, row.occupation, row.employer, row.email);
  },
});
