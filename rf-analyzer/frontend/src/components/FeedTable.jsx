import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Table is imported per spec; we render <table> directly so that sticky
// thead works inside ScrollArea (Table's overflow-auto wrapper breaks sticky).
void Table

const ROW_CLASS = {
  friendly: "hover:bg-cyan-950/20 border-b border-border/30",
  unknown:  "hover:bg-amber-950/20 border-b border-border/30",
  hostile:  "hover:bg-red-950/25  border-b border-border/30",
}

const BADGE_CLASS = {
  friendly: "bg-cyan-950/60  border border-cyan-500/30  text-cyan-400  glow-cyan",
  unknown:  "bg-amber-950/60 border border-amber-500/30 text-amber-400 glow-amber",
  hostile:  "bg-red-950/60   border border-red-500/30   text-red-400   glow-red",
}

const BADGE_LABEL = {
  friendly: "FRIENDLY",
  unknown:  "UNKNOWN",
  hostile:  "HOSTILE",
}

const HEAD_CLASS =
  "px-3 py-2 text-[9px] font-medium uppercase tracking-[0.10em] text-muted-foreground h-auto"

function ThreatCell({ score }) {
  const barColor =
    score >= 70 ? "[&>div]:bg-red-500"   :
    score >= 40 ? "[&>div]:bg-amber-400" :
                  "[&>div]:bg-green-500"
  return (
    <div className="flex flex-col gap-1 min-w-[72px]">
      <span className="tabular-nums text-[10px] text-right text-gray-300 leading-none">
        {score}
      </span>
      <Progress value={score} className={cn("h-1.5 bg-gray-700/60", barColor)} />
    </div>
  )
}

const SKEL_WIDTHS = [55, 70, 50, 45, 60, 55, 80]

function SkeletonRow() {
  return (
    <TableRow className="border-b border-border/20 hover:bg-transparent">
      {SKEL_WIDTHS.map((w, i) => (
        <TableCell key={i} className="px-3 py-2">
          <div
            className="h-3 rounded bg-gray-800/60 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </TableCell>
      ))}
    </TableRow>
  )
}

export default function FeedTable({ signals }) {
  const rows    = signals.slice(0, 15)
  const loading = rows.length === 0

  return (
    <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-green-500/10 shrink-0">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide">Signal Feed</h2>
      </div>

      <ScrollArea className="flex-1">
        {/* Raw <table> keeps sticky thead working inside the ScrollArea viewport */}
        <table className="w-full caption-bottom text-xs">
          <TableHeader
            className="sticky top-0 z-10 border-b border-border"
            style={{ background: "hsl(var(--muted))" }}
          >
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className={cn(HEAD_CLASS, "text-left")}>Time</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>Freq (MHz)</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right hidden md:table-cell")}>Power (dBm)</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-center")}>Mod</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-center")}>Label</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>Conf</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-left min-w-[80px]")}>Threat</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.map((s, idx) => {
                  const rowClass = cn(
                    ROW_CLASS[s.label] ?? "border-b border-border/30",
                    idx === 0 ? "animate-[fadeIn_0.25s_ease-in]" : ""
                  )

                  const cells = (
                    <>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 font-mono text-gray-400 whitespace-nowrap">
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 text-right font-mono text-gray-200">
                        {s.frequency_mhz.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 text-right font-mono text-gray-200 hidden md:table-cell">
                        {s.power_dbm.toFixed(1)}
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 text-center font-mono text-gray-300">
                        {s.modulation}
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full text-[10px] font-semibold px-2 py-0.5",
                            BADGE_CLASS[s.label]
                          )}
                        >
                          {BADGE_LABEL[s.label]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5 text-right font-mono text-gray-300">
                        {(s.confidence * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="px-3 py-2 min-h-[44px] lg:min-h-[28px] lg:py-1.5">
                        <ThreatCell score={s.threat_score} />
                      </TableCell>
                    </>
                  )

                  if (s.label === "hostile") {
                    return (
                      <TooltipProvider key={s.id} delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TableRow className={rowClass}>{cells}</TableRow>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="max-w-xs p-3 bg-gray-950 border-red-500/30 text-gray-200"
                          >
                            <pre className="font-mono text-[10px] whitespace-pre-wrap break-all">
                              {JSON.stringify(s, null, 2)}
                            </pre>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return (
                    <TableRow key={s.id} className={rowClass}>{cells}</TableRow>
                  )
                })
            }
          </TableBody>
        </table>
      </ScrollArea>
    </div>
  )
}
