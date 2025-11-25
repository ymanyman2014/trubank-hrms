//import React from "react";
import CreateExam from "../components/exam/CreateExam";
import RefresherExam from "../components/exam/RefresherExam";
import RefresherExamResults from "../components/exam/RefresherExamResults";
import PageMeta from "../components/common/PageMeta";
import { useEffect } from "react";

const ExamManagement = () => {
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
    <div className="space-y-6">
      <PageMeta
        title="TRuBank HRMS"
        description="TRuBank HRMS Admin Dashboard"
      />
      <CreateExam />
      {/* Refresher Exam Section */}
      <RefresherExam />
      {/* Refresher Exam Results Section */}
      <RefresherExamResults />
    </div>
  );
};

export default ExamManagement;
