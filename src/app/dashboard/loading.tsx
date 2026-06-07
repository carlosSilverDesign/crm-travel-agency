'use client'

/**
 * Loading Skeleton global para las transiciones entre páginas del dashboard.
 * Utiliza animaciones de pulso y diseño Glassmorphism a tono con el CRM.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 1. Header Area Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-96 bg-slate-800/60 rounded-lg" />
      </div>

      {/* 2. Metrics Cards Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 h-[72px]"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-slate-800/80 rounded" />
              <div className="h-5 w-12 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Split Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section (e.g., Table or Kanban columns) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="h-5 w-36 bg-slate-800 rounded-md" />
            <div className="h-4 w-12 bg-slate-800/60 rounded-md" />
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-850 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-800/40 rounded" />
                  <div className="h-3 w-2/3 bg-slate-800/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section (e.g., Sidebar Detail or Timeline) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-slate-800/80 pb-3">
            <div className="h-5 w-40 bg-slate-800 rounded-md" />
          </div>

          <div className="relative border-l border-slate-800/80 pl-4 ml-2.5 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="relative space-y-2">
                <div className="absolute -left-[22.5px] top-0.5 h-4 w-4 rounded-full bg-slate-800 border border-slate-700" />
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-850 rounded" />
                </div>
                <div className="h-3 w-48 bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
