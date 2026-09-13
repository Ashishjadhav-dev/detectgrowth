import { Bell, CircleHelp, LayoutGrid, Menu, Sparkles } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-white/88 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-[170px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Home Dashboard</div>
            <div className="mt-0.5 text-sm text-muted">Overview of live signals, tasks, and pipeline activity</div>
          </div>
          <div className="hidden max-w-[720px] flex-1 md:block">
            <SearchInput placeholder="Search companies, people, signals..." />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" className="hidden md:inline-flex" aria-label="Open command palette">
            <Sparkles className="size-4" />
          </Button>
          <Button variant="ghost" className="hidden md:inline-flex" aria-label="Switch workspace">
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant="ghost" aria-label="Notifications">
            <Bell className="size-4" />
            <span className="ml-1 inline-grid size-2 rounded-full bg-danger" />
          </Button>
          <Button variant="ghost" aria-label="Help">
            <CircleHelp className="size-4" />
          </Button>
          <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1 pr-3 shadow-[0_1px_1px_rgba(23,27,43,.02)]">
            <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#6f57ff] to-[#4f2bce] text-xs font-semibold text-white">
              AJ
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium leading-none text-ink">Ashish Jadhav</div>
              <div className="mt-1 text-[11px] text-muted">Morgan Growth Team</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
