import { DiagnosticReport } from "@/types/diagnostic"

export interface GroupedTest {
    groupName: string;
    tests: any[];
}

/**
 * Groups diagnostic tests by their service test group name.
 * Fallback to "Other Tests" if no group is found.
 */
export function groupTestsByGroup(report: DiagnosticReport | null): GroupedTest[] {
    const tests = report?.diagnosticTests || report?.testItems || [];
    if (!report || tests.length === 0) return [];

    const grouped: Record<string, any[]> = {};

    tests.forEach((test) => {
        const groupName = test.service?.testGroup?.name || "Other Tests";
        if (!grouped[groupName]) {
            grouped[groupName] = [];
        }
        grouped[groupName].push(test);
    });

    return Object.entries(grouped).map(([groupName, tests]) => ({
        groupName,
        tests
    }));
}
