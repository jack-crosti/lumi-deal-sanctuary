import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BusinessForm } from "@/components/admin/BusinessForm";

export default function AdminBusinessNew() {
  return (
    <>
      <PageHeader
        eyebrow="New mandate"
        title="Create a business"
        description="Capture the identity, confidentiality, financials and lease terms. You can refine each section after creation."
        actions={
          <Link to="/admin/businesses" className="lumi-btn-ghost">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />
      <BusinessForm />
    </>
  );
}