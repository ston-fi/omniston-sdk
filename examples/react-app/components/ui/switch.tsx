"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "~/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[unchecked]:bg-input dark:data-[unchecked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform group-data-[checked]/switch:translate-x-[calc(100%-2px)] group-data-[unchecked]/switch:translate-x-0 dark:group-data-[checked]/switch:bg-primary-foreground dark:group-data-[unchecked]/switch:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
