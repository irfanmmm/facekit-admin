import { useEffect, useState } from "react";
import { post } from "@/hooks/http";

/** Shared fetch/pagination/filter state for the employee list — used by the
 * table itself and by any dialog that needs the current page of employees
 * (e.g. branch/agency autocomplete suggestions). */
export function useEmployees(componyId: string | undefined) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const totalPages = Math.ceil(totalEmployees / itemsPerPage);

    const [emploeeCodeQury, setEmployeeCode] = useState("");
    const [branchQuery, setBranchQuery] = useState("");
    const [agencyQuery, setAgencyQuery] = useState("");
    const [authorQuery, setAuthorQuery] = useState("");
    const [filterDate, setFilterDate] = useState<string>("");

    const refetch = () => {
        const endpoint = (branchQuery || agencyQuery || authorQuery || emploeeCodeQury) ? "/admin/fech-client-details-search" : "/admin/fech-client-details";
        const payload: any = {
            compony_code: componyId,
            employee_code: emploeeCodeQury,
            branch: branchQuery,
            agency: agencyQuery,
            name: authorQuery,
            limit: itemsPerPage,
            offset: startIndex,
        };

        if (filterDate) {
            payload.date = filterDate;
        }

        post(endpoint, payload).then((res) => {
            const data = res.data?.client_details?.data;
            if (Array.isArray(data)) {
                setEmployees(data as never[]);
                if (res.data?.client_details?.total !== undefined) {
                    setTotalEmployees(res.data.client_details.total);
                } else if (res.data?.client_details?.total_count !== undefined) {
                    setTotalEmployees(res.data.client_details.total_count);
                } else {
                    setTotalEmployees(data.length === itemsPerPage ? startIndex + itemsPerPage + 1 : startIndex + data.length);
                }
            } else {
                setEmployees([]);
                setTotalEmployees(0);
            }
        }).catch((err) => {
            console.error("Error fetching employees:", err);
            setEmployees([]);
            setTotalEmployees(0);
        });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            refetch();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componyId, currentPage, branchQuery, authorQuery, emploeeCodeQury, agencyQuery, filterDate]);

    return {
        employees,
        totalEmployees,
        currentPage,
        setCurrentPage,
        itemsPerPage,
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
    };
}
