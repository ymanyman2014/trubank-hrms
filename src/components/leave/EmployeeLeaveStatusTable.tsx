import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

type Employee = {
  id: number;
  idNumber: string;
  lastname: string;
  firstname: string;
  email: string;
  department: string;
  position: string;
  dateHired: string;
  status: string;
  role?: string;
  profileImage: string | null;
};

type LeaveRecord = {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
};

const LeaveProgressBar = ({ used }: { used: number }) => {
  const percent = Math.min(100, Math.round((used / 12) * 100));
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 mt-1 mb-1">
      <div
        className="h-2 rounded"
        style={{
          width: `${percent}%`,
          background:
            percent < 80 ? "#34d399" : percent < 100 ? "#fbbf24" : "#ef4444",
        }}
      ></div>
    </div>
  );
};

const EmployeeLeaveStatusTable: React.FC = () => {
  // CSV export function
  const handleExportCSV = () => {
    const headers = [
      "ID Number",
      "Name",
      "Department",
      "Sick Leave",
      "Vacation Leave",
      "Maternity/Paternity Leave",
      "Without Pay Leave",
    ];
    const rows = filteredEmployees.map((emp) => {
      const sickLeaveUsed = getLeaveUsage(emp.id, "Sick");
      const vacationLeaveUsed = getLeaveUsage(emp.id, "Vacation");
      const maternityLeaves = leaves.filter(
        (l) =>
          l.employee_id === emp.id &&
          l.leave_type.toLowerCase().includes("maternity")
      );
      const paternityLeaves = leaves.filter(
        (l) =>
          l.employee_id === emp.id &&
          l.leave_type.toLowerCase().includes("paternity")
      );
      const maternityPaternityLeave =
        maternityLeaves.length > 0
          ? `${maternityLeaves[0].start_date} to ${maternityLeaves[0].end_date}`
          : paternityLeaves.length > 0
          ? `${paternityLeaves[0].start_date} to ${paternityLeaves[0].end_date}`
          : "—";
      const withoutPayLeaveUsed = getLeaveUsage(emp.id, "Without Pay Leave");
      return [
        emp.idNumber,
        `${emp.lastname}, ${emp.firstname}`,
        emp.department,
        `${sickLeaveUsed} / 12 days`,
        `${vacationLeaveUsed} / 12 days`,
        maternityPaternityLeave,
        `${withoutPayLeaveUsed} / 12 days`,
      ];
    });
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\r\n";
    rows.forEach((row) => {
      csvContent +=
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",") +
        "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); //
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "EmployeeLeaveStatusTable.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [years, setYears] = useState<string[]>([]);
  const [downloadingLedgerId, setDownloadingLedgerId] = useState<number | null>(
    null
  );

  // Accepted leaves and year filter
  const acceptedLeaves: LeaveRecord[] = leaves.filter(
    (l: LeaveRecord) => l.status === "Accepted"
  );
  const acceptedLeavesForYear: LeaveRecord[] = acceptedLeaves.filter(
    (l: LeaveRecord) => {
      if (!selectedYear) return true;
      if (!l.start_date) return false;
      return new Date(l.start_date).getFullYear() === Number(selectedYear);
    }
  );

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, leaveRes] = await Promise.all([
          axios.get("http://localhost:3001/api/employees"),
          axios.get("http://localhost:3001/api/leaves"),
        ]);
        if (isMounted) {
          setEmployees(empRes.data);
          setLeaves(leaveRes.data);
          // Extract years from leave records
          const allYears: number[] = Array.from(
            new Set(
              (leaveRes.data as LeaveRecord[])
                .map((l: LeaveRecord) =>
                  l.start_date
                    ? new Date(l.start_date).getFullYear()
                    : undefined
                )
                .filter((y): y is number => typeof y === "number" && !!y)
            )
          );
          allYears.sort((a: number, b: number) => b - a);
          const yearStrings = allYears.map((year: number) => year.toString());
          setYears(yearStrings);
          // Set default selected year if not set
          if (!selectedYear && yearStrings.length > 0) {
            setSelectedYear(yearStrings[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setEmployees([]);
          setLeaves([]);
          console.error("Error fetching data:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: get leave usage for an employee
  const getLeaveUsage = (employeeId: number, type: string): number => {
    const filtered = acceptedLeavesForYear.filter(
      (l: LeaveRecord) =>
        l.employee_id === employeeId &&
        l.leave_type.toLowerCase() === type.toLowerCase()
    );
    // Sum total days taken for this leave type
    const totalDaysTaken = filtered.reduce((sum, l) => {
      if (l.start_date && l.end_date) {
        const start = new Date(l.start_date).getTime();
        const end = new Date(l.end_date).getTime();
        // Inclusive of both start and end
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return sum + (days > 0 ? days : 1);
      }
      return sum + 1;
    }, 0);
    // Leave credits left
    return Math.max(0, 12 - totalDaysTaken);
  };

  // Helper: get leave history for an employee
  const getLeaveHistory = (
    employeeId: number
  ): { type: string; date: string; days: number }[] => {
    return acceptedLeavesForYear
      .filter((l: LeaveRecord) => l.employee_id === employeeId)
      .map((l: LeaveRecord) => ({
        type: l.leave_type,
        date:
          l.start_date +
          (l.end_date && l.end_date !== l.start_date
            ? ` to ${l.end_date}`
            : ""),
        days:
          l.end_date && l.start_date
            ? (new Date(l.end_date).getTime() -
                new Date(l.start_date).getTime()) /
                (1000 * 60 * 60 * 24) +
              1
            : 1,
      }));
  };

  const filteredEmployees = employees.filter((emp: Employee) => {
    const q = search.toLowerCase();
    return (
      emp.idNumber?.toLowerCase().includes(q) ||
      emp.lastname?.toLowerCase().includes(q) ||
      emp.firstname?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q)
    );
  });

  const openModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  async function handleDownloadLeaveLedger(
    user_id: number,
    leaveBalanceYear: string
  ) {
    setDownloadingLedgerId(user_id);
    try {
      const axios = (await import("axios")).default;
      const response = await axios.get(
        `http://localhost:3001/api/leave-ledger/${user_id}/${leaveBalanceYear}`,
        { responseType: "blob" }
      );
      if (response && response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `leave_ledger_${user_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert("No PDF data received.");
      }
    } catch (err) {
      alert("Failed to download Leave Ledger PDF.");
    } finally {
      setDownloadingLedgerId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const useThinScrollbar = filteredEmployees.length > 10;
  return (
    <div
      className={`overflow-visible rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-2 pt-5 pb-6 mt-6 sm:px-4 sm:pt-6 w-full ${
        useThinScrollbar ? "max-h-[600px] overflow-y-auto scrollbar-thin" : ""
      }`}
      style={
        useThinScrollbar
          ? { scrollbarColor: "#22c55e #222", scrollbarWidth: "thin" }
          : {}
      }
    >
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Employee Leave Status
          </h3>
          <select
            className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ minWidth: 80 }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
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
      <div className="w-full">
        <table
          ref={tableRef}
          className="w-full rounded-lg divide-y divide-gray-800 dark:divide-gray-700 table-fixed"
          style={{ tableLayout: "fixed" }}
        >
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Sick Leave
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vacation Leave
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Maternity/ Paternity Leave
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Leave Without Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees
              .filter((emp: Employee) =>
                acceptedLeavesForYear.some(
                  (l: LeaveRecord) => l.employee_id === emp.id
                )
              )
              .map((emp: Employee) => {
                const sickLeaveUsed = getLeaveUsage(emp.id, "Sick");
                const vacationLeaveUsed = getLeaveUsage(emp.id, "Vacation");
                const maternityLeaves = acceptedLeavesForYear.filter(
                  (l: LeaveRecord) =>
                    l.employee_id === emp.id &&
                    l.leave_type.toLowerCase().includes("maternity")
                );
                const paternityLeaves = acceptedLeavesForYear.filter(
                  (l: LeaveRecord) =>
                    l.employee_id === emp.id &&
                    l.leave_type.toLowerCase().includes("paternity")
                );
                const maternityPaternityLeave =
                  maternityLeaves.length > 0
                    ? maternityLeaves[0]
                    : paternityLeaves.length > 0
                    ? paternityLeaves[0]
                    : null;
                const withoutPayLeaveUsed = getLeaveUsage(
                  emp.id,
                  "Leave Without Pay"
                );
                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                  >
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {emp.lastname}, {emp.firstname}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-300">
                        {emp.email}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {emp.department}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-300">
                        {emp.position}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      <LeaveProgressBar used={sickLeaveUsed} />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sickLeaveUsed} / 12 days
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      <LeaveProgressBar used={vacationLeaveUsed} />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {vacationLeaveUsed} / 12 days
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      {maternityPaternityLeave ? (
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-gray-700 dark:text-gray-200 block">
                            {maternityPaternityLeave.start_date
                              ? maternityPaternityLeave.start_date.split("T")[0]
                              : ""}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-200 block">
                            {maternityPaternityLeave.end_date
                              ? maternityPaternityLeave.end_date.split("T")[0]
                              : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-4 text-sm whitespace-normal break-words">
                      <LeaveProgressBar used={withoutPayLeaveUsed} />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {withoutPayLeaveUsed} / 12 days
                      </div>
                    </td>
                    <td className="px-2 py-4 text-right flex items-center gap-2 justify-end whitespace-normal break-words">
                      <button
                        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="View Leave History"
                        onClick={() => openModal(emp)}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Download Leave Ledger PDF"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadLeaveLedger(emp.id, selectedYear);
                        }}
                        disabled={downloadingLedgerId === emp.id}
                      >
                        {downloadingLedgerId === emp.id ? (
                          <span className="text-xs text-gray-400">
                            Downloading...
                          </span>
                        ) : (
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
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {modalOpen && selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            style={{ width: 480, maxWidth: "95vw" }}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {selectedEmployee.lastname}, {selectedEmployee.firstname}'s Leave
              History
            </h3>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr>
                  <th className="py-2 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="py-2 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="py-2 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {getLeaveHistory(selectedEmployee.id).length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-4 text-center text-gray-400 dark:text-gray-300"
                    >
                      No leave history found.
                    </td>
                  </tr>
                ) : (
                  getLeaveHistory(selectedEmployee.id).map((leave, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-gray-700 dark:text-gray-200">
                        {leave.type}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-200">
                        {leave.date ? leave.date.split("T")[0] : leave.date}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-200">
                        {leave.days}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveStatusTable;
