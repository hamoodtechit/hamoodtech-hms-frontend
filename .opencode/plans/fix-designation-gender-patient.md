# Plan: Fix Designation Bold, Sex Display, and Patient Data in Receipts

## Issue 1: Make Doctor Designation Bold in All Receipts (4 files)

### 1a. `src/components/billing/diagnostic-receipt-dialog.tsx` line 213

OLD: `<span className="text-[10px] font-medium italic">`
NEW: `<span className="text-[10px] font-bold">`execute the plan

### 1b. `src/components/appointments/appointment-receipt-dialog.tsx` line 208

OLD: `<span className="text-[10px] font-medium italic">`
NEW: `<span className="text-[10px] font-bold">`

### 1c. `src/components/patients/admission-print-dialog.tsx` line 336

OLD: `{admission?.doctor?.fullName || 'N/A'} {admission?.doctor?.designation ? \`(${admission.doctor.designation})\` : ''}`
NEW: `{admission?.doctor?.fullName || 'N/A'} {admission?.doctor?.designation ? <span className="font-bold lowercase">(${admission.doctor.designation})</span> : ''}`

### 1d. `src/components/patients/discharge-receipt-dialog.tsx` line 294

OLD: `<span className="font-bold text-sm">{admission?.doctor?.fullName || 'N/A'}</span>`
NEW: `<span className="font-bold text-sm">{admission?.doctor?.fullName || 'N/A'}{admission?.doctor?.designation ? <span className="font-bold lowercase"> ({admission.doctor.designation})</span> : ''}</span>`

---

## Issue 2: Fix Sex/Gender Display (3 files)

### 2a. `src/components/patients/hospital-receipt-dialog.tsx` line 150

OLD: `<span>Sex : {patient?.gender || 'N/A'}</span>`
NEW: `<span>Sex : {patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'N/A'}</span>`

### 2b. `src/components/billing/diagnostic-receipt-dialog.tsx` line 79

OLD: `const patientSex = patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : (data?.customerGender || data?.patientGender || data?.gender || "N/A")`
NEW: `const patientSex = patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : (data?.gender || "N/A")`

### 2c. `src/components/appointments/appointment-receipt-dialog.tsx` line 79

OLD: `const patientSex = patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : (data?.customerGender || data?.patientGender || data?.gender || "N/A")`
NEW: `const patientSex = patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : (data?.gender || "N/A")`

---

## Issue 3: Fetch Fresh Patient Data in Admission Print (1 file)

### 3a. `src/components/patients/admission-print-dialog.tsx`

**Step 1**: Check if `usePatient` hook exists. If yes, add import and hook. If not, use `useQuery` with `patientService.getPatient`.
**Step 2**: After the `useAdmission` hook, fetch fresh patient data.
**Step 3**: Use fresh patient data for display, fall back to `admission.patient` on error/missing.

Pseudo-code:

```tsx
import { usePatient } from "@/hooks/patient-queries";

// After useAdmission hook
const { data: patientRes } = usePatient(admission?.patientId || "");
const freshPatient = patientRes?.data || admission?.patient;

// Then in JSX, replace all `patient` references with `freshPatient`:
// - patient?.name → freshPatient?.name
// - patient?.age → freshPatient?.age
// - patient?.gender → freshPatient?.gender
// - etc.
```

---

## Summary: 8 files, 7 simple edits + 1 medium change

| #   | File                           | Change                           |
| --- | ------------------------------ | -------------------------------- |
| 1   | diagnostic-receipt-dialog.tsx  | bold designation                 |
| 2   | appointment-receipt-dialog.tsx | bold designation                 |
| 3   | admission-print-dialog.tsx     | bold designation + fresh patient |
| 4   | discharge-receipt-dialog.tsx   | add designation bold             |
| 5   | hospital-receipt-dialog.tsx    | capitalize gender                |
| 6   | diagnostic-receipt-dialog.tsx  | remove customerGender fallback   |
| 7   | appointment-receipt-dialog.tsx | remove customerGender fallback   |
| -   | admission-print-dialog.tsx     | usePatient for fresh data        |
