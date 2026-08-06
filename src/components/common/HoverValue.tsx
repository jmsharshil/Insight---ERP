import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function formatKMB(num: number): string {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function parseAndFormatString(val: string): string {
  return val.replace(/[\d,]+(?:\.\d+)?/g, (match) => {
    const cleanNum = parseFloat(match.replace(/,/g, ''));
    if (!isNaN(cleanNum) && Math.abs(cleanNum) >= 1000) {
      return formatKMB(cleanNum);
    }
    return match;
  });
}

export default function HoverValue({ value }: { value: string | number }) {
  const originalStr = value?.toString() || "0";
  const formattedStr = typeof value === 'number' ? formatKMB(value) : parseAndFormatString(originalStr);

  if (originalStr === formattedStr) {
    return <span>{originalStr}</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer border-b-2 border-primary/30 hover:border-primary hover:text-primary transition-all duration-200 pb-[1px]">
            {formattedStr}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          sideOffset={6}
          className="bg-gray-dark text-white border border-white/10 shadow-xl shadow-black/20 px-4 py-2 text-sm font-bold tracking-wide rounded-lg animate-in fade-in zoom-in-95 duration-200"
        >
          {originalStr}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
