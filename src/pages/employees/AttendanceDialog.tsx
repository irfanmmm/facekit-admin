import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, ArrowDownLeft, ArrowUpRight, ClipboardList, Download, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { get } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

interface AttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
    componyId: string | undefined;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    downloadingDetails: boolean;
    downloadProgress: number;
    onDownloadDetails: (employeeCode?: string) => void;
}

export function AttendanceDialog({
    open,
    onOpenChange,
    employee,
    componyId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    downloadingDetails,
    downloadProgress,
    onDownloadDetails,
}: AttendanceDialogProps) {
    const { toast } = useToast();

    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [selectedLog, setSelectedLog] = useState<{ recordIdx: number; logIdx: number } | null>(null);

    const fetchAttendance = (employeeCode: string, start?: string, end?: string) => {
        setLoadingAttendance(true);
        setSelectedLog(null); // reset any expanded face when re-fetching
        const sDate = start || startDate;
        const eDate = end || endDate;
        const url = `/admin/attendance-list?compony_code=${componyId}&employee_code=${employeeCode}&starting_date=${sDate}&ending_date=${eDate}`;
        get(url).then((res) => {
            if (res.data.message === "success" && res.data.data && res.data.data.length > 0) {
                setAttendanceData(res.data.data[0]);
            } else {
                setAttendanceData(null);
                toast({ title: "No attendance records found", variant: "destructive" });
            }
        }).catch((err) => {
            console.error("Error fetching attendance:", err);
            toast({ title: "Failed to fetch attendance", variant: "destructive" });
        }).finally(() => {
            setLoadingAttendance(false);
        });
    };

    // Opening for an employee loads attendance for whatever date range is
    // currently selected (e.g. the date filtered on the employee list).
    useEffect(() => {
        if (open && employee) {
            fetchAttendance(employee.employee_code, startDate, endDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, employee?.employee_code]);

    const formatDuration = (seconds: number) => {
        if (!seconds) return "0h 0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatLogTime = (timeStr: string, opts?: Intl.DateTimeFormatOptions) => {
        const d = new Date(timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T') + 'Z');
        return d.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            ...opts,
        });
    };

    const isLogSelected = (rIdx: number, lIdx: number) =>
        selectedLog?.recordIdx === rIdx && selectedLog?.logIdx === lIdx;

    const toggleLog = (rIdx: number, lIdx: number) => {
        setSelectedLog(isLogSelected(rIdx, lIdx) ? null : { recordIdx: rIdx, logIdx: lIdx });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelectedLog(null); }}>
            <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-stone-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Attendance Records</DialogTitle>
                            <p className="text-sm text-stone-500">
                                {employee?.fullname} ({employee?.employee_code})
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 py-4 border-y border-stone-100">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Start Date</label>
                            <Input type="date" className="h-9 w-40 bg-stone-50" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">End Date</label>
                            <Input type="date" className="h-9 w-40 bg-stone-50" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <Button
                            className="mt-auto h-9 px-6 bg-stone-900 hover:bg-stone-800 transition-colors"
                            onClick={() => fetchAttendance(employee.employee_code)}
                            disabled={loadingAttendance}
                        >
                            {loadingAttendance ? "Loading..." : "Filter"}
                        </Button>
                        <Button
                            variant="outline"
                            className="mt-auto h-9 px-6 flex items-center gap-2 relative overflow-hidden"
                            onClick={() => onDownloadDetails(employee.employee_code)}
                            disabled={downloadingDetails}
                        >
                            <Download className="h-4 w-4" />
                            {downloadingDetails ? `Downloading... ${downloadProgress}%` : "Download Details PDF"}
                            {downloadingDetails && (
                                <Progress value={downloadProgress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none opacity-50" />
                            )}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 custom-scrollbar">
                    {attendanceData ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-green-50/50 border-green-100 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Badge className="bg-green-600 text-white border-none px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">P</Badge>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-green-700 leading-none mb-1">
                                                {attendanceData.attendance_records?.filter((r: any) => r.present === 'P').length}
                                            </div>
                                            <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Days Present</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-blue-50/50 border-blue-100 shadow-none">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-700 leading-none mb-1">
                                                {formatDuration(attendanceData.attendance_records?.reduce((acc: number, r: any) => acc + (r.total_working_time || 0), 0))}
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Hours</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Records List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    Daily Breakdown
                                </h4>
                                <div className="space-y-3 pb-4">
                                    {attendanceData.attendance_records?.map((record: any, rIdx: number) => (
                                        <div key={rIdx} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            {/* Day header */}
                                            <div className="flex items-center justify-between p-4 bg-stone-50/50 border-b border-stone-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-bold text-stone-900">
                                                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                                                    </div>
                                                    <Badge className={cn(
                                                        "h-6 px-2 text-[10px] font-bold uppercase tracking-wider border-none",
                                                        record.present === 'P' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                                                    )}>
                                                        {record.present === 'P' ? 'Present' : 'Absent'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-stone-600 text-xs font-bold">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDuration(record.total_working_time)}
                                                </div>
                                            </div>

                                            {/* Activity timeline */}
                                            {record.logs && record.logs.length > 0 && (
                                                <div className="px-4 pb-4">
                                                    <div className="pt-3">
                                                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                            <User className="h-3 w-3" />
                                                            Activity Timeline · tap a punch to view face
                                                        </div>

                                                        <div className="relative pl-6 space-y-2 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
                                                            {record.logs.map((log: any, lIdx: number) => {
                                                                const expanded = isLogSelected(rIdx, lIdx);
                                                                const faceUrl = log.image
                                                                    ? `http://facekit.officekithr.net/facekit/uploads/${log.image}`
                                                                    : null;

                                                                return (
                                                                    <div key={lIdx} className="relative">
                                                                        {/* Timeline dot */}
                                                                        <div className={cn(
                                                                            "absolute -left-[20px] w-3 h-3 rounded-full border-2 border-white z-10 shadow-sm top-3.5",
                                                                            log.direction === 'in' ? "bg-green-500" : "bg-orange-500"
                                                                        )} />

                                                                        {/* Clickable log row */}
                                                                        <button
                                                                            type="button"
                                                                            className={cn(
                                                                                "w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-150",
                                                                                expanded
                                                                                    ? "bg-stone-100 border-stone-300 shadow-inner"
                                                                                    : "bg-stone-50 border-stone-100 hover:bg-stone-100 hover:border-stone-200"
                                                                            )}
                                                                            onClick={() => toggleLog(rIdx, lIdx)}
                                                                        >
                                                                            {/* Face thumbnail avatar */}
                                                                            <Avatar className={cn(
                                                                                "h-10 w-10 shrink-0 ring-2 shadow-sm transition-all",
                                                                                log.direction === 'in'
                                                                                    ? "ring-green-200"
                                                                                    : "ring-orange-200"
                                                                            )}>
                                                                                <AvatarImage
                                                                                    src={faceUrl ?? undefined}
                                                                                    className="object-cover"
                                                                                    alt="Punch face"
                                                                                />
                                                                                <AvatarFallback className={cn(
                                                                                    "text-[10px] font-bold",
                                                                                    log.direction === 'in'
                                                                                        ? "bg-green-100 text-green-700"
                                                                                        : "bg-orange-100 text-orange-700"
                                                                                )}>
                                                                                    {log.direction === 'in' ? 'IN' : 'OUT'}
                                                                                </AvatarFallback>
                                                                            </Avatar>

                                                                            {/* Direction icon + times */}
                                                                            <div className="flex-1 flex items-center justify-between min-w-0">
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <div className={cn(
                                                                                        "p-1.5 rounded-md shrink-0",
                                                                                        log.direction === 'in'
                                                                                            ? "bg-green-100 text-green-600"
                                                                                            : "bg-orange-100 text-orange-600"
                                                                                    )}>
                                                                                        {log.direction === 'in'
                                                                                            ? <ArrowDownLeft className="h-3.5 w-3.5" />
                                                                                            : <ArrowUpRight className="h-3.5 w-3.5" />
                                                                                        }
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-[10px] font-bold text-stone-400 uppercase leading-none mb-0.5">
                                                                                            {log.direction === 'in' ? 'Check-In' : 'Check-Out'}
                                                                                        </div>
                                                                                        <div className="text-sm font-bold text-stone-800">
                                                                                            {formatLogTime(log.time)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 shrink-0">
                                                                                    <div className="text-[10px] text-stone-400 font-medium hidden sm:block">
                                                                                        {formatLogTime(log.time, { second: '2-digit' })}
                                                                                    </div>
                                                                                    <ChevronDown className={cn(
                                                                                        "h-4 w-4 text-stone-400 transition-transform duration-200",
                                                                                        expanded && "rotate-180"
                                                                                    )} />
                                                                                </div>
                                                                            </div>
                                                                        </button>

                                                                        {/* Expanded face image */}
                                                                        {expanded && (
                                                                            <div className="mt-2 mb-1 rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
                                                                                {faceUrl ? (
                                                                                    <div className="relative">
                                                                                        <img
                                                                                            src={faceUrl}
                                                                                            alt={`${log.direction === 'in' ? 'Check-in' : 'Check-out'} face capture`}
                                                                                            className="w-full object-cover max-h-72"
                                                                                        />
                                                                                        {/* overlay label */}
                                                                                        <div className={cn(
                                                                                            "absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow",
                                                                                            log.direction === 'in' ? "bg-green-600/90" : "bg-orange-500/90"
                                                                                        )}>
                                                                                            {log.direction === 'in'
                                                                                                ? <ArrowDownLeft className="h-3 w-3" />
                                                                                                : <ArrowUpRight className="h-3 w-3" />
                                                                                            }
                                                                                            {log.direction === 'in' ? 'Check-In' : 'Check-Out'} · {formatLogTime(log.time)}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="h-32 flex flex-col items-center justify-center gap-2 text-stone-400">
                                                                                        <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
                                                                                            <User className="h-6 w-6 text-stone-400" />
                                                                                        </div>
                                                                                        <p className="text-xs font-medium">No face capture for this punch</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 py-20">
                            {loadingAttendance ? (
                                <>
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-stone-900 border-t-transparent animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-medium animate-pulse">Syncing attendance data...</p>
                                </>
                            ) : (
                                <>
                                    <ClipboardList className="h-12 w-12 text-stone-200" />
                                    <p className="text-sm font-medium italic">No data selected. Click Filter to load records.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-stone-100">
                    <Button variant="secondary" className="w-full" onClick={() => { onOpenChange(false); setSelectedLog(null); }}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
