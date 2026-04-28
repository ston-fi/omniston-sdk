"use client";

import { useId } from "react";
import { SettlementMethod } from "@ston-fi/omniston-sdk-react";

import { isValidAddress } from "@/lib/address";
import { Chain, EVM_CHAINS } from "@/models/chain";
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
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SLIPPAGE_TOLERANCE_PERCENT,
  MAX_INTEGRATOR_FEE_PIPS,
  MAX_SLIPPAGE_TOLERANCE_PERCENT,
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
        <SettlementMethodsSection />
        <hr />
        <SwapSlippageToleranceSection />
        <SwapIntegratorFeeSection />
        <SwapIntegratorFlexibleFeeSection />
        <hr />
        <OrderHtlcMaxExecutionsSection />
      </DialogContent>
    </Dialog>
  );
}

const SettlementMethodsSection = () => {
  const { settlementMethods, setSettlementMethods } = useSwapSettings();

  return (
    <section className="space-y-2">
      <p className="text-sm font-medium">Settlement Methods</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(SettlementMethod).map(([key, value]) => {
          const isSelected = !!settlementMethods.find((method) => method === value);
          const isDisabled = settlementMethods.length === 1 && isSelected;

          return (
            <Button
              key={key}
              className="flex flex-grow"
              disabled={isDisabled}
              variant={settlementMethods.includes(value) ? "default" : "secondary"}
              onClick={() => {
                if (settlementMethods.includes(value)) {
                  setSettlementMethods([...new Set(settlementMethods.filter((m) => m !== value))]);
                } else {
                  setSettlementMethods([...new Set([...settlementMethods, value])]);
                }
              }}
            >
              {key}
            </Button>
          );
        })}
      </div>
    </section>
  );
};

const SwapSlippageToleranceSection = () => {
  const {
    settlementMethods,
    slippageTolerancePercent,
    setSlippageTolerancePercent,
    autoSlippageTolerance,
    setAutoSlippageTolerance,
  } = useSwapSettings();

  const inputId = useId();
  const isSwapSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.SWAP,
  );

  const disabled = !isSwapSettlementMethod;

  return (
    <section className="flex items-end space-x-2">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={inputId}>Slippage Tolerance</Label>
        {autoSlippageTolerance ? (
          <Input id={inputId} type="text" value="Auto" disabled />
        ) : (
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={0}
            disabled={disabled}
            max={MAX_SLIPPAGE_TOLERANCE_PERCENT}
            value={!Number.isNaN(slippageTolerancePercent) ? slippageTolerancePercent : ""}
            onChange={(e) => {
              const value = Number.parseFloat(e.target.value);

              if (value < 0 || value > MAX_SLIPPAGE_TOLERANCE_PERCENT) return;

              setSlippageTolerancePercent(value);
            }}
          />
        )}
      </div>
      {[1, 5, 10].map((value) => (
        <Button
          key={value}
          disabled={disabled}
          variant={
            !autoSlippageTolerance && value === slippageTolerancePercent ? "default" : "secondary"
          }
          onClick={() => {
            setAutoSlippageTolerance(false);
            setSlippageTolerancePercent(value);
          }}
        >
          {value}%
        </Button>
      ))}
      <Button
        disabled={disabled}
        variant={autoSlippageTolerance ? "default" : "secondary"}
        onClick={() => {
          setAutoSlippageTolerance(true);
          setSlippageTolerancePercent(DEFAULT_SLIPPAGE_TOLERANCE_PERCENT);
        }}
      >
        Auto
      </Button>
    </section>
  );
};

const SwapIntegratorFeeSection = () => {
  const {
    settlementMethods,
    integratorAddress,
    setIntegratorAddress,
    integratorFeePips,
    setIntegratorFeePips,
  } = useSwapSettings();

  const addressInputId = useId();
  const feeInputId = useId();

  const isSwapSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.SWAP,
  );

  const disabled = !isSwapSettlementMethod;
  const isIntegratorAddressValid =
    !integratorAddress ||
    isValidAddress(Chain.TON, integratorAddress) ||
    isValidAddress(EVM_CHAINS[0], integratorAddress);

  return (
    <section className="flex flex-col space-y-2">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={addressInputId}>Integrator Address</Label>
        <Input
          id={addressInputId}
          type="text"
          disabled={disabled}
          value={integratorAddress ?? ""}
          aria-invalid={!disabled && !isIntegratorAddressValid}
          className={!disabled && !isIntegratorAddressValid ? "border-destructive" : ""}
          placeholder=""
          onChange={(e) => {
            const address = e.target.value || undefined;

            setIntegratorAddress(address);

            if (!address) {
              setIntegratorFeePips(undefined);
            }
          }}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={feeInputId}>Integrator Fee (pips)</Label>
        <Input
          id={feeInputId}
          type="number"
          disabled={disabled || !integratorAddress || !isIntegratorAddressValid}
          min={0}
          max={MAX_INTEGRATOR_FEE_PIPS}
          value={integratorFeePips ?? ""}
          placeholder={`0-${MAX_INTEGRATOR_FEE_PIPS}`}
          onChange={(e) => {
            if (!e.target.value) {
              setIntegratorFeePips(undefined);
              return;
            }

            const value = Number.parseInt(e.target.value);
            if (value < 0 || value > MAX_INTEGRATOR_FEE_PIPS) return;

            setIntegratorFeePips(value);
          }}
        />
      </div>
    </section>
  );
};

const SwapIntegratorFlexibleFeeSection = () => {
  const { settlementMethods, flexibleIntegratorFee, setFlexibleIntegratorFee } = useSwapSettings();

  const isSwapSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.SWAP,
  );
  const disabled = !isSwapSettlementMethod;

  return (
    <section className="flex items-center gap-2">
      <Label htmlFor="flexible-integrator-fee" className="flex-1">
        Whether a flexible integrator fee can be applied for the quote
      </Label>
      <Switch
        id="flexible-integrator-fee"
        disabled={disabled}
        checked={flexibleIntegratorFee}
        onCheckedChange={(checked) => setFlexibleIntegratorFee(checked)}
      />
    </section>
  );
};

const OrderHtlcMaxExecutionsSection = () => {
  const { settlementMethods, htlcMaxExecutions, setHtlcMaxExecutions } = useSwapSettings();

  const inputId = useId();
  const isOrderSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.ORDER,
  );

  return (
    <section className="flex items-end space-x-2">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={inputId}>HTLC Max Executions</Label>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          value={htlcMaxExecutions}
          disabled={!isOrderSettlementMethod}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value);

            if (value < 1) return;

            setHtlcMaxExecutions(value);
          }}
        />
      </div>
    </section>
  );
};
