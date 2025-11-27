import { useState, useRef, useEffect } from "react";
import axios from "axios";

const LeaveRequestsTable = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLTableElement>(null);
  // For confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    status: string;
  } | null>(null);
  // For empty remarks modal
  const [emptyRemarksModal, setEmptyRemarksModal] = useState<{
    id: number;
    status: string;
  } | null>(null);
  // Modal for insufficient leave credit
  const [insufficientLeaveModal, setInsufficientLeaveModal] = useState<{
    id: number;
    status: string;
    requestedDays: number;
    totalDays: number;
    maxAllowed: number;
  } | null>(null);

  // Helper: get requested leave days
  const getRequestedDays = (req: any) => {
    if (req.start_date && req.end_date) {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      // Inclusive of both start and end
      return (
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1
      );
    }
    return 1;
  };

  // Helper: get max allowed days for leave type
  const getMaxAllowedDays = (leaveType: string) => {
    const type = leaveType?.toLowerCase();
    if (type === "maternity" || type === "paternity") return 105;
    return 12;
  };

  // Close insufficient leave modal
  const handleCloseInsufficientLeave = () => setInsufficientLeaveModal(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [leaveRes, employeeRes] = await Promise.all([
          axios.get("http://localhost:3001/api/leaves-pending"),
          axios.get("http://localhost:3001/api/employees"),
        ]);
        if (isMounted) {
          setRequests(leaveRes.data);
          setEmployees(employeeRes.data);
        }
      } catch (err) {
        if (isMounted) {
          setRequests([]);
          setEmployees([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    setLoading(true);
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportCSV = () => {
    // Prepare CSV header
    const header = ["Name", "Department", "Type", "Date", "Remarks", "Status"];
    // Prepare CSV rows
    const rows = filteredRequests.map((req) => {
      const name = getEmployeeName(req.employee_id);
      const department = getEmployeeDepartment(req.employee_id);
      const type = req.leave_type || req.type || "";
      const date = req.start_date
        ? req.start_date.split("T")[0]
        : req.date
        ? req.date.split("T")[0]
        : "";
      const remarks = req.remarks || "";
      const status = req.status || "";
      return [name, department, type, date, remarks, status]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csvContent = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LeaveRequestsTable.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper: get employee name by id
  const getEmployeeName = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${emp.lastname}, ${emp.firstname}` : "";
  };
  // Helper: get employee department by id
  const getEmployeeDepartment = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? emp.department : "";
  };

  // Handle Accept/Reject click
  const handleStatusClick = (id: number, status: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    if (!req.remarks || req.remarks.trim() === "") {
      setEmptyRemarksModal({ id, status });
      return;
    }
    if (status === "Accepted") {
      const requestedDays = getRequestedDays(req);
      const leaveType = req.leave_type || req.type || "";
      const year = new Date(req.start_date || req.date).getFullYear();
      // Fetch total leave days for this employee/type/year
      axios
        .get(
          `http://localhost:3001/api/leave-total-days/${req.employee_id}/${leaveType}/${year}`
        )
        .then((res) => {
          const totalDays = Number(res.data?.total_days ?? 0);
          const maxAllowed = getMaxAllowedDays(leaveType);
          if (totalDays + requestedDays > maxAllowed) {
            setInsufficientLeaveModal({
              id,
              status,
              requestedDays,
              totalDays,
              maxAllowed,
            });
            return;
          }
          setConfirmAction({ id, status });
        })
        .catch(() => {
          // fallback: allow if cannot fetch
          setConfirmAction({ id, status });
        });
      return;
    }
    setConfirmAction({ id, status });
  };

  // Confirm action
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { id, status } = confirmAction;
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    // Update in backend
    try {
      const today = new Date().toISOString().slice(0, 19).replace("T", " ");
      const res = await fetch(`http://localhost:3001/api/leaves-update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          remarks: req.remarks,
          acceptance_date: today,
        }),
      });
      if (!res.ok) throw new Error("Failed to update leave status");
      // Instead of removing, re-fetch the data to reflect changes
      setLoading(true);
      // Re-fetch leave requests and employees
      try {
        const [leaveRes, employeeRes] = await Promise.all([
          axios.get("http://localhost:3001/api/leaves-pending"),
          axios.get("http://localhost:3001/api/employees"),
        ]);
        setRequests(leaveRes.data);
        setEmployees(employeeRes.data);
      } catch (err) {
        setRequests([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      alert("Error updating leave status: " + err);
    }
    setConfirmAction(null);
  };

  // Cancel confirmation
  const handleCancel = () => setConfirmAction(null);
  // Close empty remarks modal
  const handleCloseEmptyRemarks = () => setEmptyRemarksModal(null);

  const filteredRequests = requests.filter(
    (r) =>
      getEmployeeName(r.employee_id)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (r.department?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (r.leave_type?.toLowerCase() || r.type?.toLowerCase() || "").includes(
        search.toLowerCase()
      ) ||
      (r.status?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (r.remarks?.toLowerCase() || "").includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }
  const useThinScrollbar = filteredRequests.length > 10;
  return (
    <>
      <div
        className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 mt-6 sm:px-6 sm:pt-6 ${
          useThinScrollbar ? "max-h-[600px] overflow-y-auto scrollbar-thin" : ""
        }`}
        style={
          useThinScrollbar
            ? { scrollbarColor: "#22c55e #222", scrollbarWidth: "thin" }
            : {}
        }
      >
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Leave Requests
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leave requests..."
              className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              style={{ minWidth: 220 }}
            />
            <button
              type="button"
              title="Export CSV"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center"
              onClick={handleExportCSV}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8"
                />
              </svg>
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-300">
                CSV
              </span>
            </button>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <table
            ref={tableRef}
            className="min-w-full rounded-lg divide-y divide-gray-800 dark:divide-gray-700"
          >
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Remarks
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400 dark:text-gray-300"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {getEmployeeName(req.employee_id)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-300">
                        {getEmployeeDepartment(req.employee_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {req.leave_type || req.type || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {req.reason || req.reason || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {req.start_date
                        ? req.start_date.split("T")[0]
                        : req.date
                        ? req.date.split("T")[0]
                        : ""}
                      {req.end_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {req.end_date.split("T")[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <input
                        type="text"
                        className="rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white"
                        value={req.remarks || ""}
                        onChange={(e) =>
                          setRequests(
                            requests.map((r) =>
                              r.id === req.id
                                ? { ...r, remarks: e.target.value }
                                : r
                            )
                          )
                        }
                        placeholder="Add remarks..."
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="px-3 py-1 rounded bg-green-500 text-white mr-2 hover:bg-green-600"
                        onClick={() => handleStatusClick(req.id, "Accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={() => handleStatusClick(req.id, "Rejected")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Confirm {confirmAction.status}
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              Are you sure you want to set this leave request to{" "}
              <span className="font-bold">{confirmAction.status}</span>?<br />
              Remarks:{" "}
              <span className="italic">
                {requests.find((r) => r.id === confirmAction.id)?.remarks}
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  confirmAction.status === "Accepted"
                    ? "bg-green-600"
                    : "bg-red-600"
                } text-white font-semibold hover:${
                  confirmAction.status === "Accepted"
                    ? "bg-green-700"
                    : "bg-red-700"
                }`}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Empty Remarks Modal */}
      {emptyRemarksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Remarks Required
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              Please enter remarks before you can{" "}
              <span className="font-bold">{emptyRemarksModal.status}</span> this
              leave request.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-brand-500 text-white font-semibold hover:bg-brand-600"
                onClick={handleCloseEmptyRemarks}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Insufficient Leave Credit Modal */}
      {insufficientLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">
              Insufficient Leave Credit
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              This employee requested{" "}
              <span className="font-bold">
                {insufficientLeaveModal.requestedDays}
              </span>{" "}
              day(s), but already has{" "}
              <span className="font-bold">
                {insufficientLeaveModal.totalDays}
              </span>{" "}
              day(s) taken this year.
              <br />
              The maximum allowed for this leave type is{" "}
              <span className="font-bold">
                {insufficientLeaveModal.maxAllowed}
              </span>{" "}
              day(s).
              <br />
              Please adjust the request or update leave credit.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-brand-500 text-white font-semibold hover:bg-brand-600"
                onClick={handleCloseInsufficientLeave}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequestsTable;
