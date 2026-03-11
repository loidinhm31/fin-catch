import React from "react";
import {
  Input,
  Label,
  SimpleSelect as Select,
} from "@fin-catch/ui/components/atoms";

export interface SavingsEntryFormProps {
  depositLabel: string;
  setDepositLabel: (v: string) => void;
  principal: string;
  setPrincipal: (v: string) => void;
  interestRate: string;
  setInterestRate: (v: string) => void;
  demandDepositRate: string;
  setDemandDepositRate: (v: string) => void;
  termMonths: string;
  setTermMonths: (v: string) => void;
  compoundingType: "simple" | "compound";
  setCompoundingType: (v: "simple" | "compound") => void;
  isSubmitting: boolean;
}

export const SavingsEntryForm: React.FC<SavingsEntryFormProps> = ({
  depositLabel,
  setDepositLabel,
  principal,
  setPrincipal,
  interestRate,
  setInterestRate,
  demandDepositRate,
  setDemandDepositRate,
  termMonths,
  setTermMonths,
  compoundingType,
  setCompoundingType,
  isSubmitting,
}) => {
  return (
    <>
      <div>
        <Label required>Deposit Label</Label>
        <Input
          type="text"
          value={depositLabel}
          onChange={(e) => setDepositLabel(e.target.value)}
          placeholder="e.g., VCB 12T"
          disabled={isSubmitting}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            marginTop: "var(--space-1)",
          }}
        >
          Short label to identify this deposit
        </p>
      </div>

      <div>
        <Label required>Principal Amount</Label>
        <Input
          type="number"
          step="1"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="e.g., 100000000"
          disabled={isSubmitting}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            marginTop: "var(--space-1)",
          }}
        >
          Amount deposited per entry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Interest Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g., 6.5"
            disabled={isSubmitting}
          />
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              marginTop: "var(--space-1)",
            }}
          >
            Annual rate
          </p>
        </div>
        <div>
          <Label>Demand Deposit Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={demandDepositRate}
            onChange={(e) => setDemandDepositRate(e.target.value)}
            placeholder="e.g., 0.1"
            disabled={isSubmitting}
          />
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              marginTop: "var(--space-1)",
            }}
          >
            Early withdrawal rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label required>Term (months)</Label>
          <Input
            type="number"
            step="1"
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
            placeholder="e.g., 12"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label>Compounding Type</Label>
          <Select
            value={compoundingType}
            onValueChange={(value) =>
              setCompoundingType(value as "simple" | "compound")
            }
            disabled={isSubmitting}
            options={[
              { value: "simple", label: "Simple (single term)" },
              { value: "compound", label: "Compound (auto-renewal)" },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-alert-info-bg)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-alert-info-border)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-alert-info-text)",
          }}
        >
          <strong>Savings Valuation:</strong>
          <br />
          • Simple: principal × (1 + rate × term/12) at maturity
          <br />
          • Compound: auto-renewal — interest from each term rolls into next
          <br />• Early withdrawal uses demand deposit rate × days elapsed
        </p>
      </div>
    </>
  );
};
