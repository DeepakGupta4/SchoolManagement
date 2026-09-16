import { createApiResource } from "./createApiResource";

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

export const alumniApi = createApiResource<Alumnus, AlumniFilters>("/api/alumni");
