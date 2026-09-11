import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { employeePhotoUrl } from "@/lib/employeePhoto";

interface DuplicatesReviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    componyId: string | undefined;
    onMerged: () => void;
}

export function DuplicatesReview({ open, onOpenChange, componyId, onMerged }: DuplicatesReviewProps) {
    const { toast } = useToast();
    const [loadingDuplicates, setLoadingDuplicates] = useState(false);
    const [duplicatePairs, setDuplicatePairs] = useState<any[]>([]);
    const [primarySelections, setPrimarySelections] = useState<Record<number, string>>({});
    const [pendingMergePair, setPendingMergePair] = useState<{ pairIndex: number; primary: string; duplicate: string; primaryName: string; duplicateName: string } | null>(null);
    const [isMerging, setIsMerging] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingDuplicates(true);
        post("/admin/list-duplicate-faces", { compony_code: componyId }).then((res) => {
            setDuplicatePairs(res.data?.pairs || []);
            setPrimarySelections({});
        }).catch((error: any) => {
            console.error("Error checking duplicates:", error);
            toast({ title: "Failed to check duplicates", description: error?.response?.data?.message, variant: "destructive" });
            setDuplicatePairs([]);
        }).finally(() => {
            setLoadingDuplicates(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, componyId]);

    const handleConfirmMerge = async () => {
        if (!pendingMergePair) return;
        setIsMerging(true);
        try {
            const res = await post("/admin/merge-duplicate-employees", {
                compony_code: componyId,
                primary_employee_code: pendingMergePair.primary,
                duplicate_employee_code: pendingMergePair.duplicate,
            });
            if (res.data?.message === "success") {
                toast({ title: "Merged successfully", description: "Attendance history was transferred and the duplicate was removed." });
                setDuplicatePairs(prev => prev.filter((_, idx) => idx !== pendingMergePair.pairIndex));
                setPendingMergePair(null);
                onMerged();
            } else {
                toast({ title: "Merge failed", description: res.data?.message, variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Error merging duplicates:", error);
            toast({ title: "Merge failed", description: error?.response?.data?.message, variant: "destructive" });
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <>
            {/* ── Duplicate Faces Review ── */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-4 border-b border-stone-100">
                        <DialogTitle>Suspected Duplicate Faces</DialogTitle>
                        <p className="text-sm text-stone-500">
                            Pick which employee to keep in each pair, then merge. Attendance history is transferred to the kept employee before the other is permanently removed from this system and OfficeKit.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {loadingDuplicates ? (
                            <div className="text-center text-stone-400 py-16">
                                <div className="relative w-10 h-10 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-full border-2 border-stone-100"></div>
                                    <div className="absolute inset-0 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                                </div>
                                Scanning for duplicates...
                            </div>
                        ) : duplicatePairs.length === 0 ? (
                            <div className="text-center text-stone-400 py-16">No suspected duplicates found.</div>
                        ) : (
                            duplicatePairs.map((pair, idx) => {
                                const [empA, empB] = pair.employees;
                                const selected = primarySelections[idx];
                                return (
                                    <Card key={`${empA.employee_code}-${empB.employee_code}`} className="border-stone-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <Badge variant="secondary" className="text-xs">Similarity distance: {pair.distance.toFixed(3)}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[empA, empB].map((emp: any) => (
                                                    <button
                                                        key={emp.employee_code}
                                                        type="button"
                                                        onClick={() => setPrimarySelections(prev => ({ ...prev, [idx]: emp.employee_code }))}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                                            selected === emp.employee_code ? "border-green-500 bg-green-50" : "border-stone-200 hover:border-stone-300"
                                                        )}
                                                    >
                                                        <Avatar className="w-14 h-14">
                                                            <AvatarImage
                                                                src={employeePhotoUrl(emp.image)}
                                                                className="object-cover"
                                                            />
                                                            <AvatarFallback>
                                                                {emp.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-sm font-medium text-stone-900 text-center">{emp.fullname}</div>
                                                        <div className="text-xs text-stone-500">{emp.employee_code}</div>
                                                        {selected === emp.employee_code && (
                                                            <Badge className="bg-green-600 text-white border-none text-[10px]">Keep this one</Badge>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={!selected}
                                                    onClick={() => {
                                                        const primaryEmp = selected === empA.employee_code ? empA : empB;
                                                        const duplicateEmp = selected === empA.employee_code ? empB : empA;
                                                        setPendingMergePair({
                                                            pairIndex: idx,
                                                            primary: primaryEmp.employee_code,
                                                            duplicate: duplicateEmp.employee_code,
                                                            primaryName: primaryEmp.fullname,
                                                            duplicateName: duplicateEmp.fullname,
                                                        });
                                                    }}
                                                >
                                                    Merge (delete the other)
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t border-stone-100">
                        <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Merge Confirmation ── */}
            <Dialog open={!!pendingMergePair} onOpenChange={(o) => { if (!isMerging && !o) setPendingMergePair(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Merge</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-stone-600 space-y-2 py-2">
                        <p>
                            <span className="font-semibold">{pendingMergePair?.duplicateName}</span> ({pendingMergePair?.duplicate}) will be merged into <span className="font-semibold">{pendingMergePair?.primaryName}</span> ({pendingMergePair?.primary}).
                        </p>
                        <p>
                            Their attendance history will be transferred, and <span className="font-semibold text-red-600">{pendingMergePair?.duplicateName}'s record will be permanently deleted</span> from both this system and OfficeKit. This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button variant="secondary" onClick={() => setPendingMergePair(null)} disabled={isMerging}>
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
