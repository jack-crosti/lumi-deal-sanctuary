import { PageHeader } from "@/components/AppShell";
import ActivityFeed from "@/components/admin/ActivityFeed";
import HotBuyers from "@/components/admin/HotBuyers";

export default function AdminActivity() {
  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description="Every login, view, document open and download — across every buyer and every Information Memorandum."
      />

      <section className="mb-16 animate-rise">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Hot buyers</h2>
          <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            Ranked by intent
          </span>
        </div>
        <HotBuyers />
      </section>

      <section className="animate-rise">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Event feed</h2>
        </div>
        <ActivityFeed limit={500} showFilters />
      </section>
    </>
  );
}