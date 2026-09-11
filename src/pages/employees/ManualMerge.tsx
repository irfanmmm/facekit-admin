import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

interface ManualMergeProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    componyId: string | undefined;
    onMerged: () => void;
}

type Slot = "a" | "b";

/** Debounced employee-code/name search box for one merge slot. Reuses the
 * same search endpoint the main employee table already uses, so results and
 * matching behavior (regex on employee_code or fullname) are identical. */
function EmployeeSearchBox({
    label,
    componyId,
    selected,
    onSelect,
}: {
    label: string;
    componyId: string | undefined;
    selected: any | null;
    onSelect: (emp: any | null) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selected || !query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const timer = setTimeout(() => {
            post("/admin/fech-client-details-search", {
                compony_code: componyId,
                employee_code: query,
                limit: 8,
                offset: 0,
            }).then((res) => {
                setResults(res.data?.client_details?.data || []);
            }).catch(() => {
                setResults([]);
            }).finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, componyId, selected]);

    if (selected) {
        return (
            <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3 flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback>
                        {selected.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-900 truncate">{selected.fullname}</div>
                    <div className="text-xs text-stone-500">{selected.employee_code}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onSelect(null)}>Change</Button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="text-xs font-medium text-stone-500">{label}</div>
            <Input
                placeholder="Type an employee code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9"
            />
            {loading && <div className="text-xs text-stone-400 px-1">Searching...</div>}
            {results.length > 0 && (
                <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 max-h-40 overflow-y-auto">
                    {results.map((emp) => (
                        <button
                            key={emp.employee_code}
                            type="button"
                            onClick={() => { onSelect(emp); setQuery(""); }}
                            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between gap-2"
                        >
                            <span className="text-sm text-stone-900 truncate">{emp.fullname}</span>
                            <span className="text-xs text-stone-500 shrink-0">{emp.employee_code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ManualMerge({ open, onOpenChange, componyId, onMerged }: ManualMergeProps) {
    const { toast } = useToast();
    const [empA, setEmpA] = useState<any | null>(null);
    const [empB, setEmpB] = useState<any | null>(null);
    const [keep, setKeep] = useState<Slot | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    const reset = () => {
        setEmpA(null);
        setEmpB(null);
        setKeep(null);
        setConfirming(false);
    };

    const handleClose = (o: boolean) => {
        if (!isMerging) {
            if (!o) reset();
            onOpenChange(o);
        }
    };

    const primary = keep === "a" ? empA : empB;
    const duplicate = keep === "a" ? empB : empA;

    const handleConfirmMerge = async () => {
        if (!primary || !duplicate) return;
        setIsMerging(true);
        try {
            const res = await post("/admin/merge-duplicate-employees", {
                compony_code: componyId,
                primary_employee_code: primary.employee_code,
                duplicate_employee_code: duplicate.employee_code,
            });
            if (res.data?.message === "success") {
                toast({ title: "Merged successfully", description: "Attendance history was transferred and the duplicate was removed." });
                reset();
                onOpenChange(false);
                onMerged();
            } else {
                toast({ title: "Merge failed", description: res.data?.message, variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Error merging employees:", error);
            toast({ title: "Merge failed", description: error?.response?.data?.message, variant: "destructive" });
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Merge Two Employees</DialogTitle>
                        <p className="text-sm text-stone-500">
                            Look up any two employee codes, pick which one to keep, then merge. Attendance history is
                            transferred to the kept employee before the other is permanently removed from this system
                            and OfficeKit.
                        </p>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <EmployeeSearchBox label="Employee 1" componyId={componyId} selected={empA} onSelect={(e) => { setEmpA(e); setKeep(null); }} />
                        <EmployeeSearchBox label="Employee 2" componyId={componyId} selected={empB} onSelect={(e) => { setEmpB(e); setKeep(null); }} />

                        {empA && empB && (
                            <div>
                                <div className="text-xs font-medium text-stone-500 mb-1.5">Which one do you want to keep?</div>
                                <div className="grid grid-cols-2 gap-3">
                                    {([["a", empA], ["b", empB]] as [Slot, any][]).map(([slot, emp]) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setKeep(slot)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                                keep === slot ? "border-green-500 bg-green-50" : "border-stone-200 hover:border-stone-300"
                                            )}
                                        >
                                            <Avatar className="w-12 h-12">
                                                <AvatarFallback>
                                                    {emp.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm font-medium text-stone-900 text-center">{emp.fullname}</div>
                                            <div className="text-xs text-stone-500">{emp.employee_code}</div>
                                            {keep === slot && <Badge className="bg-green-600 text-white border-none text-[10px]">Keep this one</Badge>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => handleClose(false)}>Cancel</Button>
                        <Button variant="destructive" disabled={!keep} onClick={() => setConfirming(true)}>
                            Merge (delete the other)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Merge Confirmation ── */}
            <Dialog open={confirming} onOpenChange={(o) => { if (!isMerging && !o) setConfirming(false); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Merge</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-stone-600 space-y-2 py-2">
                        <p>
                            <span className="font-semibold">{duplicate?.fullname}</span> ({duplicate?.employee_code}) will be merged into <span className="font-semibold">{primary?.fullname}</span> ({primary?.employee_code}).
                        </p>
                        <p>
                            Their attendance history will be transferred, and <span className="font-semibold text-red-600">{duplicate?.fullname}'s record will be permanently deleted</span> from both this system and OfficeKit. This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isMerging}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmMerge} disabled={isMerging}>
                            {isMerging ? "Merging..." : "Yes, Merge"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
