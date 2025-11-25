import { useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import ApplicantsTable from "../components/recruitment/ApplicantsTable";
import JobOpeningsList from "../components/recruitment/JobOpeningsList";

export default function RecruitmentPage() {
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
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <PageMeta
        title="TRuBank HRMS"
        description="TRuBank HRMS Admin Dashboard"
      />
      <JobOpeningsList />
      <ApplicantsTable />
    </div>
  );
}
