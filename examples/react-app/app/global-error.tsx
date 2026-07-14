"use client";

import { useEffect } from "react";

import { Button } from "~/components/ui/button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Handle serialization of BigInt values in error objects
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-svh">
        <main className="container flex min-h-svh items-center justify-center py-10">
          <div className="w-full max-w-2xl rounded-md border border-red-200 bg-red-50 p-4">
            <h2 className="font-medium text-red-800">An unexpected error has occurred:</h2>
            <p className="mt-2 text-red-700">{error.message}</p>
            <hr className="my-3 border-red-200" />
            <pre className="max-h-80 overflow-auto text-red-700">
              {JSON.stringify(
                {
                  digest: error.digest,
                  cause: error.cause,
                  stack: error.stack,
                },
                null,
                2,
              )}
            </pre>
            <Button onClick={reset} className="mt-4 w-full">
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
