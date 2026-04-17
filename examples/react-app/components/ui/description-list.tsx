import { cn } from "@/lib/utils";

export function DescriptionList({ children, className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      {...props}
      className={cn(
        "space-y-2",
        "[&>li]:grid [&>li]:grid-cols-[1fr_max-content] [&>li]:gap-2",
        "[&>li>*:nth-child(1)]:overflow-hidden [&>li>*:nth-child(1)]:text-ellipsis [&>li>*:nth-child(1)]:whitespace-nowrap",
        "[&>li>*:nth-child(2)]:ml-auto [&>li>*:nth-child(2)]:font-mono",
        className,
      )}
    >
      {children}
    </dl>
  );
}
