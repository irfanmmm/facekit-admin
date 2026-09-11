// Human-readable label/description for each admin permission key, matching
// utility/permissions.py::AdminPermissions.DEFAULT_PERMISSIONS on the backend.
// Keep this list in sync with that dict - a key missing here still renders
// (falls back to the raw key), it just won't have a nice description.
export const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
    view_employees: {
        label: "View Employees",
        description: "See the employee list and search/filter it.",
    },
    delete_employee_facekit: {
        label: "Delete Employee (Facekit only)",
        description: "Remove an employee from Facekit's own database. Officekit is left untouched.",
    },
    view_attendance: {
        label: "View Attendance",
        description: "See attendance records for employees.",
    },
    download_attendance: {
        label: "Download Attendance (CSV)",
        description: "Export attendance records as a CSV file.",
    },
    download_employee_details: {
        label: "Download Employee Details (PDF)",
        description: "Export employee details as a PDF file.",
    },
    face_search: {
        label: "Search by Photo",
        description: "Upload a photo to find a matching employee via face recognition.",
    },
    force_delete_employee_officekit: {
        label: "Force Delete Employee (Facekit + Officekit)",
        description: "Permanently remove an employee from both Facekit and the external Officekit HR system.",
    },
    switch_branch: {
        label: "Switch Employee Branch",
        description: "Move an employee to a different branch, syncing Officekit automatically.",
    },
    switch_agency: {
        label: "Switch Employee Agency",
        description: "Move an employee to a different agency, syncing Officekit automatically.",
    },
    manage_duplicates: {
        label: "Manage Duplicate/Bad Faces",
        description: "Review duplicate face matches and bad-quality face records, and merge duplicate employees.",
    },
    delete_attendance_employee: {
        label: "Delete All Attendance for an Employee",
        description: "Permanently delete every attendance record for one employee, across all months.",
    },
    delete_attendance_day: {
        label: "Delete a Day's Attendance",
        description: "Permanently delete one employee's whole attendance record for a specific day.",
    },
    delete_attendance_punch: {
        label: "Delete a Single Punch",
        description: "Permanently delete one specific in/out punch from a day's attendance record.",
    },
};
