import { useEffect } from "react";
import LeaveCalendar from "../components/leave/LeaveCalendar";
import LeaveRequestsTable from "../components/leave/LeaveRequestsTable";
import EmployeeLeaveStatusTable from "../components/leave/EmployeeLeaveStatusTable";
import PageMeta from "../components/common/PageMeta";

const LeaveManagement = () => {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId) {
      window.location.replace("/");
    } else if (role !== "admin") {
      window.location.replace("/employee");
    }
  }, []);
  return (
    <div className="w-full max-w-none px-0 space-y-6">
      <PageMeta
        title="TRuBank HRMS"
        description="TRuBank HRMS Admin Dashboard"
      />
      <div className="w-full">
        <LeaveCalendar />
      </div>
      <div className="w-full">
        <EmployeeLeaveStatusTable />
      </div>
      <div className="w-full">
        <LeaveRequestsTable />
      </div>
    </div>
  );
};
export default LeaveManagement;
