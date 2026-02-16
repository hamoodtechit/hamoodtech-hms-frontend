import { useSettingsStore } from "@/store/use-settings-store";

export function useCurrency() {
    const { general } = useSettingsStore();

    const formatCurrency = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null) return "";
        
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return amount.toString();

        const formattedAmount = numAmount.toFixed(2);
        const symbol = general?.currencySymbol || "";
        const code = general?.currency || "";

        // Check if currency is Taka (Tk or BDT) to show after amount
        const isTaka = code.toUpperCase() === 'BDT' || symbol.toLowerCase().includes('tk');

        if (isTaka) {
            return `${formattedAmount} ${symbol}`;
        }
        
        return `${symbol}${formattedAmount}`;
    };

    return {
        formatCurrency,
        currencySymbol: general?.currencySymbol || "",
        currencyCode: general?.currency || ""
    };
}
