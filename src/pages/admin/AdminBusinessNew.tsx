import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BusinessForm } from "@/components/admin/BusinessForm";
import CreateFromIMDialog from "@/components/admin/CreateFromIMDialog";

export default function AdminBusinessNew() {
  const [showImport, setShowImport] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="New Information Memorandum"
        title="Create a business"
        description="Capture the identity, confidentiality, financials and lease terms. You can refine each section after creation."
        actions={
          <Link to="/admin/businesses" className="lumi-btn-ghost">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />

      <div className="lumi-card p-6 md:p-7 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-primary/20 bg-primary/[0.03]">
        <div>
          <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-1.5">
            Faster start
          </p>
          <p className="text-sm leading-relaxed">
            Already have an Information Memorandum PDF? Upload it and we'll create
            the listing and draft a cinematic presentation for you to review.
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="lumi-btn-primary whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Import from IM PDF
        </button>
      </div>

      <BusinessForm />
      <CreateFromIMDialog open={showImport} onOpenChange={setShowImport} />
    </>
  );
}