import axios from "axios";

export interface OpenCageResponse {
  documentation: string;
  licenses: OpenCageLicense[];
  rate: OpenCageRate;
  results: OpenCageResult[];
  status: OpenCageStatus;
  total_results: number;
}

export interface OpenCageLicense {
  name: string;
  url: string;
}

export interface OpenCageRate {
  limit: number;
  remaining: number;
  reset: number;
}

export interface OpenCageStatus {
  code: number;
  message: string;
}

export interface OpenCageResult {
  annotations: OpenCageAnnotations;
  bounds?: OpenCageBounds;
  components: OpenCageComponents;
  confidence: number;
  formatted: string;
  geometry: OpenCageGeometry;
}

export interface OpenCageGeometry {
  lat: number;
  lng: number;
}

export interface OpenCageBounds {
  northeast: OpenCageGeometry;
  southwest: OpenCageGeometry;
}

export interface OpenCageComponents {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;

  road?: string;
  neighbourhood?: string;
  suburb?: string;

  // Puede traer muchas más propiedades dinámicas
  [key: string]: any;
}

export interface OpenCageAnnotations {
  timezone?: {
    name: string;
    now_in_dst: number;
    offset_sec: number;
    offset_string: string;
    short_name: string;
  };

  currency?: {
    name: string;
    symbol: string;
    iso_code: string;
  };

  flag?: string;

  [key: string]: any;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  const API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_KEY;

  const res = await axios.get<OpenCageResponse>(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${API_KEY}`,
  );

  const data = res.data;

  if (!data.results.length) return "Unknown";

  const components = data.results[0].components;

  const city =
    components.city ||
    components.town ||
    components.village ||
    components.municipality ||
    "";

  const country = components.country || "";

  return city && country ? `${city}, ${country}` : city || country || "Unknown";
}
