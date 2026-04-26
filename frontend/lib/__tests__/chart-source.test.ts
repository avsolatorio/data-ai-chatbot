import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DATA360_CHART_SOURCE_FALLBACK,
  formatData360VizChartSource,
} from "../data360/chart-source";

describe("formatData360VizChartSource", () => {
  it("uses database and indicator names when both present", () => {
    assert.equal(
      formatData360VizChartSource({
        database_name: "World Development Indicators",
        indicator_name: "GDP growth (annual %)",
      }),
      "World Bank — World Development Indicators — GDP growth (annual %)",
    );
  });

  it("falls back to ids when names missing", () => {
    assert.equal(
      formatData360VizChartSource({
        database_id: "WB_WDI",
        indicator_id: "WB_WDI_NY_GDP_MKTP_KD_ZG",
      }),
      "World Bank — WB_WDI — WB_WDI_NY_GDP_MKTP_KD_ZG",
    );
  });

  it("uses generic fallback when nothing useful", () => {
    assert.equal(formatData360VizChartSource({}), DATA360_CHART_SOURCE_FALLBACK);
  });
});
