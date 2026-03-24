import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreVertical } from "lucide-react";
import { authorsData, projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { get, post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Employees() {
    const [employees, setEmploees] = useState([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const { toast } = useToast();
    const { id } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;

    const getComponys = () => {
        const endpoint = searchQuery.trim() ? "/admin/fech-client-details-search" : "/admin/fech-client-details";
        post(endpoint, {
            compony_code: id,
            search: searchQuery.trim(),
            limit: itemsPerPage,
            offset: startIndex,
        }).then((res) => {
            const data = res.data?.client_details?.data;
            if (Array.isArray(data)) {
                setEmploees(data as never[]);
                if (res.data?.client_details?.total !== undefined) {
                    setTotalEmployees(res.data.client_details.total);
                } else if (res.data?.client_details?.total_count !== undefined) {
                    setTotalEmployees(res.data.client_details.total_count);
                } else {
                    setTotalEmployees(data.length === itemsPerPage ? startIndex + itemsPerPage + 1 : startIndex + data.length);
                }
            } else {
                setEmploees([]);
                setTotalEmployees(0);
            }
        }).catch((err) => {
            console.error("Error fetching employees:", err);
            setEmploees([]);
            setTotalEmployees(0);
        });
    }

    const totalPages = Math.ceil(totalEmployees / itemsPerPage);
    const paginatedEmployees = employees;

    useEffect(() => {
        const timer = setTimeout(() => {
            getComponys();
        }, 300);
        return () => clearTimeout(timer);
    }, [id, currentPage, searchQuery]);







    return (
        <div className="h-full overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6">
                <div className="flex justify-end">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                        <Input
                            placeholder="Search by employee code..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
                {/* Authors Table */}
                <Card className="border-stone-200">

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                                            AUTHOR
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                                            EMPLOYEE DETAILS
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                                            BRANCH DETAILS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-stone-200">
                                    {paginatedEmployees.map((author: any, index) => (
                                        <tr key={index} className="hover:bg-stone-50 cursor-pointer" onClick={() => {
                                            setSelectedEmployee(author);
                                            setIsOpen(true);
                                        }}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage

                                                            src={author.image ? (author.image.startsWith('data:image') ? author.image : `data:image/jpeg;base64,${author.image}`) : undefined}
                                                            alt={author.fullname}
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback>
                                                            {author.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* <div className="ml-4">
                                                        <div className="text-sm font-normal text-stone-900">{author?.fullname}</div>
                                                        <div className="text-sm text-stone-500">{author?.employee_code}</div>
                                                    </div> */}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">{author.fullname}</div>
                                                <div className="text-sm text-stone-500">{author.employee_code}</div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">Agency {author.agency}</div>
                                                <div className="text-sm text-stone-500">Branch {author.branch}</div>
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
                                    <div className="text-sm text-stone-500 sm:hidden">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>


            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Employee Details</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="flex flex-col items-center space-y-4 py-6">
                            {selectedEmployee.image ? (
                                <img
                                    src={selectedEmployee.image.startsWith('data:image') ? selectedEmployee.image : `data:image/jpeg;base64,${selectedEmployee.image}`}
                                    alt={selectedEmployee.fullname}
                                    className="w-full h-80 object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-full h-80 bg-stone-100 flex items-center justify-center rounded-md">
                                    <span className="text-6xl text-stone-400 font-medium">
                                        {selectedEmployee.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                    </span>
                                </div>
                            )}
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-stone-900">{selectedEmployee.fullname}</h3>
                                <p className="text-sm text-stone-500 mb-4">{selectedEmployee.employee_code}</p>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                        <div className="text-xs text-stone-500 uppercase">Agency</div>
                                        <div className="font-medium text-stone-900">{selectedEmployee.agency}</div>
                                    </div>
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                        <div className="text-xs text-stone-500 uppercase">Branch</div>
                                        <div className="font-medium text-stone-900">{selectedEmployee.branch}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-center w-full mt-4">
                        <Button variant="secondary" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
