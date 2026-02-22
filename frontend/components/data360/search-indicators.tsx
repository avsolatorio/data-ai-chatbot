"use client";

import { SearchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SearchIndicatorsInput, SearchIndicatorsOutput } from "./types";

const SearchIconComponent = () => (
  <SearchIcon className="size-5 text-muted-foreground" />
);

export function SearchIndicatorsRequestSummary({
  input,
}: {
  input: SearchIndicatorsInput;
}) {
  const hasQuery = input.query != null && String(input.query).trim() !== "";
  const hasCountry =
    input.required_country != null &&
    String(input.required_country).trim() !== "";
  const hasLimit =
    input.limit != null && Number.isFinite(Number(input.limit));
  const hasOffset =
    input.offset != null && Number.isFinite(Number(input.offset));

  if (!hasQuery && !hasCountry && !hasLimit && !hasOffset) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Request
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {hasQuery && (
          <>
            <dt className="font-medium text-muted-foreground">Query</dt>
            <dd className="text-foreground">&ldquo;{input.query}&rdquo;</dd>
          </>
        )}
        {hasCountry && (
          <>
            <dt className="font-medium text-muted-foreground">
              Required country
            </dt>
            <dd className="font-mono text-foreground">
              {input.required_country}
            </dd>
          </>
        )}
        {hasLimit && (
          <>
            <dt className="font-medium text-muted-foreground">Limit</dt>
            <dd className="text-foreground">{input.limit}</dd>
          </>
        )}
        {hasOffset && (
          <>
            <dt className="font-medium text-muted-foreground">Offset</dt>
            <dd className="text-foreground">{input.offset}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

export function SearchIndicators({
  input,
  output,
}: {
  input?: SearchIndicatorsInput | null;
  output: SearchIndicatorsOutput;
}) {
  const requestSummary =
    input != null ? <SearchIndicatorsRequestSummary input={input} /> : null;

  // Handle error case
  if (output.error) {
    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          <div className="font-medium">Error</div>
          <div className="mt-1">{output.error}</div>
        </div>
      </div>
    );
  }

  // Handle empty results
  if (!output.indicators || output.indicators.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {requestSummary}
        <div className="rounded-lg border border-border bg-background p-4 text-muted-foreground text-sm">
          No indicators found
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-4 overflow-hidden rounded-sm bg-background px-4 pb-4">
        {requestSummary}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <SearchIconComponent />
              <div className="font-semibold text-sm">Search Results</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-muted-foreground text-xs">
              Showing {output.count} of {output.total_count.toLocaleString()}{" "}
              indicator{output.total_count !== 1 ? "s" : ""}
            </div>
            {/* {output.has_more && (
              <div className="text-muted-foreground text-[10px]">
                More results available
              </div>
            )} */}
          </div>
        </div>

        {/* Horizontal Scrollable Cards */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max gap-3 pb-4">
            {output.indicators.map((indicator, index) => (
              <Card
                className="min-w-[360px] max-w-[420px] shrink-0 border-border transition-colors hover:border-primary/50"
                key={`${indicator.idno}-${index}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2 font-medium text-sm leading-tight">
                    {indicator.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3">
                    {/* ID and Database */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                      <div>
                        <span className="font-medium">ID:</span> {indicator.idno}
                      </div>
                      <div>
                        <span className="font-medium">Database:</span>{" "}
                        {indicator.database_id}
                      </div>
                    </div>

                    {/* Definition */}
                    {indicator.truncated_definition && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded border border-border bg-muted/30 p-2.5">
                            <div className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
                              {indicator.truncated_definition}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md" side="top">
                          <p className="whitespace-normal text-xs">
                            {indicator.truncated_definition}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 rounded border border-border bg-muted/20 p-2">
                      {indicator.periodicity && (
                        <div className="text-muted-foreground text-xs">
                          <span className="font-medium">Periodicity:</span>{" "}
                          <span className="text-foreground">
                            {indicator.periodicity}
                          </span>
                        </div>
                      )}
                      {indicator.latest_data && (
                        <div className="text-muted-foreground text-xs">
                          <span className="font-medium">Latest:</span>{" "}
                          <span className="text-foreground">
                            {indicator.latest_data}
                          </span>
                        </div>
                      )}
                      {indicator.time_period_range && (
                        <div className="col-span-2 text-muted-foreground text-xs">
                          <span className="font-medium">Range:</span>{" "}
                          <span className="text-foreground">
                            {indicator.time_period_range}
                          </span>
                        </div>
                      )}
                      {indicator.dimensions &&
                        indicator.dimensions.length > 0 && (
                          <div className="col-span-2 text-muted-foreground text-xs">
                            <span className="font-medium">Dimensions:</span>{" "}
                            <span className="text-foreground">
                              {indicator.dimensions.join(", ")}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Pagination Info
        {output.has_more && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                <svg
                  fill="none"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="text-blue-800 text-xs leading-relaxed dark:text-blue-200">
                Showing results {output.offset + 1}-
                {output.offset + output.count} of{" "}
                {output.total_count.toLocaleString()}.
                {output.has_more &&
                  ` Next page starts at offset ${output.next_offset}.`}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </TooltipProvider>
  );
}
