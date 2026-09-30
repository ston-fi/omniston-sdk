"use client";

import { useId } from "react";
import { SettlementMethod } from "@ston-fi/omniston-sdk-react";

import { isValidAddress } from "~/models/address";
import { Chain } from "~/models/chain";
import { ChainFamily, chainsByFamily } from "~/models/chain-family";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "~/components/ui/field";
import { Switch } from "~/components/ui/switch";
import {
  DEFAULT_SLIPPAGE_TOLERANCE_PERCENT,
  MAX_INTEGRATOR_FEE_PIPS,
  MAX_SLIPPAGE_TOLERANCE_PERCENT,
  useSwapSettings,
} from "~/providers/swap-settings";

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
        <FieldGroup>
          <SettlementMethodsSection />
          <FieldSeparator />
          <SwapSlippageToleranceSection />
          <FieldSeparator />
          <SwapIntegratorFlexibleFeeSection />
          <SwapIntegratorFeeSection />
          <FieldSeparator />
          <OrderHtlcMaxExecutionsSection />
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

const SettlementMethodsSection = () => {
  const { settlementMethods, setSettlementMethods } = useSwapSettings();
  const id = useId();

  return (
    <FieldSet>
      <FieldLegend variant="label">Settlement Methods</FieldLegend>
      <FieldDescription>
        Choose how trades can be completed. Keep at least one method enabled.
      </FieldDescription>
      <FieldGroup className="gap-3">
        {Object.entries(SettlementMethod).map(([key, value]) => {
          const isSelected = !!settlementMethods.find((method) => method === value);
          const isDisabled = settlementMethods.length === 1 && isSelected;

          return (
            <Field key={key} orientation="horizontal" data-disabled={isDisabled}>
              <Checkbox
                id={`${id}-${key}`}
                value={value}
                checked={isSelected}
                disabled={isDisabled}
                className="data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                onCheckedChange={() => {
                  if (settlementMethods.includes(value)) {
                    setSettlementMethods([
                      ...new Set(settlementMethods.filter((m) => m !== value)),
                    ]);
                  } else {
                    setSettlementMethods([...new Set([...settlementMethods, value])]);
                  }
                }}
              />
              <FieldLabel
                htmlFor={`${id}-${key}`}
                className="peer-data-[disabled]:cursor-not-allowed"
              >
                {key}
              </FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
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
    <Field data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor={inputId}>Slippage Tolerance</FieldLabel>
        <FieldDescription>
          Set the maximum price change you accept for a swap. Auto uses Omniston’s recommendation.
        </FieldDescription>
      </FieldContent>
      <div className="flex items-end space-x-2">
        <div className="grid w-full items-center gap-1.5">
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
      </div>
    </Field>
  );
};

const SwapIntegratorFeeSection = () => {
  const { integratorAddress, setIntegratorAddress, integratorFeePips, setIntegratorFeePips } =
    useSwapSettings();

  const addressInputId = useId();
  const feeInputId = useId();

  const disabled = false;
  const isIntegratorAddressValid =
    !integratorAddress ||
    isValidAddress(Chain.TON, integratorAddress) ||
    isValidAddress(chainsByFamily[ChainFamily.EVM][0], integratorAddress);

  return (
    <FieldGroup>
      <Field data-disabled={disabled} data-invalid={!disabled && !isIntegratorAddressValid}>
        <FieldLabel htmlFor={addressInputId}>Integrator Address</FieldLabel>
        <Input
          id={addressInputId}
          type="text"
          disabled={disabled}
          value={integratorAddress ?? ""}
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
      </Field>
      <Field data-disabled={disabled || !integratorAddress || !isIntegratorAddressValid}>
        <FieldLabel htmlFor={feeInputId}>Integrator Fee (pips)</FieldLabel>
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
      </Field>
    </FieldGroup>
  );
};

const SwapIntegratorFlexibleFeeSection = () => {
  const { settlementMethods, flexibleIntegratorFee, setFlexibleIntegratorFee } = useSwapSettings();

  const isSwapSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.SWAP,
  );
  const disabled = !isSwapSettlementMethod;

  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor="flexible-integrator-fee">Flexible integrator fee</FieldLabel>
        <FieldDescription>
          Allow the integrator fee to vary so quotes can include protocols with limited fee support.
        </FieldDescription>
      </FieldContent>
      <Switch
        id="flexible-integrator-fee"
        disabled={disabled}
        checked={flexibleIntegratorFee}
        onCheckedChange={(checked) => setFlexibleIntegratorFee(checked)}
      />
    </Field>
  );
};

const OrderHtlcMaxExecutionsSection = () => {
  const { settlementMethods, htlcMaxExecutions, setHtlcMaxExecutions } = useSwapSettings();

  const inputId = useId();
  const isOrderSettlementMethod = !!settlementMethods.find(
    (method) => method === SettlementMethod.ORDER,
  );

  return (
    <Field data-disabled={!isOrderSettlementMethod}>
      <FieldLabel htmlFor={inputId}>HTLC Max Executions</FieldLabel>
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
    </Field>
  );
};
