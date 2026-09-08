import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { post } from "@/hooks/http";
import { useToast } from "@/hooks/use-toast";

interface EmployeeDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
    employees: any[];
    componyId: string | undefined;
    isSuperAdmin: boolean;
    onSaved: (updated: any) => void;
    onDeleted: () => void;
}

export function EmployeeDetailsDialog({
    open,
    onOpenChange,
    employee,
    employees,
    componyId,
    isSuperAdmin,
    onSaved,
    onDeleted,
}: EmployeeDetailsDialogProps) {
    const { toast } = useToast();

    const [isEditingMode, setIsEditingMode] = useState(false);
    const [isImageDeleted, setIsImageDeleted] = useState(false);
    const [editedBranch, setEditedBranch] = useState("");
    const [editedAgency, setEditedAgency] = useState("");
    const [editedBranchId, setEditedBranchId] = useState<string | null>(null);
    const [editedAgencyId, setEditedAgencyId] = useState<string | null>(null);
    const [branchOptions, setBranchOptions] = useState<{ _id: string; name: string }[]>([]);
    const [agencyOptions, setAgencyOptions] = useState<{ _id: string; name: string }[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingAgencies, setLoadingAgencies] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [openAgency, setOpenAgency] = useState(false);
    const [openBranch, setOpenBranch] = useState(false);
    const [deleteMode, setDeleteMode] = useState<"facekit" | "force" | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset editing state whenever a different employee is opened.
    useEffect(() => {
        setEditedBranch(employee?.branch || "");
        setEditedAgency(employee?.agency || "");
        setEditedBranchId(null);
        setEditedAgencyId(null);
        setIsEditingMode(false);
        setIsImageDeleted(false);
    }, [employee]);

    // Fetch the full branch list (not just names scraped from already-loaded
    // employees) the moment editing starts, and resolve the employee's
    // current branch name to its Officekit/local id so the picker can be
    // preselected and switch-branch has an id to send.
    useEffect(() => {
        if (!isEditingMode || !componyId) return;
        let cancelled = false;
        setLoadingBranches(true);
        post("/admin/get-branch", { compony_code: componyId, limit: 1000 })
            .then((res) => {
                if (cancelled) return;
                const options: { _id: string; name: string }[] = res.data?.details || [];
                setBranchOptions(options);
                const match = options.find((b) => b.name === employee?.branch);
                setEditedBranchId(match ? match._id : null);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error("Failed to load branches", error);
                toast({ title: "Failed to load branches", variant: "destructive" });
            })
            .finally(() => { if (!cancelled) setLoadingBranches(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditingMode, componyId]);

    // Agencies are scoped to a branch in Officekit (the same agency name can
    // have a different id per branch), so refetch whenever the selected
    // branch changes.
    useEffect(() => {
        if (!isEditingMode || !componyId) return;
        let cancelled = false;
        setLoadingAgencies(true);
        post("/admin/get-agency", { compony_code: componyId, branch_id: editedBranchId || undefined })
            .then((res) => {
                if (cancelled) return;
                const options: { _id: string; name: string }[] = res.data?.details || [];
                setAgencyOptions(options);
                setEditedAgencyId((prev) => {
                    if (prev && options.some((a) => a._id === prev)) return prev;
                    const match = options.find((a) => a.name === employee?.agency);
                    return match ? match._id : null;
                });
            })
            .catch((error) => {
                if (cancelled) return;
                console.error("Failed to load agencies", error);
                toast({ title: "Failed to load agencies", variant: "destructive" });
            })
            .finally(() => { if (!cancelled) setLoadingAgencies(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditingMode, componyId, editedBranchId]);

    const handleSaveEmployeeDetails = async () => {
        setIsSaving(true);
        try {
            if (isImageDeleted && employee.image) {
                try {
                    await post("/admin/delete-employee-image", {
                        compony_code: componyId,
                        employee_code: employee.employee_code
                    });
                } catch (e) {
                    console.error("Failed to delete image", e);
                    toast({ title: "Failed to delete image", variant: "destructive" });
                }
            }

            const originalBranchId = branchOptions.find((b) => b.name === employee?.branch)?._id ?? null;
            const originalAgencyId = agencyOptions.find((a) => a.name === employee?.agency)?._id ?? null;
            const branchChanged = editedBranchId !== null && editedBranchId !== originalBranchId;
            const agencyChanged = editedAgencyId !== null && editedAgencyId !== originalAgencyId;

            let resolvedBranch = editedBranch;
            let resolvedAgency = editedAgency;

            // Branch switch first: it moves the employee to the new branch in
            // Officekit (preserving their current agency/designation), so an
            // agency switch right after operates on that new branch.
            if (branchChanged) {
                const res = await post("/admin/switch-branch", {
                    compony_code: componyId,
                    employee_code: employee.employee_code,
                    branch_id: editedBranchId,
                });
                if (!(res.data && res.data.message === "success")) {
                    toast({ title: "Failed to switch branch", description: res.data?.message, variant: "destructive" });
                    return;
                }
                if (res.data.details) {
                    resolvedBranch = res.data.details.branch_name;
                    resolvedAgency = res.data.details.agency_name;
                } else {
                    resolvedBranch = branchOptions.find((b) => b._id === editedBranchId)?.name ?? resolvedBranch;
                }
            }

            if (agencyChanged) {
                const res = await post("/admin/switch-agency", {
                    compony_code: componyId,
                    employee_code: employee.employee_code,
                    agency_id: editedAgencyId,
                });
                if (!(res.data && res.data.message === "success")) {
                    toast({ title: "Failed to switch agency", description: res.data?.message, variant: "destructive" });
                    return;
                }
                if (res.data.details) {
                    resolvedAgency = res.data.details.agency_name;
                } else {
                    resolvedAgency = agencyOptions.find((a) => a._id === editedAgencyId)?.name ?? resolvedAgency;
                }
            }

            toast({ title: "Updated successfully" });
            onSaved({
                ...employee,
                branch: resolvedBranch,
                agency: resolvedAgency,
                image: isImageDeleted ? null : employee.image
            });
            setIsEditingMode(false);
            setIsImageDeleted(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error updating details", description: error?.response?.data?.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEmployee = async () => {
        if (!employee || !deleteMode) return;
        setIsDeleting(true);
        try {
            const endpoint = deleteMode === "force" ? "/admin/force-delete-employee" : "/admin/delete-employee";
            const res = await post(endpoint, {
                compony_code: componyId,
                employee_code: employee.employee_code,
            });
            if (res.data && res.data.message === "success") {
                toast({
                    title: "Employee deleted",
                    description: deleteMode === "force"
                        ? "Employee removed from Facekit and Officekit, and the face index was rebuilt."
                        : "Employee removed from Facekit and the face index was rebuilt.",
                });
                setDeleteMode(null);
                onDeleted();
            } else {
                toast({ title: "Failed to delete employee", description: res.data?.message, variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Error deleting employee:", error);
            toast({ title: "Failed to delete employee", description: error?.response?.data?.message, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* ── Employee Details Modal ── */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Employee Details</DialogTitle>
                    </DialogHeader>
                    {employee && (
                        <div className="flex flex-col items-center space-y-4 py-6">
                            {(employee.image && !isImageDeleted) ? (
                                <div className="relative w-full h-80">
                                    <img
                                        src={`http://facekit.officekithr.net/facekit/uploads/${employee.image}`}
                                        alt={employee.fullname}
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                    {isEditingMode && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 rounded-full shadow-md w-8 h-8 opacity-90 hover:opacity-100"
                                            onClick={() => setIsImageDeleted(true)}
                                            title="Delete Image"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-80 bg-stone-100 flex items-center justify-center rounded-md relative">
                                    <span className="text-6xl text-stone-400 font-medium">
                                        {employee.fullname?.split(' ').map((n: any) => n[0]).join('')?.substring(0, 2)}
                                    </span>
                                    {(isEditingMode && isImageDeleted) && (
                                        <Badge variant="secondary" className="absolute top-2 right-2 border border-stone-200">Image Deleted</Badge>
                                    )}
                                </div>
                            )}
                            <div className="text-center w-full">
                                <h3 className="text-xl font-bold text-stone-900">{employee.fullname}</h3>
                                <p className="text-sm text-stone-500 mb-4">{employee.employee_code}</p>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                        <div className="text-xs text-stone-500 uppercase mb-1">Agency</div>
                                        {isEditingMode ? (
                                            <Popover open={openAgency} onOpenChange={setOpenAgency}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        role="combobox"
                                                        aria-expanded={openAgency}
                                                        className="flex h-8 w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <span className="truncate">{editedAgency || "Select agency"}</span>
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search agency..." />
                                                        <CommandList>
                                                            <CommandEmpty>{loadingAgencies ? "Loading agencies..." : "No agency found."}</CommandEmpty>
                                                            <CommandGroup>
                                                                {agencyOptions.map((agency) => (
                                                                    <CommandItem
                                                                        key={agency._id}
                                                                        value={agency.name}
                                                                        onSelect={() => { setEditedAgency(agency.name); setEditedAgencyId(agency._id); setOpenAgency(false); }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", editedAgencyId === agency._id ? "opacity-100" : "opacity-0")} />
                                                                        {agency.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="font-medium text-stone-900">{employee.agency || "Not Assigned"}</div>
                                        )}
                                    </div>
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                                        <div className="text-xs text-stone-500 uppercase mb-1">Branch</div>
                                        {isEditingMode ? (
                                            <Popover open={openBranch} onOpenChange={setOpenBranch}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        role="combobox"
                                                        aria-expanded={openBranch}
                                                        className="flex h-8 w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <span className="truncate">{editedBranch || "Select branch"}</span>
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search branch..." />
                                                        <CommandList>
                                                            <CommandEmpty>{loadingBranches ? "Loading branches..." : "No branch found."}</CommandEmpty>
                                                            <CommandGroup>
                                                                {branchOptions.map((branch) => (
                                                                    <CommandItem
                                                                        key={branch._id}
                                                                        value={branch.name}
                                                                        onSelect={() => { setEditedBranch(branch.name); setEditedBranchId(branch._id); setOpenBranch(false); }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", editedBranchId === branch._id ? "opacity-100" : "opacity-0")} />
                                                                        {branch.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="font-medium text-stone-900">{employee.branch || "Not Assigned"}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-center mt-4">
                        {isEditingMode ? (
                            <>
                                <Button onClick={() => setIsEditingMode(false)} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleSaveEmployeeDetails} disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        ) : (
                            <>
                                {isSuperAdmin && (
                                    <Button onClick={() => setIsEditingMode(true)}>Edit</Button>
                                )}
                                {isSuperAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="destructive" className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center">
                                            <DropdownMenuItem onClick={() => setDeleteMode("facekit")}>
                                                Delete from Facekit only
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteMode("force")}>
                                                Force delete (Facekit + Officekit)
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ── */}
            <Dialog open={deleteMode !== null} onOpenChange={(o) => { if (!isDeleting && !o) setDeleteMode(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{deleteMode === "force" ? "Force Delete Employee" : "Delete Employee"}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-stone-600 space-y-2 py-2">
                        {deleteMode === "force" ? (
                            <p>
                                This will <span className="font-semibold text-red-600">permanently delete</span> {employee?.fullname} ({employee?.employee_code}) from Facekit <span className="font-semibold text-red-600">and Officekit</span>, and rebuild the face recognition index.
                            </p>
                        ) : (
                            <p>
                                This will <span className="font-semibold text-red-600">permanently delete</span> {employee?.fullname} ({employee?.employee_code}) from Facekit only, and rebuild the face recognition index. Their Officekit record is left untouched.
                            </p>
                        )}
                        <p>This action cannot be undone.</p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button variant="secondary" onClick={() => setDeleteMode(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteEmployee} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : deleteMode === "force" ? "Yes, Force Delete" : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
