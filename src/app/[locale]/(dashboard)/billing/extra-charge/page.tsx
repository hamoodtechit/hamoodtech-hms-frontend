import { Metadata } from "next"
import { ExtraChargeBillingForm } from "@/components/billing/extra-charge-billing-form"

export const metadata: Metadata = {
  title: "Extra Charge Billing | HMS",
  description: "Record and collect payments for miscellaneous patient charges.",
}

export default function ExtraChargeBillingPage() {
  return <ExtraChargeBillingForm />
}
