import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MoreVertical, Search, Calendar, ClipboardList, Download, Copy, ImageOff, ScanFace, Merge, Wrench } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { getFile } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { employeePhotoUrl } from "@/lib/employeePhoto";
import { EmployeeDetailsDialog } from "./EmployeeDetailsDialog";
import { AttendanceDialog } from "./AttendanceDialog";
import { DuplicatesReview } from "./DuplicatesReview";
import { ManualMerge } from "./ManualMerge";
import { BadFaceRecords } from "./BadFaceRecords";
import { FaceSearchDialog } from "./FaceSearchDialog";

export default function Employees() {
    const { toast } = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSuperAdmin, componyCode } = useAuth();

    // Client admins are locked to their own company's employee list.
    useEffect(() => {
        if (!isSuperAdmin && componyCode && id !== componyCode) {
            navigate(`/employees/${componyCode}`, { replace: true });
        }
    }, [isSuperAdmin, componyCode, id]);

    const {
        employees,
        totalEmployees,
        currentPage,
        setCurrentPage,
        startIndex,
        totalPages,
        emploeeCodeQury,
        setEmployeeCode,
        branchQuery,
        setBranchQuery,
        agencyQuery,
        setAgencyQuery,
        authorQuery,
        setAuthorQuery,
        filterDate,
        setFilterDate,
        refetch,
    } = useEmployees(id);

    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
    const [isManualMergeOpen, setIsManualMergeOpen] = useState(false);
    const [isBadFacesOpen, setIsBadFacesOpen] = useState(false);
    const [isFaceSearchOpen, setIsFaceSearchOpen] = useState(false);

    // Default dates: today only
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [downloadingDetails, setDownloadingDetails] = useState(false);
    const [downloadingAttendance, setDownloadingAttendance] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleDownloadDetails = async (employeeCode?: string) => {
        setDownloadingDetails(true);
        setDownloadProgress(0);
        try {
            let url = `/admin/download/employee_details?compony_code=${id}`;
            if (employeeCode) {
                url += `&employee_id=${employeeCode}`;
            }

            const res = await getFile(url, {
                onDownloadProgress: (progressEvent: any) => {
                    if (progressEvent.total) {
                        setDownloadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                }
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = employeeCode ? `employee_${employeeCode}_details.pdf` : `company_${id}_employees_details.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast({ title: "Download successful", description: "Your details PDF has been downloaded." });
        } catch (err) {
            console.error("Error downloading details:", err);
            toast({ title: "Download failed", description: "Failed to download the details PDF.", variant: "destructive" });
        } finally {
            setDownloadingDetails(false);
            setDownloadProgress(0);
        }
    };

    const handleDownloadAttendance = async () => {
        setDownloadingAttendance(true);
        setDownloadProgress(0);
        try {
            const attendanceDate = filterDate || today;
            const url = `/admin/download/attandance?compony_code=${id}&starting_date=${attendanceDate}&ending_date=${attendanceDate}`;

            const res = await getFile(url, {
                onDownloadProgress: (progressEvent: any) => {
                    if (progressEvent.total) {
                        setDownloadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                }
            });
            const blob = new Blob([res.data], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `company_${id}_attendance.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast({ title: "Download successful", description: "Your attendance CSV has been downloaded." });
        } catch (err) {
            console.error("Error downloading attendance:", err);
            toast({ title: "Download failed", description: "Failed to download the attendance CSV.", variant: "destructive" });
        } finally {
            setDownloadingAttendance(false);
            setDownloadProgress(0);
        }
    };

    const paginatedEmployees = employees;

    return (
        <div className="h-full overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-4">
                {/* Toolbar */}
                <Card className="border-stone-200">
                    <CardContent className="p-4 space-y-4">
                        {/* Row 1: scope + actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs font-medium">{id}</Badge>
                                <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100">
                                    <Calendar className="h-4 w-4 text-stone-500" />
                                    <input
                                        type="date"
                                        className="bg-transparent text-sm font-medium focus:outline-none text-stone-700 cursor-pointer"
                                        value={filterDate}
                                        onChange={(e) => {
                                            setFilterDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    {filterDate && (
                                        <button
                                            onClick={() => {
                                                setFilterDate("");
                                                setCurrentPage(1);
                                            }}
                                            className="text-stone-400 hover:text-stone-900 transition-colors"
                                            title="Clear filter"
                                        >
                                            <MoreVertical className="h-3 w-3 rotate-45" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="solid"
                                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                                    onClick={() => setIsFaceSearchOpen(true)}
                                    title="Search for an employee by uploading a photo"
                                >
                                    <ScanFace className="h-4 w-4" />
                                    Search by Photo
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <Download className="h-4 w-4" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem
                                            disabled={downloadingDetails}
                                            onClick={() => handleDownloadDetails()}
                                        >
                                            {downloadingDetails ? `Downloading... ${downloadProgress}%` : "Employee Details (PDF)"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={downloadingAttendance}
                                            onClick={() => handleDownloadAttendance()}
                                        >
                                            {downloadingAttendance ? `Downloading... ${downloadProgress}%` : "Attendance (CSV)"}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {isSuperAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="solid" className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
                                                <Wrench className="h-4 w-4" />
                                                Tools
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Data cleanup</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setIsDuplicatesOpen(true)}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicates
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsBadFacesOpen(true)}>
                                                <ImageOff className="h-4 w-4 mr-2" />
                                                Bad Faces
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsManualMergeOpen(true)}>
                                                <Merge className="h-4 w-4 mr-2" />
                                                Merge Employees
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Row 2: filters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                <Input
                                    type="text"
                                    placeholder="Search name..."
                                    className="pl-8 h-9 text-sm"
                                    value={authorQuery}
                                    onChange={(e) => setAuthorQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                <Input
                                    type="text"
                                    placeholder="Search code..."
                                    className="pl-8 h-9 text-sm"
                                    value={emploeeCodeQury}
                                    onChange={(e) => { setEmployeeCode(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                <Input
                                    type="text"
                                    placeholder="Search branch..."
                                    className="pl-8 h-9 text-sm"
                                    value={branchQuery}
                                    onChange={(e) => setBranchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                <Input
                                    type="text"
                                    placeholder="Search agency..."
                                    className="pl-8 h-9 text-sm"
                                    value={agencyQuery}
                                    onChange={(e) => setAgencyQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee table */}
                <Card className="border-stone-200">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-stone-500">Employee</TableHead>
                                    <TableHead className="text-stone-500">Code</TableHead>
                                    <TableHead className="text-stone-500">Branch</TableHead>
                                    <TableHead className="text-stone-500">Agency</TableHead>
                                    <TableHead className="text-stone-500 text-right">Attendance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedEmployees.map((author: any, index) => (
                                    <TableRow
                                        key={index}
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setSelectedEmployee(author);
                                            setIsOpen(true);
                                        }}
                                    >
                                        <TableCell>
                                            <div className="flex items-center min-w-0">
                                                <Avatar className="w-9 h-9 shrink-0">
                                                    <AvatarImage
                                                        src={employeePhotoUrl(author.image)}
                                                        alt={author.fullname}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback>
                                                        {author.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-3 min-w-0">
                                                    <div className="text-sm text-stone-900 truncate" title={author?.fullname}>{author?.fullname}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-stone-900 truncate" title={author.employee_code}>{author.employee_code}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-stone-900 truncate">{author.branch ? `Branch ${author.branch}` : <span className="text-stone-400 italic">Not Assigned</span>}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-stone-900 truncate">{author.agency ? `Agency ${author.agency}` : <span className="text-stone-400 italic">Not Assigned</span>}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEmployee(author);
                                                    const attendanceDate = filterDate || today;
                                                    setStartDate(attendanceDate);
                                                    setEndDate(attendanceDate);
                                                    setIsAttendanceOpen(true);
                                                }}
                                            >
                                                <ClipboardList className="h-4 w-4" />
                                                View Logs
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {paginatedEmployees.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 sm:px-6 bg-white rounded-b-lg">
                                <div className="hidden sm:block text-sm text-stone-500">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{startIndex + paginatedEmployees.length}</span> of <span className="font-medium">{totalEmployees}</span> results
                                </div>
                                <div className="flex flex-1 justify-between sm:justify-end items-center space-x-4">
                                    <div className="text-sm text-stone-500 sm:hidden">Page {currentPage} of {totalPages}</div>
                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1}>
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} disabled={currentPage === totalPages || totalPages === 0}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AttendanceDialog
                open={isAttendanceOpen}
                onOpenChange={setIsAttendanceOpen}
                employee={selectedEmployee}
                componyId={id}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                downloadingDetails={downloadingDetails}
                downloadProgress={downloadProgress}
                onDownloadDetails={handleDownloadDetails}
            />

            <EmployeeDetailsDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                employee={selectedEmployee}
                employees={employees}
                componyId={id}
                onSaved={(updated) => {
                    setSelectedEmployee(updated);
                    refetch();
                }}
                onDeleted={() => {
                    setIsOpen(false);
                    refetch();
                }}
            />

            <DuplicatesReview
                open={isDuplicatesOpen}
                onOpenChange={setIsDuplicatesOpen}
                componyId={id}
                onMerged={refetch}
            />

            <ManualMerge
                open={isManualMergeOpen}
                onOpenChange={setIsManualMergeOpen}
                componyId={id}
                onMerged={refetch}
            />

            <BadFaceRecords
                open={isBadFacesOpen}
                onOpenChange={setIsBadFacesOpen}
                componyId={id}
                onSelectEmployee={(emp) => {
                    setSelectedEmployee(emp);
                    setIsOpen(true);
                }}
            />

            <FaceSearchDialog
                open={isFaceSearchOpen}
                onOpenChange={setIsFaceSearchOpen}
                componyId={id}
                onSelectEmployee={(emp) => {
                    setIsFaceSearchOpen(false);
                    setSelectedEmployee(emp);
                    setIsOpen(true);
                }}
            />
        </div>
    );
}
