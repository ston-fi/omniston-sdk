"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SLIPPAGE_TOLERANCE,
  useSwapSettings,
} from "@/providers/swap-settings";

export function SwapSettings({
  trigger = (
    <Button variant="outline" className="w-fit">
      Settings
    </Button>
  ),
}: React.ComponentProps<"div"> & {
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Settings</DialogTitle>
        </DialogHeader>
        <SlippageToleranceSection />
      </DialogContent>
    </Dialog>
  );
}

const transformValue = (value: number) => value * 100;
const transformValueBack = (value: number) => value / 100;

const SlippageToleranceSection = () => {
  const {
    slippageTolerance,
    setSlippageTolerance,
    autoSlippageTolerance,
    setAutoSlippageTolerance,
  } = useSwapSettings();

  const inputId = useId();

  const slippageToleranceValue = transformValue(slippageTolerance);

  return (
    <section className="flex space-x-2 items-end">
      <div className="grid items-center gap-1.5 w-full">
        <Label htmlFor={inputId}>Slippage Tolerance</Label>
        {autoSlippageTolerance ? (
          <Input id={inputId} type="text" value="Auto" disabled />
        ) : (
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={
              Number.isNaN(slippageToleranceValue)
                ? undefined
                : slippageToleranceValue
            }
            onChange={(e) =>
              setSlippageTolerance(
                transformValueBack(Number.parseFloat(e.target.value)),
              )
            }
          />
        )}
      </div>
      {[0.01, 0.05, 0.1].map((value) => (
        <Button
          key={value}
          variant={
            !autoSlippageTolerance && value === slippageTolerance
              ? "default"
              : "secondary"
          }
          onClick={() => {
            setAutoSlippageTolerance(false);
            setSlippageTolerance(value);
          }}
        >
          {transformValue(value)}%
        </Button>
      ))}
      <Button
        variant={autoSlippageTolerance ? "default" : "secondary"}
        onClick={() => {
          setAutoSlippageTolerance(true);
          setSlippageTolerance(DEFAULT_SLIPPAGE_TOLERANCE);
        }}
      >
        Auto
      </Button>
    </section>
  );
};
