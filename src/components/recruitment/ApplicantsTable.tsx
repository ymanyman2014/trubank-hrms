import { useEffect, useState } from "react";
import "./ApplicantsTableScrollbar.css";
import axios from "axios";

export default function ApplicantsTable() {
  // State for Result modal dropdown
  const [resultStatus, setResultStatus] = useState<string>("");
  const [applicants, setApplicants] = useState<
    Array<{
      id: number;
      employee_id: number;
      employee_name: string;
      job_title: string;
      exam_status?: string;
      req_status?: string;
      interview_date?: string;
      interview_status?: string;
      result?: string;
    }>
  >([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(
    null
  );
  const [examAverage, setExamAverage] = useState<number | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<{
    dateOfBirth?: string;
    address?: string;
    email?: string;
    resume?: string;
    interview_date?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch applicants on mount
  useEffect(() => {
    async function fetchApplicants() {
      try {
        const res = await axios.get(
          "http://localhost:3001/api/proctoring_event"
        );
        if (Array.isArray(res.data)) {
          // For each applicant, fetch status from /api/proctoring_event/:id
          const applicantsWithStatus = await Promise.all(
            res.data.map(async (app) => {
              try {
                const statusRes = await axios.get(
                  `http://localhost:3001/api/proctoring_event/${app.id}`
                );
                const status = statusRes.data;
                if (status && typeof status === "object") {
                  return {
                    ...app,
                    exam_status: status.exam_status ?? app.exam_status,
                    req_status: status.req_status ?? app.req_status,
                    interview_status:
                      status.interview_status ?? app.interview_status,
                    interview_date: status.interview_date ?? app.interview_date,
                    result: status.result ?? app.result,
                  };
                }
                return app;
              } catch {
                return app;
              }
            })
          );
          setApplicants(applicantsWithStatus);
        } else {
          setApplicants([]);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch applicants");
        setLoading(false);
      }
    }
    fetchApplicants();
  }, []);

  // Fetch employee details when selectedApplicantId changes
  useEffect(() => {
    if (selectedApplicantId === null) {
      setEmployeeDetails(null);
      return;
    }
    // Find the applicant by proctoring_event.id
    const selectedApplicant = applicants.find(
      (a) => a.id === selectedApplicantId
    );
    if (!selectedApplicant || !selectedApplicant.employee_id) {
      setEmployeeDetails(null);
      return;
    }
    async function fetchEmployeeDetails() {
      if (!selectedApplicant) {
        setEmployeeDetails(null);
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:3001/api/employees/${selectedApplicant.employee_id}`
        );
        setEmployeeDetails(res.data);
      } catch (err) {
        setEmployeeDetails(null);
      }
    }
    fetchEmployeeDetails();
  }, [selectedApplicantId, applicants]);

  // Fetch exam results when selectedApplicantId changes
  useEffect(() => {
    if (selectedApplicantId === null) {
      setExamAverage(null);
      return;
    }
    const selectedApplicant = applicants.find(
      (a) => a.id === selectedApplicantId
    );
    if (selectedApplicant) {
      console.log("Selected Applicant ID:", selectedApplicant.id);
    }
    if (!selectedApplicant) {
      setExamAverage(null);
      return;
    }
    async function fetchExamAverage() {
      try {
        if (selectedApplicant) {
          const res = await axios.get(
            `http://localhost:3001/api/applicant-exam/average/${selectedApplicant.id}`
          );
          if (res.data && typeof res.data.average === "number") {
            setExamAverage(Math.round(res.data.average));
          } else {
            setExamAverage(null);
          }
        }
      } catch (err) {
        setExamAverage(null);
      }
    }
    async function fetchProgressStatus() {
      if (!selectedApplicant) {
        return;
      }
    }
    fetchExamAverage();
    fetchProgressStatus();
  }, [selectedApplicantId, applicants]);

  // Helper to update applicant status in DB
  async function updateApplicantStatus(
    field: string,
    value: string,
    extra?: any
  ) {
    const selectedApplicant = applicants.find(
      (a) => a.id === selectedApplicantId
    );
    if (!selectedApplicant) {
      alert("No applicant selected.");
      return;
    }
    const payload: any = { [field]: value };
    if (extra) Object.assign(payload, extra);
    console.log("Updating applicant status", {
      id: selectedApplicant.id,
      payload,
    });
    try {
      const response = await axios.put(
        `http://localhost:3001/api/proctoring_event/${selectedApplicant.id}`,
        payload
      );
      console.log("Update response:", response.data);
      // Refetch all applicants and their status after update
      setLoading(true);
      const res = await axios.get("http://localhost:3001/api/proctoring_event");
      if (Array.isArray(res.data)) {
        const applicantsWithStatus = await Promise.all(
          res.data.map(async (app) => {
            try {
              const statusRes = await axios.get(
                `http://localhost:3001/api/proctoring_event/${app.id}`
              );
              const status = statusRes.data;
              if (status && typeof status === "object") {
                return {
                  ...app,
                  exam_status: status.exam_status ?? app.exam_status,
                  req_status: status.req_status ?? app.req_status,
                  interview_status:
                    status.interview_status ?? app.interview_status,
                  interview_date: status.interview_date ?? app.interview_date,
                  result: status.result ?? app.result,
                };
              }
              return app;
            } catch {
              return app;
            }
          })
        );
        setApplicants(applicantsWithStatus);
      } else {
        setApplicants([]);
      }
      setLoading(false);
      alert("Status updated successfully.");
    } catch (err) {
      console.error("Update failed:", err);
      setLoading(false);
      alert("Failed to update status. See console for details.");
    }
  }
  // Helper to calculate age from dateOfBirth
  function getAge(dateOfBirth: string) {
    if (!dateOfBirth) return "";
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return "";
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  return (
    <>
      {/* Modals */}
      {showExamModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Update Exam Status
            </h3>
            {/* Modal content here */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Exam Status
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowExamModal(false)}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700${
                  !resultStatus ? " opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!resultStatus}
                onClick={async () => {
                  await updateApplicantStatus("exam_status", resultStatus);
                  setShowExamModal(false);
                  setResultStatus("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showRequirementsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Update Requirements Status
            </h3>
            {/* Modal content here */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Requirements Status
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Insufficient">Insufficient</option>
                <option value="Pass">Pass</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowRequirementsModal(false)}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700${
                  !resultStatus ? " opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!resultStatus}
                onClick={async () => {
                  await updateApplicantStatus("req_status", resultStatus);
                  setShowRequirementsModal(false);
                  setResultStatus("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showInterviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Update Interview Status
            </h3>
            {/* Modal content here */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Interview Status
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pass">Pass</option>
              </select>
            </div>
            {resultStatus === "Scheduled" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Interview Date
                </label>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-pointer"
                  required
                  value={employeeDetails?.interview_date || ""}
                  onChange={(e) =>
                    setEmployeeDetails((prev) => ({
                      ...prev,
                      interview_date: e.target.value,
                    }))
                  }
                  onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowInterviewModal(false)}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700${
                  !resultStatus ||
                  (resultStatus === "Scheduled" &&
                    !employeeDetails?.interview_date)
                    ? " opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  !resultStatus ||
                  (resultStatus === "Scheduled" &&
                    !employeeDetails?.interview_date)
                }
                onClick={async () => {
                  await updateApplicantStatus(
                    "interview_status",
                    resultStatus,
                    resultStatus === "Scheduled" &&
                      employeeDetails?.interview_date
                      ? { interview_date: employeeDetails.interview_date }
                      : undefined
                  );
                  setShowInterviewModal(false);
                  setResultStatus("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showResultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Update Result Status
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Result
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="Pass">Pass</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => {
                  setShowResultModal(false);
                  setResultStatus("");
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700${
                  !resultStatus ? " opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!resultStatus}
                onClick={async () => {
                  await updateApplicantStatus("result", resultStatus);
                  setShowResultModal(false);
                  setResultStatus("");
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main content */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-2 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Applicants
          </h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Column: Applicant List */}
          <div className="w-full md:w-1/2">
            <div className="flex flex-col gap-6 h-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 flex flex-col gap-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2 justify-between">
                  <span className="material-icons text-green-500">
                    Applicants List
                  </span>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Search applicants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ minWidth: 160 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {loading ? (
                    <div className="text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : applicants.length === 0 ? (
                    <div className="text-gray-400">No applicants found.</div>
                  ) : (
                    <ul className="space-y-2">
                      {applicants
                        .filter((applicant) => {
                          const result = applicant.result
                            ? applicant.result.toLowerCase()
                            : "";
                          return result !== "fail" && result !== "failed";
                        })
                        .filter(
                          (applicant) =>
                            applicant.employee_name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            applicant.job_title
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((applicant) => (
                          <li
                            key={applicant.id}
                            className={`bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-800 transition text-gray-900 dark:text-gray-200 ${
                              selectedApplicantId === applicant.id
                                ? "border-2 border-green-500"
                                : ""
                            }`}
                            onClick={() => setSelectedApplicantId(applicant.id)}
                          >
                            <div className="font-semibold text-base flex items-center gap-2">
                              {applicant.employee_name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {applicant.job_title}
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Personal Details and Application Progress */}
          <div className="w-full md:w-1/2 mt-4 md:mt-0">
            <div className="flex flex-col gap-6 h-full">
              {/* Personal Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 flex flex-col gap-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-green-500">
                    Personal Details
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-400">Age:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {employeeDetails?.dateOfBirth
                        ? getAge(employeeDetails.dateOfBirth)
                        : "[Select applicant]"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-400">Email:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {employeeDetails?.email || "[Select applicant]"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-400">
                      Address:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {employeeDetails?.address || "[Select applicant]"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-400">
                      description
                    </span>

                    {employeeDetails?.resume ? (
                      <a
                        href={employeeDetails.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 underline font-semibold"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300">
                        [Select applicant]
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Exam Results Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-green-500">
                    Exam Results
                  </span>
                </div>
                <div className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
                  {examAverage !== null
                    ? `Average Score: ${examAverage}%`
                    : "[Select applicant]"}
                </div>
              </div>
              {/* Application Progress Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-green-500">
                    {" "}
                    Application Progress Status
                  </span>
                </div>
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="py-2 px-3 text-left font-semibold text-gray-800 dark:text-white">
                          Stage
                        </th>
                        <th className="py-2 px-3 text-left font-semibold text-gray-800 dark:text-white">
                          Status
                        </th>
                        <th className="py-2 px-3 text-left font-semibold text-gray-800 dark:text-white">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-3 text-gray-800 dark:text-white">
                          <span>1</span>
                          <span className="ml-2">Application</span>
                        </td>
                        <td className="py-2 px-3 text-green-600 dark:text-green-200 font-semibold">
                          Completed
                        </td>
                        <td className="py-2 px-3"></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-gray-800 dark:text-white">
                          <span>2</span>
                          <span className="ml-2">Examination</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">
                            {(() => {
                              const selectedApplicant = applicants.find(
                                (a) => a.id === selectedApplicantId
                              );
                              const status = selectedApplicant?.exam_status;
                              return !status || status === "Pending"
                                ? "Pending"
                                : status;
                            })()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition${
                              selectedApplicantId === null
                                ? " opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              selectedApplicantId !== null &&
                              setShowExamModal(true)
                            }
                            disabled={selectedApplicantId === null}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-gray-800 dark:text-white">
                          <span>3</span>
                          <span className="ml-2">Requirements</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">
                            {(() => {
                              const selectedApplicant = applicants.find(
                                (a) => a.id === selectedApplicantId
                              );
                              const status = selectedApplicant?.req_status;
                              return !status || status === "Pending"
                                ? "Pending"
                                : status;
                            })()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition${
                              selectedApplicantId === null
                                ? " opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              selectedApplicantId !== null &&
                              setShowRequirementsModal(true)
                            }
                            disabled={selectedApplicantId === null}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-gray-800 dark:text-white">
                          <span>4</span>
                          <span className="ml-2">Interview</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">
                            {(() => {
                              const selectedApplicant = applicants.find(
                                (a) => a.id === selectedApplicantId
                              );
                              if (selectedApplicant?.interview_date) {
                                const status =
                                  selectedApplicant.interview_status;
                                return !status || status === "Pending"
                                  ? "Scheduled"
                                  : status;
                              }
                              return "Pending";
                            })()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Date:{" "}
                            {(() => {
                              const selectedApplicant = applicants.find(
                                (a) => a.id === selectedApplicantId
                              );
                              return selectedApplicant?.interview_date
                                ? selectedApplicant.interview_date
                                : "-";
                            })()}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition${
                              selectedApplicantId === null
                                ? " opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              selectedApplicantId !== null &&
                              setShowInterviewModal(true)
                            }
                            disabled={selectedApplicantId === null}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-gray-800 dark:text-white">
                          <span>5</span>
                          <span className="ml-2">Result</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">
                            {(() => {
                              const selectedApplicant = applicants.find(
                                (a) => a.id === selectedApplicantId
                              );
                              const status = selectedApplicant?.result;
                              return !status || status === "Pending"
                                ? "Pending"
                                : status;
                            })()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition${
                              selectedApplicantId === null
                                ? " opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              selectedApplicantId !== null &&
                              setShowResultModal(true)
                            }
                            disabled={selectedApplicantId === null}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
