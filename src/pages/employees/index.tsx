import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { MoreVertical, Search, Calendar, ClipboardList, Download, Copy, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getFile } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeDetailsDialog } from "./EmployeeDetailsDialog";
import { AttendanceDialog } from "./AttendanceDialog";
import { DuplicatesReview } from "./DuplicatesReview";
import { BadFaceRecords } from "./BadFaceRecords";

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
    const [isBadFacesOpen, setIsBadFacesOpen] = useState(false);

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
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-stone-900">Employee List</h2>
                            <Badge variant="secondary" className="text-xs">{id}</Badge>
                        </div>
                        <div className="h-6 w-[1px] bg-stone-200 mx-2" />
                        <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100 group relative">
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
                                    className="ml-1 text-stone-400 hover:text-stone-900 transition-colors"
                                    title="Clear filter"
                                >
                                    <MoreVertical className="h-3 w-3 rotate-45" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                className="h-10 bg-stone-900 hover:bg-stone-800 transition-colors flex items-center gap-2 px-3 relative overflow-hidden"
                                onClick={() => handleDownloadDetails()}
                                disabled={downloadingDetails}
                                title="Download Employee Details (PDF)"
                            >
                                <Download className="h-4 w-4" />
                                {downloadingDetails ? `Downloading... ${downloadProgress}%` : "Details"}
                                {downloadingDetails && (
                                    <Progress value={downloadProgress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none opacity-50 [&>div]:bg-white" />
                                )}
                            </Button>
                            <Button
                                className="h-10 bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2 px-3 relative overflow-hidden"
                                onClick={() => handleDownloadAttendance()}
                                disabled={downloadingAttendance}
                                title="Download Employee Attendance (CSV)"
                            >
                                <Download className="h-4 w-4" />
                                {downloadingAttendance ? `Downloading... ${downloadProgress}%` : "Attendance"}
                                {downloadingAttendance && (
                                    <Progress value={downloadProgress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none opacity-50 [&>div]:bg-white" />
                                )}
                            </Button>
                            {isSuperAdmin && (
                                <Button
                                    className="h-10 bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-2 px-3"
                                    onClick={() => setIsDuplicatesOpen(true)}
                                    title="Scan for duplicate faces"
                                >
                                    <Copy className="h-4 w-4" />
                                    Check Duplicates
                                </Button>
                            )}
                            {isSuperAdmin && (
                                <Button
                                    variant="outline"
                                    className="h-10 border-red-300 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 px-3"
                                    onClick={() => setIsBadFacesOpen(true)}
                                    title="Find employees with a broken/bad face encoding"
                                >
                                    <ImageOff className="h-4 w-4" />
                                    Bad Faces
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Authors Table */}
                <Card className="border-stone-200">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">EMPLOYEE NAME</th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">EMPLOYEE CODE</th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">BRANCH DETAILS</th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">AGENCY DETAILS</th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">ATTENDANCE</th>
                                    </tr>
                                    <tr className="border-t border-stone-200 bg-stone-50/50">
                                        <th className="px-6 py-2 font-normal">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search employee name..."
                                                    className="pl-8 h-8 text-xs bg-white border-stone-200 focus:bg-white focus-visible:ring-stone-500 placeholder-stone-400 text-stone-700"
                                                    value={authorQuery}
                                                    onChange={(e) => setAuthorQuery(e.target.value)}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-6 py-2 font-normal">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search employee code..."
                                                    className="pl-8 h-8 text-xs bg-white border-stone-200 focus:bg-white focus-visible:ring-stone-500 placeholder-stone-400 text-stone-700"
                                                    value={emploeeCodeQury}
                                                    onChange={(e) => { setEmployeeCode(e.target.value); setCurrentPage(1); }}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-6 py-2 font-normal">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search branch..."
                                                    className="pl-8 h-8 text-xs bg-white border-stone-200 focus:bg-white focus-visible:ring-stone-500 placeholder-stone-400 text-stone-700"
                                                    value={branchQuery}
                                                    onChange={(e) => setBranchQuery(e.target.value)}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-6 py-2 font-normal">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search agency..."
                                                    className="pl-8 h-8 text-xs bg-white border-stone-200 focus:bg-white focus-visible:ring-stone-500 placeholder-stone-400 text-stone-700"
                                                    value={agencyQuery}
                                                    onChange={(e) => setAgencyQuery(e.target.value)}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-6 py-2 font-normal">
                                            <Input
                                                type="text"
                                                disabled
                                                placeholder="N/A"
                                                className="h-8 text-xs bg-stone-100/50 border-stone-200 placeholder-stone-400 text-stone-400 cursor-not-allowed"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-stone-200">
                                    {paginatedEmployees.map((author: any, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-stone-50 cursor-pointer"
                                            onClick={() => {
                                                setSelectedEmployee(author);
                                                setIsOpen(true);
                                            }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage
                                                            src={author.image ? `http://facekit.officekithr.net/facekit/uploads/${author.image}` : undefined}
                                                            alt={author.fullname}
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback>
                                                            {author.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-normal text-stone-900">{author?.fullname}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">{author.employee_code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">{author.branch ? `Branch ${author.branch}` : <span className="text-stone-400 italic">Not Assigned</span>}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">{author.agency ? `Agency ${author.agency}` : <span className="text-stone-400 italic">Not Assigned</span>}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2 hover:bg-stone-100"
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                isSuperAdmin={isSuperAdmin}
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

            <BadFaceRecords
                open={isBadFacesOpen}
                onOpenChange={setIsBadFacesOpen}
                componyId={id}
                onSelectEmployee={(emp) => {
                    setSelectedEmployee(emp);
                    setIsOpen(true);
                }}
            />
        </div>
    );
}
