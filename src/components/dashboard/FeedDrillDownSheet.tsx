import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { FeedItem, Severity } from "@shared/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AssetCard } from "./AssetCard";
const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/50",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  Low: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  Info: "bg-sky-500/20 text-sky-300 border-sky-500/50",
};
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-800">
    <dt className="text-sm font-medium text-slate-400">{label}</dt>
    <dd className="col-span-2 text-sm text-slate-200">{value}</dd>
  </div>
);
export function FeedDrillDownSheet({ open, onOpenChange, item }: { open: boolean; onOpenChange: (open: boolean) => void; item: FeedItem | null }) {
  if (!item) return null;
  const isAiEnhanced = item.summary && item.location?.endsWith('.pdf');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-slate-950/80 backdrop-blur-lg border-slate-700 text-slate-200">
        <SheetHeader>
          <SheetTitle className="text-amber-400 flex items-center gap-3">
            <Badge variant="outline" className={cn("text-sm", SEVERITY_STYLES[item.severity])}>{item.severity}</Badge>
            <span>{item.title}</span>
            {item.summary && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 ml-2">AI-ENHANCED</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-slate-400 pt-1">
            {item.location}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className={cn("grid w-full bg-slate-900", isAiEnhanced ? "grid-cols-3" : "grid-cols-2")}>
              <TabsTrigger value="details">Details</TabsTrigger>
              {isAiEnhanced && <TabsTrigger value="ai">AI Summary</TabsTrigger>}
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <dl>
                <DetailRow label="Event ID" value={<span className="font-mono text-xs">{item.id}</span>} />
                <DetailRow label="Timestamp" value={format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")} />
                <DetailRow label="Type" value={<Badge variant="secondary">{item.type}</Badge>} />
                <DetailRow label="Coordinates" value={`${item.coords.lat.toFixed(4)}, ${item.coords.lon.toFixed(4)}`} />
              </dl>
            </TabsContent>
            {isAiEnhanced && (
              <TabsContent value="ai" className="mt-4">
                <AssetCard item={item} />
              </TabsContent>
            )}
            <TabsContent value="raw" className="mt-4">
              <pre className="bg-slate-900 p-4 rounded-md text-xs overflow-x-auto text-emerald-300">
                <code>{JSON.stringify(item, null, 2)}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}