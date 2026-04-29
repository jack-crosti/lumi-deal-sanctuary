import { Lock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerDashboard() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        eyebrow="Private channel"
        title="Your assigned opportunities."
        description={`Signed in as ${user?.email}. Listings will appear here the moment your Lumi broker grants access.`}
      />

      <div className="relative lumi-card-elevated overflow-hidden animate-rise delay-200">
        <div className="absolute inset-0 bg-radiance opacity-50 pointer-events-none" />
        {/* corner ticks */}
        <span className="absolute top-4 left-4 size-3 border-t border-l border-primary/40" />
        <span className="absolute top-4 right-4 size-3 border-t border-r border-primary/40" />
        <span className="absolute bottom-4 left-4 size-3 border-b border-l border-primary/40" />
        <span className="absolute bottom-4 right-4 size-3 border-b border-r border-primary/40" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 p-10 md:p-16">
          <div className="lg:col-span-5">
            <Lock className="h-5 w-5 text-primary mb-8" strokeWidth={1.25} />
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
              Awaiting introduction
            </div>
            <h2 className="font-display text-3xl md:text-4xl tracking-display leading-[1.05] text-balance mb-6">
              No mandates have been shared with you — yet.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-[1.8]">
              When a broker assigns you to a business, its hero, key highlights and supporting documents
              will appear here in stages. Each new release is recorded against your account.
            </p>
            <div className="mt-10 flex items-center gap-4 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              You will be notified by email
            </div>
          </div>

          {/* placeholder mandate previews */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative aspect-[4/5] rounded-md border hairline bg-card-gradient overflow-hidden"
                style={{ opacity: 1 - i * 0.18 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 font-mono-brand text-[8px] tracking-eyebrow uppercase text-muted-foreground">
                  Mandate
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-2 w-2/3 rounded-full bg-foreground/10 mb-2" />
                  <div className="h-2 w-1/2 rounded-full bg-foreground/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
