"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main
          aria-labelledby="global-error-title"
          className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
        >
          <h1 id="global-error-title" className="text-2xl font-semibold">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while rendering this page."}
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => reset()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
