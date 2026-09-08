import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

interface BadFaceRecordsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    componyId: string | undefined;
    onSelectEmployee: (emp: any) => void;
}

export function BadFaceRecords({ open, onOpenChange, componyId, onSelectEmployee }: BadFaceRecordsProps) {
    const { toast } = useToast();
    const [loadingBadFaces, setLoadingBadFaces] = useState(false);
    const [badFaceRecords, setBadFaceRecords] = useState<any[]>([]);

    useEffect(() => {
        if (!open) return;
        setLoadingBadFaces(true);
        post("/admin/list-bad-face-records", { compony_code: componyId }).then((res) => {
            setBadFaceRecords(res.data?.employees || []);
        }).catch((error: any) => {
            console.error("Error checking bad face records:", error);
            toast({ title: "Failed to check bad face records", description: error?.response?.data?.message, variant: "destructive" });
            setBadFaceRecords([]);
        }).finally(() => {
            setLoadingBadFaces(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, componyId]);

    const handleOpenEmployee = (emp: any) => {
        onOpenChange(false);
        onSelectEmployee(emp);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b border-stone-100">
                    <DialogTitle>Bad Face Records</DialogTitle>
                    <p className="text-sm text-stone-500">
                        These employees' face data falsely matches many different people during scans — a sign their own encoding is broken or generic, not that they're duplicates of everyone shown here. Click one to view their profile and re-capture their photo, or force delete if needed.
                    </p>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar">
                    {loadingBadFaces ? (
                        <div className="text-center text-stone-400 py-16">
                            <div className="relative w-10 h-10 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-2 border-stone-100"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                            </div>
                            Scanning face data...
                        </div>
                    ) : badFaceRecords.length === 0 ? (
                        <div className="text-center text-stone-400 py-16">No bad face records found.</div>
                    ) : (
                        <div className="space-y-2">
                            {badFaceRecords.map((emp: any) => (
                                <button
                                    key={emp.employee_code}
                                    type="button"
                                    onClick={() => handleOpenEmployee(emp)}
                                    className="w-full flex items-center gap-4 p-3 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-left"
                                >
                                    <Avatar className="w-12 h-12 shrink-0">
                                        <AvatarImage
                                            src={emp.image ? `http://facekit.officekithr.net/facekit/uploads/${emp.image}` : undefined}
                                            className="object-cover"
                                        />
                                        <AvatarFallback>
                                            {emp.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-900 truncate">{emp.fullname}</div>
                                        <div className="text-xs text-stone-500">{emp.employee_code}</div>
                                    </div>
                                    <Badge className="bg-red-100 text-red-700 border-none text-[10px] uppercase tracking-wide shrink-0">
                                        Falsely matches {emp.match_count} people
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-stone-100">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
