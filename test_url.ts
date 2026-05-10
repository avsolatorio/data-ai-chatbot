import { proxyChartUrlForFetch } from "./frontend/lib/chart-url.ts";
console.log(proxyChartUrlForFetch("http://host.docker.internal:8021/static/viz_specs/uuid.json", ""));
