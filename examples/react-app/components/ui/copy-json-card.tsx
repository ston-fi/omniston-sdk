"use client";

import { cn } from "@/lib/utils";
import { Copy } from "@/components/ui/copy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type CopyJsonCardProps<T extends unknown> = Omit<React.ComponentProps<typeof Card>, "title"> & {
  title: React.ComponentProps<typeof CardHeader>["children"];
  value: T;
};

export function CopyJsonCard<T>({
  title,
  value,
  children,
  className,
  ...props
}: CopyJsonCardProps<T>) {
  const json = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <Card {...props} className={cn("border rounded-md bg-secondary/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b px-3 py-2 text-sm">
        {title}

        <Copy className="ml-auto pl-2 text-nowrap underline underline-offset-2" value={json}>
          Copy JSON
        </Copy>
      </CardHeader>
      <CardContent className="px-3 py-2">{children}</CardContent>
    </Card>
  );
}
