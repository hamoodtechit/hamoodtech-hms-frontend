import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface SmartNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  allowNegative?: boolean;
  prefix?: string;
}

export const SmartNumberInput = React.forwardRef<HTMLInputElement, SmartNumberInputProps>(
  ({ value, onChange, className, allowNegative = false, prefix, ...props }, ref) => {
    // Local string state to handle intermediate inputs (like "-", "", "0.")
    const [inputValue, setInputValue] = useState<string>("");

    // Sync local state with prop value when prop value changes externally
    useEffect(() => {
      if (value === undefined || value === null) {
        setInputValue("");
      } else {
        const currentNumeric = parseFloat(inputValue);
        // Only update if:
        // 1. The input is empty but the value is NOT 0 (so we allow it to be empty if parent sets 0)
        // 2. The numeric value actually changed
        if (
          (inputValue === "" && value !== 0) || 
          (!isNaN(currentNumeric) && currentNumeric !== value) ||
          (isNaN(currentNumeric) && inputValue !== "")
        ) {
          setInputValue(value.toString());
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;
      
      // If there's a prefix, strip it for internal state if user accidentally types it
      if (prefix && rawValue.startsWith(prefix)) {
        rawValue = rawValue.slice(prefix.length).trim();
      }

      setInputValue(rawValue);

      if (rawValue === "" || (allowNegative && rawValue === "-")) {
        onChange(undefined);
        return;
      }

      const parsed = parseFloat(rawValue);
      if (!isNaN(parsed)) {
        // Prevent negative values if not allowed
        if (!allowNegative && parsed < 0) return;
        onChange(parsed);
      }
    };

    return (
      <div className="relative w-full">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          type="text" 
          inputMode="decimal"
          {...props}
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          className={cn(
            "font-mono", 
            prefix && "pl-8",
            className
          )}
        />
      </div>
    );
  }
);

SmartNumberInput.displayName = "SmartNumberInput";
