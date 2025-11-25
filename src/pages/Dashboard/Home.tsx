import { useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import EmployeeStatus from "../../components/user-management/EmployeeStatus";
import ApplicantsFrequency from "../../components/user-management/ApplicantsFrequency";
import LeaveMonthlyChart from "../../components/leave/LeaveMonthlyChart";
import ApplicantEmployeeExamGraph from "../../components/exam/ApplicantEmployeeExamGraph";

export default function Home() {
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
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <PageMeta
          title="TRuBank HRMS"
          description="TRuBank HRMS Admin Dashboard"
        />
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2">
          <EmployeeStatus />
          <ApplicantsFrequency />
        </div>
        <div className="space-y-6">
          <LeaveMonthlyChart />
          <ApplicantEmployeeExamGraph />
        </div>
      </div>
    </>
  );
}
