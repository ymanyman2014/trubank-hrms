// ...existing code...

import { useState, useEffect } from "react";
import axios from "axios";
// Removed ChartTab import

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const LeaveCalendar = () => {
  const today = new Date();
  const [selectedDept, setSelectedDept] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedDept) return;
    let isMounted = true;
    const fetchLeaves = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3001/api/leaves/department/${encodeURIComponent(
            selectedDept
          )}`
        );
        if (isMounted) {
          setLeaves(res.data);
        }
      } catch {
        if (isMounted) setLeaves([]);
      }
    };
    fetchLeaves();
    return () => {
      isMounted = false;
    };
  }, [selectedDept]);

  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/departments");
        if (isMounted) {
          setDepartments(res.data);
          if (res.data.length > 0) setSelectedDept(res.data[0]);
        }
      } catch {
        if (isMounted) setDepartments([]);
      }
    };
    fetchDepartments();
    interval = setInterval(() => {
      fetchDepartments();
    }, 60000); // refresh departments every 60 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  // Map leaves by date for quick lookup (handles date_start to date_end range)
  const leavesByDate = leaves.reduce((acc, leave) => {
    const start = new Date(leave.date_start);
    const end = new Date(leave.date_end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      acc[dateStr] = acc[dateStr] ? [...acc[dateStr], leave] : [leave];
    }
    return acc;
  }, {} as Record<string, typeof leaves>);

  // Get first day of month (0=Sun, 6=Sat)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  // Build calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null); // empty cells before first day
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Handlers for arrows
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Leave Calendar
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            View filed leaves by department
          </p>
        </div>
        <div className="flex gap-1 bg-gray-900/10 rounded-lg p-0.5 w-fit">
          {departments.map((dept) => (
            <button
              key={dept}
              className={`flex-1 min-w-[70px] py-1 rounded-md text-sm font-bold transition focus:outline-none text-center
                ${
                  selectedDept === dept
                    ? "bg-gray-400 text-white"
                    : "text-gray-400"
                }`}
              style={{ letterSpacing: "0.02em" }}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2 mb-2">
        <button
          className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
        >
          <span className="text-lg font-bold text-gray-700 dark:text-white">
            &#8592;
          </span>
        </button>
        <span className="text-base font-semibold text-gray-700 dark:text-white">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          onClick={handleNextMonth}
          aria-label="Next Month"
        >
          <span className="text-lg font-bold text-gray-700 dark:text-white">
            &#8594;
          </span>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center mb-1"
          >
            {day}
          </div>
        ))}
        {calendarCells.map((cell, idx) => (
          <div
            key={idx}
            className="min-h-[60px] bg-gray-50 dark:bg-white/[0.03] rounded-none p-1 flex flex-col items-center justify-start border border-gray-300 dark:border-gray-700"
          >
            {cell && (
              <>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  {cell}
                </div>
                {leavesByDate[
                  `${viewYear}-` +
                    String(viewMonth + 1).padStart(2, "0") +
                    `-` +
                    String(cell).padStart(2, "0")
                ]?.map((leave: any, i: number) => {
                  let bgColor = "bg-gray-400";
                  if (leave.type?.toLowerCase().includes("sick"))
                    bgColor = "bg-red-600";
                  else if (leave.type?.toLowerCase().includes("vacation"))
                    bgColor = "bg-green-600";
                  else if (
                    leave.type?.toLowerCase().includes("maternity") ||
                    leave.type?.toLowerCase().includes("paternity")
                  )
                    bgColor = "bg-gray-400";
                  else if (leave.type?.toLowerCase().includes("without pay"))
                    bgColor = "bg-blue-600";
                  return (
                    <div
                      key={i}
                      className={`w-full flex items-center justify-center text-[10px] font-medium rounded-md px-1 py-0.5 mb-1 text-white ${bgColor}`}
                    >
                      {leave.name}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveCalendar;
