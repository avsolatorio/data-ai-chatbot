export {
  type Data360SourceEntry,
  getData360SourcesFromParts,
} from "./sources";

/** True if the URL is an indicator page (e.g. Data 360 /indicator/...). Used to open such links in the embed artifact instead of a new tab. */
export function isIndicatorUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.pathname.includes("/indicator/");
  } catch {
    return false;
  }
}
