import React, { useState, useEffect } from "react";
import axios from "axios";

const statusOptions = ["Active", "Inactive"];

const RefresherExam: React.FC = () => {
  // State for editing
  const [editMode, setEditMode] = useState(false);
  const [editExamIdx, setEditExamIdx] = useState<number | null>(null);
  // Helper to fetch refresher exams
  const fetchRefresherExams = () => {
    axios
      .get("http://localhost:3001/api/refresher_exam")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setExams(
            res.data.map((item: any) => ({
              id: item.id, // <-- store id
              department: item.department,
              exam: item.exam_name || item.exam || "",
              status: item.status,
            }))
          );
        } else {
          setExams([]);
        }
      })
      .catch(() => setExams([]));
  };

  useEffect(() => {
    fetchRefresherExams();
  }, []);
  const [search, setSearch] = useState("");
  const [exams, setExams] = useState<
    { id: string; department: string; exam: string; status: string }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedExam, setSelectedExam] = useState(""); // will store exam id
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [refresherExams, setRefresherExams] = useState<
    { id: string; name: string }[]
  >([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [departmentExistsError, setDepartmentExistsError] = useState("");
  const [checkingDepartment, setCheckingDepartment] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/refresher_exam")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setExams(
            res.data.map((item: any) => ({
              id: item.id,
              department: item.department,
              exam: item.exam_name || item.exam || "",
              status: item.status,
            }))
          );
        } else {
          setExams([]);
        }
      })
      .catch(() => setExams([]));
  }, []);

  useEffect(() => {
    if (showModal) {
      axios
        .get("http://localhost:3001/api/exam/refresher")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setRefresherExams(
              res.data.map((exam: any) => ({
                id: String(exam.id),
                name: exam.name,
              }))
            );
            setSelectedExam(res.data.length > 0 ? String(res.data[0].id) : "");
          } else {
            setRefresherExams([]);
            setSelectedExam("");
          }
        })
        .catch(() => {
          setRefresherExams([]);
          setSelectedExam("");
        });
      setDepartmentExistsError("");
    }
  }, [showModal]);

  // Fetch departments from employees API
  useEffect(() => {
    axios.get("http://localhost:3001/api/employees").then((res) => {
      if (Array.isArray(res.data)) {
        const uniqueDepartments = Array.from(
          new Set(res.data.map((emp: any) => emp.department).filter(Boolean))
        );
        setDepartments(uniqueDepartments);
        // Set default selected department if not editing
        if (uniqueDepartments.length > 0 && !editMode) {
          setSelectedDepartment(uniqueDepartments[0]);
        }
      }
    });
  }, [editMode]);

  const filteredExams = exams.filter(
    (exam) =>
      exam.department.toLowerCase().includes(search.toLowerCase()) ||
      exam.exam.toLowerCase().includes(search.toLowerCase())
  );

  const handleSetRefresherExam = async () => {
    setDepartmentExistsError("");
    setCheckingDepartment(true);
    try {
      if (!editMode) {
        // Add mode: Check if department exists first
        const checkRes = await axios.get(
          `http://localhost:3001/api/refresher_exam/department-exists/${encodeURIComponent(
            selectedDepartment
          )}`
        );
        if (checkRes.data && checkRes.data.exists) {
          setDepartmentExistsError(
            "This department already has a refresher exam set."
          );
          setCheckingDepartment(false);
          return;
        }
        await axios.post("http://localhost:3001/api/refresher_exam", {
          exam_id: selectedExam,
          department: selectedDepartment,
          status: selectedStatus,
        });
      } else {
        // Edit mode: update refresher exam
        // Use the correct API endpoint with refresher exam id
        const examRow = exams[editExamIdx ?? 0];
        await axios.put(
          `http://localhost:3001/api/refresher_exam/${encodeURIComponent(
            examRow.id
          )}`,
          {
            exam_id: selectedExam,
            department: selectedDepartment,
            status: selectedStatus,
          }
        );
      }
      setShowModal(false);
      setShowSuccessModal(true);
      setEditMode(false);
      setEditExamIdx(null);
      fetchRefresherExams(); // Refresh table data automatically
    } catch (error) {
      setShowModal(false);
      alert("Failed to add refresher exam. Please try again.");
    } finally {
      setCheckingDepartment(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-4">
      <div className="flex items-center justify-end mb-2">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Refresher Exam
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 rounded-md bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
            style={{ minWidth: "220px", boxShadow: "none" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="p-0 w-8 h-8 flex items-center justify-center rounded-md bg-transparent border-none text-gray-400 hover:text-green-400 focus:outline-none"
            title="Add Refresher Exam"
            style={{ boxShadow: "none" }}
            onClick={() => setShowModal(true)}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 20 20"
            >
              <path d="M10 4v12M4 10h12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Refresher Exam Management Table - Modern Dark Style */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wide">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wide">
                Exam
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No exams found.
                </td>
              </tr>
            ) : (
              filteredExams.map((exam, idx) => (
                <tr key={idx} className="hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">
                    {exam.department}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{exam.exam}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {exam.status}
                  </td>
                  <td className="px-4 py-3 text-sm flex gap-2 items-center">
                    <button
                      className="p-1 rounded hover:bg-gray-700"
                      title="Edit"
                      onClick={() => {
                        setEditMode(true);
                        setEditExamIdx(idx);
                        setShowModal(true);
                        setSelectedDepartment(exam.department);
                        setSelectedExam(exam.exam);
                        setSelectedStatus(exam.status);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 hover:text-white transition-colors"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for adding refresher exam */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {editMode ? "Edit Refresher Exam" : "Set Refresher Exam"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={selectedDepartment}
                onChange={(e) => {
                  if (!editMode) {
                    setSelectedDepartment(e.target.value);
                    setDepartmentExistsError("");
                  }
                }}
                disabled={editMode}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exam
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                disabled={refresherExams.length === 0}
              >
                {refresherExams.length === 0 ? (
                  <option value="" disabled>
                    No refresher exams found
                  </option>
                ) : (
                  refresherExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            {departmentExistsError && (
              <div className="mb-4 text-center">
                <span className="text-red-500 text-sm font-semibold">
                  {departmentExistsError}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowModal(false)}
                disabled={checkingDepartment}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={handleSetRefresherExam}
                disabled={checkingDepartment}
              >
                {checkingDepartment ? "Checking..." : "Set"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs text-center">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Refresher Exam Added
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-200">
              The refresher exam has been successfully added.
            </p>
            <button
              className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefresherExam;
