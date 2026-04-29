import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminBusinessNew() {
  return (
    <>
      <PageHeader
        eyebrow="New mandate"
        title="Create a business"
        description="Set the headline, confidentiality mode and core financials. The full presentation editor arrives in the next stage."
        actions={
          <Link
            to="/admin/businesses"
            className="inline-flex items-center gap-2 rounded-sm border hairline px-5 py-3 text-[11px] tracking-eyebrow uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />
      <PlaceholderPanel
        title="Listing builder coming next"
        body="Name, location confidentiality (Blind / Suburb / Exact), asking price, EBITDA, tenure and hero image — staged for the next build."
      />
    </>
  );
}