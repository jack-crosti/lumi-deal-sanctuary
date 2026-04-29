import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BuyerForm } from "@/components/admin/BuyerForm";

export default function AdminBuyerNew() {
  return (
    <>
      <PageHeader
        eyebrow="New buyer"
        title="Add a buyer"
        description="Create a buyer profile. They will be linked to their account automatically the first time they sign up with this email."
        actions={
          <Link to="/admin/buyers" className="lumi-btn-ghost">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        }
      />
      <BuyerForm />
    </>
  );
}