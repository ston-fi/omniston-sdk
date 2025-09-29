import clsx from "clsx";
import type { ComponentPropsWithoutRef, FC } from "react";

export const Spinner: FC<
  Omit<ComponentPropsWithoutRef<"span">, "children">
> = ({ className, ...props }) => (
  <span
    {...props}
    className={clsx(
      "inline-block size-4 align-[-0.125em]",
      "border-2 border-solid border-current border-r-transparent rounded-full",
      "animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]",
      className,
    )}
    role="status"
  >
    <span className="absolute! -m-px! h-px! w-px! overflow-hidden! whitespace-nowrap! border-0! p-0! [clip:rect(0,0,0,0)]!">
      Loading...
    </span>
  </span>
);
