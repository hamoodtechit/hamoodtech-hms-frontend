import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface SmartNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  allowNegative?: boolean;
}

export const SmartNumberInput = React.forwardRef<HTMLInputElement, SmartNumberInputProps>(
  ({ value, onChange, className, allowNegative = false, ...props }, ref) => {
    // Local string state to handle intermediate inputs (like "-", "", "0.")
    const [inputValue, setInputValue] = useState<string>("");

    // Sync local state with prop value when prop value changes externally
    useEffect(() => {
      if (value === undefined || value === null) {
        setInputValue("");
      } else {
         // Only update if the parsed value is different to avoid cursor jumping or formatting issues during typing.
         // But here we just convert to string. If user types "0.50", parsing it gives 0.5. 
         // If we set it back to "0.5", user loses the trailing zero.
         // Ideally we only sync if the numeric value is different.
         const currentNumeric = parseFloat(inputValue);
         if (isNaN(currentNumeric) || currentNumeric !== value) {
             setInputValue(value.toString());
         }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInputValue(rawValue);

      if (rawValue === "" || rawValue === "-") {
        onChange(undefined);
        return;
      }

      const parsed = parseFloat(rawValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        // invalid input (e.g. multiple dots), don't trigger onChange? or trigger undefined?
        // if we trigger undefined, the parent might reset it.
      }
    };

    return (
      <Input
        type="text" 
        inputMode="decimal"
        {...props}
        ref={ref}
        value={inputValue}
        onChange={handleChange}
        className={cn("font-mono", className)}
      />
    );
  }
);

SmartNumberInput.displayName = "SmartNumberInput";
