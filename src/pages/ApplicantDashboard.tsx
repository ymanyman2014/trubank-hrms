import React, { useEffect, useState } from "react";

import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ApplicantDashboard: React.FC = () => {
  const [showConfirmModal, setShowConfirmModal] = useState({
    open: false,
    message: "",
  });
  const [editModalError, setEditModalError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  //const [resumeUrl, setResumeUrl] = useState<string>("");
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  // Get applicant ID from local storage (replace with actual key if different)
  //const applicantId = localStorage.getItem("userId");

  useEffect(() => {
    // Get applicant ID from localStorage
    const applicantId = localStorage.getItem("userId");
    if (applicantId) {
      axios
        .get(`http://localhost:3001/api/employees/${applicantId}`)
        .then((res) => {
          if (res.data && Object.keys(res.data).length > 0) {
            setApplicant(res.data);
          } else {
            setApplicant(null);
          }
        })
        .catch(() => setApplicant(null));
    }
    // Fetch job openings from backend API
    axios
      .get("http://localhost:3001/api/job_opening/open")
      .then(async (res) => {
        if (Array.isArray(res.data)) {
          setJobOpenings(res.data);
          // Check which jobs are already applied
          if (applicantId) {
            const appliedIds: number[] = [];
            await Promise.all(
              res.data.map(async (job: any) => {
                try {
                  // Use exam_id for the check
                  const examId = job.exam_id;
                  const existsRes = await axios.get(
                    `http://localhost:3001/api/proctoring_event/exists/${applicantId}/${job.id}/${examId}`
                  );
                  if (existsRes.data && existsRes.data.id) {
                    appliedIds.push(job.id);
                  }
                } catch {}
              })
            );
            setAppliedJobIds(appliedIds);
          }
        } else {
          setJobOpenings([]);
        }
      })
      .catch(() => setJobOpenings([]));
    // Fetch applied jobs (proctoring events)
    if (applicantId) {
      axios
        .get(`http://localhost:3001/api/proctoring_event/${applicantId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            // Map proctoring events to applied job objects
            const jobs = res.data.map((ev) => ({
              job_id: ev.job_id,
              title: ev.title || "-",
              department: ev.department || "-",
              submitted: true,
              exam_status: ev.exam_status ?? "", // fetched from DB
              req_status: ev.req_status ?? "", // fetched from DB
              interview_status: ev.interview_status ?? "", // fetched from DB
              interview_date: ev.interview_date ?? "", // fetched from DB
              result: ev.result ?? "", // fetched from DB
              starting_date: ev.starting_date ?? null,
              job_status: ev.job_status,
              exam_type: ev.exam_type,
              exam_name: ev.exam_name,
              event_time: ev.event_time,
            }));
            setAppliedJobs(jobs);
          } else {
            setAppliedJobs([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching applied jobs:", error);
          setAppliedJobs([]);
        });
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="dark p-6 max-w-5xl mx-auto bg-gray-900 min-h-screen">
      {/* Personal Info Card - 2 columns flex 40:60 */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-stretch justify-center gap-8">
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 60% 40%, rgba(34,197,94,0.08) 0%, transparent 70%)",
            }}
          ></div>
          {/* Left column: Profile, name, email, number, address, update button */}
          <div
            className="flex flex-col items-center justify-center w-full md:w-[40%]"
            style={{ flex: "0 0 40%", maxWidth: "100%" }}
          >
            <div className="relative mb-4">
              <img
                src={
                  applicant?.profileImage || "/src/profile-image/default.jpg"
                }
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover border-4 border-green-400 shadow-lg z-10"
                style={{ boxShadow: "0 4px 24px rgba(34,197,94,0.15)" }}
              />
              <button
                className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-80 rounded-full p-2 shadow-lg hover:bg-green-500 transition-colors"
                style={{ zIndex: 20 }}
                title="Update Profile Image"
                onClick={() => setShowProfileModal(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7h.01M4 7h16M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2m-16 0v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7m-8 4a4 4 0 1 0 8 0 4 4 0 0 0-8 0z"
                  />
                </svg>
              </button>
              {/* Profile Image Change Modal */}
              {showProfileModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{
                    background: "rgba(41, 40, 40, 0.46)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 w-full max-w-lg relative">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                      onClick={() => {
                        setShowProfileModal(false);
                        setSelectedImage(null);
                        setPreviewUrl("");
                        setEditModalError("");
                      }}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
                      Change Profile Image
                    </h3>
                    <div className="flex flex-col items-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-40 h-40 rounded-full object-cover border-4 border-green-400 mb-6"
                        />
                      ) : (
                        <img
                          src={
                            applicant?.profileImage
                              ? applicant.profileImage
                              : "/src/profile-image/default.jpg"
                          }
                          alt={
                            applicant?.profileImage
                              ? "Current Profile"
                              : "Default Profile"
                          }
                          className="w-40 h-40 rounded-full object-cover border-4 border-green-400 mb-6"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="mb-6 bg-gray-100 text-gray-700 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedImage(file);
                          setEditModalError("");
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPreviewUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setPreviewUrl("");
                          }
                        }}
                      />
                      <div className="flex justify-end gap-4 w-full">
                        <button
                          className="px-6 py-2 rounded bg-gray-400 text-white font-semibold hover:bg-gray-500"
                          onClick={() => {
                            setShowProfileModal(false);
                            setSelectedImage(null);
                            setPreviewUrl("");
                            setEditModalError("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                          disabled={!selectedImage}
                          onClick={async () => {
                            if (!selectedImage) return;
                            const applicantId =
                              applicant?.id || localStorage.getItem("userId");
                            const formData = new FormData();
                            formData.append("profileImage", selectedImage);
                            setEditModalError("");
                            try {
                              const response = await axios.put(
                                `http://localhost:3001/api/applicant/${applicantId}/profile-image`,
                                formData,
                                {
                                  headers: {
                                    "Content-Type": "multipart/form-data",
                                  },
                                }
                              );
                              if (response.data && response.data.profileImage) {
                                // Add cache-busting query to force reload
                                const newImageUrl =
                                  response.data.profileImage +
                                  `?t=${Date.now()}`;
                                setApplicant((prev: any) => ({
                                  ...prev,
                                  profileImage: newImageUrl,
                                }));
                                setShowProfileModal(false);
                                setSelectedImage(null);
                                setPreviewUrl("");
                                setShowSuccessModal(true);
                              } else {
                                setEditModalError(
                                  "Failed to update profile image."
                                );
                              }
                            } catch (error) {
                              setEditModalError(
                                "Error updating profile image. Please check your connection and try again."
                              );
                            }
                          }}
                        >
                          Save Image
                        </button>
                      </div>
                      {editModalError && (
                        <div className="w-full text-center text-red-500 text-sm mt-4">
                          {editModalError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              {applicant?.firstname} {applicant?.lastname}
            </h2>
            <div className="text-base text-gray-300 font-medium mb-1">
              {applicant?.email}
            </div>
            {applicant?.contactNumber ? (
              <div className="text-base text-gray-300 font-medium mb-1">
                {applicant.contactNumber}
              </div>
            ) : null}
            {applicant?.address ? (
              <div className="text-base text-gray-300 font-medium mb-1">
                {applicant.address}
              </div>
            ) : null}
            <div className="mt-4">
              <div className="flex justify-center mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <button
                    className="hover:text-green-400 font-normal bg-transparent border-none p-0 cursor-pointer"
                    style={{ background: "none" }}
                    onClick={() => {
                      setEditData({
                        firstname: applicant?.firstname || "",
                        lastname: applicant?.lastname || "",
                        email: applicant?.email || "",
                        contactNumber: applicant?.contactNumber || "",
                        address: applicant?.address || "",
                        gender: applicant?.gender || "",
                        dateOfBirth: (() => {
                          const dob = applicant?.dateOfBirth;
                          if (!dob) return "";
                          let d = new Date(dob);
                          if (!isNaN(d.getTime())) {
                            // Convert to PST (UTC-8)
                            const pstDate = new Date(
                              d.getTime() -
                                d.getTimezoneOffset() * 60000 -
                                8 * 60 * 60000
                            );
                            return pstDate.toISOString().split("T")[0];
                          }
                          return "";
                        })(),
                        civilStatus: applicant?.civilStatus || "",
                        nationality: applicant?.nationality || "",
                        resumeUrl: applicant?.resumeUrl || "",
                        emergencyPerson: applicant?.emergencyPerson || "",
                        emergencyNumber: applicant?.emergencyNumber || "",
                        emergencyRelationship:
                          applicant?.emergencyRelationship || "",
                        sss: applicant?.sss || "",
                        tin: applicant?.tin || "",
                        pagibig: applicant?.pagibig || "",
                        philhealth: applicant?.philhealth || "",
                      });
                      setShowEditModal(true);
                    }}
                  >
                    Update Information
                  </button>
                  <span className="mx-1">|</span>
                  <button
                    className="hover:text-green-400 font-normal bg-transparent border-none p-0 cursor-pointer"
                    style={{ background: "none" }}
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Update Password
                  </button>
                  {/* Update Password Modal */}
                  {showPasswordModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      style={{
                        background: "rgba(41, 40, 40, 0.46)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md relative">
                        <button
                          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
                          onClick={() => {
                            setShowPasswordModal(false);
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmNewPassword: "",
                            });
                            setPasswordError("");
                          }}
                          aria-label="Close"
                        >
                          &times;
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
                          Update Password
                        </h3>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setPasswordError("");
                            setPasswordLoading(true);
                            const applicantId = localStorage.getItem("userId");
                            if (!applicantId) {
                              setPasswordError(
                                "User ID not found. Please log in again."
                              );
                              setPasswordLoading(false);
                              return;
                            }
                            if (
                              !passwordForm.currentPassword ||
                              !passwordForm.newPassword ||
                              !passwordForm.confirmNewPassword
                            ) {
                              setPasswordError("All fields are required.");
                              setPasswordLoading(false);
                              return;
                            }
                            if (
                              passwordForm.newPassword !==
                              passwordForm.confirmNewPassword
                            ) {
                              setPasswordError(
                                "New password and confirmation do not match."
                              );
                              setPasswordLoading(false);
                              return;
                            }
                            if (passwordForm.newPassword.length < 6) {
                              setPasswordError(
                                "New password must be at least 6 characters."
                              );
                              setPasswordLoading(false);
                              return;
                            }
                            try {
                              const response = await axios.put(
                                `http://localhost:3001/api/employees/${applicantId}/password`,
                                {
                                  currentPassword: passwordForm.currentPassword,
                                  newPassword: passwordForm.newPassword,
                                }
                              );
                              if (response.data && response.data.success) {
                                setShowPasswordModal(false);
                                setPasswordForm({
                                  currentPassword: "",
                                  newPassword: "",
                                  confirmNewPassword: "",
                                });
                                setPasswordError("");
                                setShowConfirmModal({
                                  open: true,
                                  message: "Password updated successfully.",
                                });
                              } else {
                                // Backend error: check for incorrect current password
                                if (
                                  response.data?.message
                                    ?.toLowerCase()
                                    .includes("current password is incorrect")
                                ) {
                                  setPasswordError(
                                    "Current password is incorrect."
                                  );
                                } else {
                                  setPasswordError(
                                    response.data?.message ||
                                      "Failed to update password."
                                  );
                                }
                              }
                            } catch (err) {
                              // Try to show backend error message if available
                              const error = err as any;
                              if (
                                error.response &&
                                error.response.data &&
                                error.response.data.message
                              ) {
                                if (
                                  typeof error.response.data.message ===
                                    "string" &&
                                  error.response.data.message
                                    .toLowerCase()
                                    .includes("current password is incorrect")
                                ) {
                                  setPasswordError(
                                    "Current password is incorrect."
                                  );
                                } else {
                                  setPasswordError(error.response.data.message);
                                }
                              } else if (error.message) {
                                setPasswordError(error.message);
                              } else {
                                setPasswordError("Failed to update password.");
                              }
                            }
                            setPasswordLoading(false);
                          }}
                          className="space-y-4"
                        >
                          <div className="relative">
                            <input
                              type={showPassword.current ? "text" : "password"}
                              className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm pr-10"
                              placeholder="Current Password"
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((f) => ({
                                  ...f,
                                  currentPassword: e.target.value,
                                }))
                              }
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-2 text-gray-400 hover:text-green-500"
                              tabIndex={-1}
                              onClick={() =>
                                setShowPassword((s) => ({
                                  ...s,
                                  current: !s.current,
                                }))
                              }
                              aria-label={
                                showPassword.current
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showPassword.current ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword.new ? "text" : "password"}
                              className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm pr-10"
                              placeholder="New Password"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm((f) => ({
                                  ...f,
                                  newPassword: e.target.value,
                                }))
                              }
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-2 text-gray-400 hover:text-green-500"
                              tabIndex={-1}
                              onClick={() =>
                                setShowPassword((s) => ({ ...s, new: !s.new }))
                              }
                              aria-label={
                                showPassword.new
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showPassword.new ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword.confirm ? "text" : "password"}
                              className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm pr-10"
                              placeholder="Confirm New Password"
                              value={passwordForm.confirmNewPassword}
                              onChange={(e) =>
                                setPasswordForm((f) => ({
                                  ...f,
                                  confirmNewPassword: e.target.value,
                                }))
                              }
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-2 text-gray-400 hover:text-green-500"
                              tabIndex={-1}
                              onClick={() =>
                                setShowPassword((s) => ({
                                  ...s,
                                  confirm: !s.confirm,
                                }))
                              }
                              aria-label={
                                showPassword.confirm
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showPassword.confirm ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          {passwordError && (
                            <div className="text-red-500 text-sm text-center mt-2">
                              {passwordError}
                            </div>
                          )}
                          <div className="flex justify-end gap-4 mt-4">
                            <button
                              type="button"
                              className="px-6 py-2 rounded bg-gray-400 text-white font-semibold hover:bg-gray-500"
                              onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordForm({
                                  currentPassword: "",
                                  newPassword: "",
                                  confirmNewPassword: "",
                                });
                                setPasswordError("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                              disabled={passwordLoading}
                            >
                              {passwordLoading
                                ? "Updating..."
                                : "Update Password"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  <span className="mx-1">|</span>
                  <button
                    className="hover:text-green-400 font-normal bg-transparent border-none p-0 cursor-pointer"
                    style={{ background: "none" }}
                    onClick={() => setShowLogoutModal(true)}
                  >
                    Logout
                  </button>
                  {/* Logout Confirmation Modal */}
                  {showLogoutModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      style={{
                        background: "rgba(41, 40, 40, 0.46)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-xs text-center relative">
                        <button
                          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
                          onClick={() => setShowLogoutModal(false)}
                          aria-label="Close"
                        >
                          &times;
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                          Confirm Logout
                        </h3>
                        <p className="mb-6 text-gray-700 dark:text-gray-200">
                          Are you sure you want to logout?
                        </p>
                        <div className="flex justify-center gap-4">
                          <button
                            className="px-6 py-2 rounded bg-gray-400 text-white font-semibold hover:bg-gray-500"
                            onClick={() => setShowLogoutModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                            onClick={() => {
                              localStorage.removeItem("userId");
                              window.location.href = "/";
                            }}
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Edit Information Modal */}
              {showEditModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{
                    background: "rgba(41, 40, 40, 0.46)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-full max-w-md relative">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
                      onClick={() => setShowEditModal(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white text-center">
                      Edit Profile Information
                    </h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setEditModalError("");
                        const applicantId = localStorage.getItem("userId");
                        if (!applicantId) {
                          setEditModalError(
                            "User ID not found. Please log in again."
                          );
                          return;
                        }
                        // Required fields
                        const requiredFields = [
                          "firstname",
                          "lastname",
                          "email",
                          "contactNumber",
                          "address",
                          "gender",
                          "dateOfBirth",
                          "civilStatus",
                          "nationality",
                          "emergencyPerson",
                          "emergencyNumber",
                          "emergencyRelationship",
                          "sss",
                          "tin",
                          "pagibig",
                          "philhealth",
                        ];
                        for (const field of requiredFields) {
                          if (
                            !editData[field] ||
                            String(editData[field]).trim() === ""
                          ) {
                            setEditModalError("All fields are required.");
                            return;
                          }
                        }
                        if (editData?.emailDuplicate === true) {
                          setEditModalError(
                            "Email already exists. Please use a different email."
                          );
                          return;
                        }
                        // Prepare FormData
                        const formData = new FormData();
                        formData.append("lastname", editData.lastname);
                        formData.append("firstname", editData.firstname);
                        formData.append("email", editData.email);
                        formData.append("address", editData.address);
                        formData.append(
                          "contactNumber",
                          editData.contactNumber
                        );
                        formData.append("gender", editData.gender);
                        // Always send dateOfBirth in yyyy-MM-dd format
                        if (
                          editData.dateOfBirth &&
                          editData.dateOfBirth !== ""
                        ) {
                          let dob = editData.dateOfBirth;
                          // If already yyyy-MM-dd, use as-is
                          if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                            formData.append("dateOfBirth", dob);
                          } else if (dob.includes("T")) {
                            const d = new Date(dob);
                            if (!isNaN(d.getTime())) {
                              // Convert to PST (UTC-8)
                              const utc = d.getTime();
                              const pst = utc - 8 * 60 * 60 * 1000;
                              const pstDate = new Date(pst);
                              formData.append(
                                "dateOfBirth",
                                pstDate.toISOString().split("T")[0]
                              );
                            }
                          }
                        }
                        formData.append("civilStatus", editData.civilStatus);
                        formData.append("nationality", editData.nationality);
                        formData.append(
                          "emergencyPerson",
                          editData.emergencyPerson
                        );
                        formData.append(
                          "emergencyNumber",
                          editData.emergencyNumber
                        );
                        formData.append(
                          "emergencyRelationship",
                          editData.emergencyRelationship
                        );
                        formData.append("sss", editData.sss);
                        formData.append("tin", editData.tin);
                        formData.append("pagibig", editData.pagibig);
                        formData.append("philhealth", editData.philhealth);
                        // Only append resume if a new file is attached and not null
                        if (
                          editData.resumeFile &&
                          editData.resumeFile instanceof File &&
                          editData.resumeFile.size > 0
                        ) {
                          formData.append("resume", editData.resumeFile);
                        }
                        try {
                          const response = await axios.put(
                            `http://localhost:3001/api/employees/${applicantId}/update-details`,
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            }
                          );
                          if (response.data && response.data.success) {
                            setShowEditModal(false);
                            // Optionally refresh applicant info
                            const refreshed = await axios.get(
                              `http://localhost:3001/api/employees/${applicantId}`
                            );
                            setApplicant(refreshed.data);
                            setShowConfirmModal({
                              open: true,
                              message:
                                "Profile information updated successfully.",
                            });
                          } else {
                            setEditModalError(
                              response.data?.error ||
                                "Failed to update profile information."
                            );
                          }
                          {
                            /* Confirmation Modal */
                          }
                          {
                            showConfirmModal.open && (
                              <div
                                className="fixed inset-0 z-50 flex items-center justify-center"
                                style={{
                                  background: "rgba(41, 40, 40, 0.46)",
                                  backdropFilter: "blur(8px)",
                                }}
                              >
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 w-full max-w-xs text-center relative">
                                  <button
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
                                    onClick={() =>
                                      setShowConfirmModal({
                                        open: false,
                                        message: "",
                                      })
                                    }
                                    aria-label="Close"
                                  >
                                    &times;
                                  </button>
                                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                    Success
                                  </h3>
                                  <p className="mb-6 text-gray-700 dark:text-gray-200">
                                    {showConfirmModal.message}
                                  </p>
                                  <button
                                    className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                                    onClick={() =>
                                      setShowConfirmModal({
                                        open: false,
                                        message: "",
                                      })
                                    }
                                  >
                                    OK
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        } catch (err) {
                          setEditModalError(
                            "Failed to update profile information."
                          );
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="First Name"
                          value={editData.firstname}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              firstname: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Last Name"
                          value={editData.lastname}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              lastname: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="email"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Email"
                          value={editData.email}
                          onChange={async (e) => {
                            const newEmail = e.target.value;
                            setEditData((d: any) => ({
                              ...d,
                              email: newEmail,
                            }));
                            setEditModalError("");
                            if (newEmail && newEmail !== applicant?.email) {
                              try {
                                const res = await axios.get(
                                  `http://localhost:3001/api/check-employee-email/${encodeURIComponent(
                                    newEmail
                                  )}`
                                );
                                setEditData((d: any) => ({
                                  ...d,
                                  emailDuplicate: res.data.exists === true,
                                }));
                              } catch {
                                setEditData((d: any) => ({
                                  ...d,
                                  emailDuplicate: false,
                                }));
                              }
                            } else {
                              setEditData((d: any) => ({
                                ...d,
                                emailDuplicate: undefined,
                              }));
                            }
                          }}
                        />
                        {/* Contact Number Input */}
                        <input
                          type="tel"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Contact Number (+63 9XX-XXX-XXXX)"
                          value={editData.contactNumber}
                          pattern="^(\+63\s?9\d{2}-\d{3}-\d{4})$"
                          maxLength={17}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d+ -]/g, "");
                            value = value
                              .replace(/^(\+63)?\s?/, "+63 ")
                              .replace(
                                /(\+63\s9\d{2})(\d{3})(\d{4})/,
                                "$1-$2-$3"
                              )
                              .replace(/-{2,}/g, "-")
                              .slice(0, 17);
                            setEditData((d: any) => ({
                              ...d,
                              contactNumber: value,
                            }));
                          }}
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Address"
                          value={editData.address}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              address: e.target.value,
                            }))
                          }
                        />
                        {/* Resume PDF Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Resume (PDF, max 5MB)
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setEditModalError("");
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                setEditModalError(
                                  "File size must be less than 5MB."
                                );
                                return;
                              }
                              setEditData((d: any) => ({
                                ...d,
                                resumeFile: file,
                              }));
                            }}
                          />
                          {/* Error message at bottom of modal */}
                          {editModalError && (
                            <div className="col-span-2 text-center mt-4">
                              <span className="text-red-500 text-sm font-semibold">
                                {editModalError}
                              </span>
                            </div>
                          )}
                          {editData.resumeUrl && (
                            <a
                              href={editData.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 underline text-xs mt-1 block"
                            >
                              View Uploaded Resume
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <select
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          value={editData.gender}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              gender: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {/* Use a date picker for birthday */}
                        <DatePicker
                          selected={
                            editData.dateOfBirth
                              ? new Date(editData.dateOfBirth)
                              : null
                          }
                          onChange={(date: Date | null) =>
                            setEditData((d: any) => ({
                              ...d,
                              dateOfBirth: date
                                ? date.toISOString().split("T")[0]
                                : "",
                            }))
                          }
                          dateFormat="yyyy-MM-dd"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholderText="Select Birthday"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                        />
                        <select
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          value={editData.civilStatus}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              civilStatus: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Civil Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                        <select
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          value={editData.nationality}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              nationality: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Nationality</option>
                          <option value="Filipino">Filipino</option>
                          <option value="American">American</option>
                          <option value="Chinese">Chinese</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Emergency Contact Name"
                          value={editData.emergencyPerson}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              emergencyPerson: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="tel"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Emergency Contact Number (+63 9XX-XXX-XXXX)"
                          value={editData.emergencyNumber}
                          pattern="^(\+63\s?9\d{2}-\d{3}-\d{4})$"
                          maxLength={17}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d+ -]/g, "");
                            value = value
                              .replace(/^(\+63)?\s?/, "+63 ")
                              .replace(
                                /(\+63\s9\d{2})(\d{3})(\d{4})/,
                                "$1-$2-$3"
                              )
                              .replace(/-{2,}/g, "-")
                              .slice(0, 17);
                            setEditData((d: any) => ({
                              ...d,
                              emergencyNumber: value,
                            }));
                          }}
                        />
                        <select
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          value={editData.emergencyRelationship}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              emergencyRelationship: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select Relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="SSS"
                          value={editData.sss}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              sss: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="TIN"
                          value={editData.tin}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              tin: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Pag-IBIG"
                          value={editData.pagibig}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              pagibig: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="PhilHealth"
                          value={editData.philhealth}
                          onChange={(e) =>
                            setEditData((d: any) => ({
                              ...d,
                              philhealth: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-2 flex justify-end mt-3">
                        <div className="flex flex-col w-full">
                          <button
                            type="submit"
                            className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                            disabled={(() => {
                              const requiredFields = [
                                "firstname",
                                "lastname",
                                "email",
                                "contactNumber",
                                "address",
                                "gender",
                                "dateOfBirth",
                                "civilStatus",
                                "nationality",
                                "emergencyPerson",
                                "emergencyNumber",
                                "emergencyRelationship",
                                "sss",
                                "tin",
                                "pagibig",
                                "philhealth",
                              ];
                              return (
                                requiredFields.some(
                                  (field) =>
                                    !editData[field] ||
                                    String(editData[field]).trim() === ""
                                ) || editData?.emailDuplicate === true
                              );
                            })()}
                          >
                            Save
                          </button>
                          {/* Error message always at the bottom of Save button */}
                          {(() => {
                            const requiredFields = [
                              "firstname",
                              "lastname",
                              "email",
                              "contactNumber",
                              "address",
                              "gender",
                              "dateOfBirth",
                              "civilStatus",
                              "nationality",
                              "emergencyPerson",
                              "emergencyNumber",
                              "emergencyRelationship",
                              "sss",
                              "tin",
                              "pagibig",
                              "philhealth",
                            ];
                            if (editModalError) {
                              return (
                                <div className="w-full text-center text-red-500 text-sm mt-2">
                                  {editModalError}
                                </div>
                              );
                            }
                            if (
                              requiredFields.some(
                                (field) =>
                                  !editData[field] ||
                                  String(editData[field]).trim() === ""
                              )
                            ) {
                              return (
                                <div className="w-full text-center text-red-500 text-sm mt-2">
                                  All fields are required.
                                </div>
                              );
                            }
                            if (editData?.emailDuplicate === true) {
                              return (
                                <div className="w-full text-center text-red-500 text-sm mt-2">
                                  Email already exists. Please use a different
                                  email.
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right column: Other info */}
          <div
            className="flex flex-col justify-center w-full md:w-[60%]"
            style={{ flex: "0 0 60%", maxWidth: "100%" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Other info */}
              <div className="space-y-3 text-sm">
                <div className="text-xl text-green-400 mb-4">
                  Personal Information
                </div>
                <div className="flex">
                  <span className="font-semibold w-32 text-left text-gray-200">
                    Gender:
                  </span>
                  <span className="text-gray-300">
                    {applicant?.gender || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32 text-left text-gray-200">
                    Birthday:
                  </span>
                  <span className="text-gray-300">
                    {applicant?.dateOfBirth ? (
                      applicant.dateOfBirth.split("T")[0]
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32 text-left text-gray-200">
                    Nationality:
                  </span>
                  <span className="text-gray-300">
                    {applicant?.nationality || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32 text-left text-gray-200">
                    Resume:
                  </span>
                  <span className="text-gray-300">
                    {applicant?.resume ? (
                      <a
                        href={applicant.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 underline"
                      >
                        View Resume
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Right: Emergency contact and National IDs */}
              <div className="space-y-3 text-sm">
                <div className="text-xl text-green-400 mb-4">
                  Emergency Contact
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">Name:</span>
                  <span className="text-gray-300">
                    {applicant?.emergencyPerson || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">Number:</span>
                  <span className="text-gray-300">
                    {applicant?.emergencyNumber || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex mb-2">
                  <span className="w-32 text-gray-200">Relationship:</span>
                  <span className="text-gray-300">
                    {applicant?.emergencyRelationship || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="text-xl text-green-400 mb-4 mt-6">
                  Financial / Employment Requirements
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">SSS:</span>
                  <span className="text-gray-300">
                    {applicant?.sss || <span className="text-gray-500">-</span>}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">TIN:</span>
                  <span className="text-gray-300">
                    {applicant?.tin || <span className="text-gray-500">-</span>}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">Pag-IBIG:</span>
                  <span className="text-gray-300">
                    {applicant?.pagibig || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-200">PhilHealth:</span>
                  <span className="text-gray-300">
                    {applicant?.philhealth || (
                      <span className="text-gray-500">-</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Openings Horizontal Slider */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-white mb-6">
          Job Openings
        </h3>
        <div className="flex items-center w-full">
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center mr-2"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            onClick={() => {
              const slider = document.getElementById("job-slider");
              if (slider) slider.scrollBy({ left: -300, behavior: "smooth" });
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div
            id="job-slider"
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth flex-1"
            style={{
              paddingTop: "16px", // Add top padding to prevent card clipping
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              ...(window.innerWidth < 768 ? { overflow: "hidden" } : {}),
            }}
          >
            {(Array.isArray(jobOpenings) ? jobOpenings : []).map((job) => (
              <div
                key={job.id}
                className={`min-w-[260px] rounded-lg shadow p-4 flex-shrink-0 border transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl cursor-pointer ${
                  appliedJobIds.includes(job.id)
                    ? "bg-gray-200 border-gray-300 hover:bg-gray-200"
                    : "bg-gray-800 border-gray-700 hover:border-green-400 hover:bg-gray-900"
                }`}
                style={{
                  willChange: "transform, box-shadow, border-color, background",
                }}
                onClick={() => setSelectedJob(job)}
              >
                <h4
                  className={`font-bold mb-1 transition-colors duration-300 ${
                    appliedJobIds.includes(job.id)
                      ? "text-gray-500"
                      : "text-green-400"
                  }`}
                >
                  {job.title}
                </h4>
                <div className="text-sm text-gray-300 mb-2 transition-colors duration-300">
                  {job.department}
                </div>
                <div className="text-xs text-gray-400 mb-2 transition-colors duration-300">
                  Posted: {job.posted_date?.split("T")[0]}
                </div>
                <div
                  className="text-xs text-gray-300 mb-2"
                  style={{
                    width: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    minHeight: "2.5em",
                  }}
                >
                  {job.description}
                </div>
              </div>
            ))}
          </div>
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center ml-2"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            onClick={() => {
              const slider = document.getElementById("job-slider");
              if (slider) slider.scrollBy({ left: 300, behavior: "smooth" });
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Applied Jobs List with Stepper */}
      <div>
        <h3 className="text-lg font-semibold mb-6 text-white">Applied Jobs</h3>
        {appliedJobs.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            No applied jobs found.
          </div>
        ) : (
          appliedJobs.map((job, idx) => {
            // Debug: log status fields for each job
            console.log("Applied Job Status:", {
              exam_status: job.exam_status,
              req_status: job.req_status,
              interview_status: job.interview_status,
              interview_date: job.interview_date,
              result: job.result,
            });
            // Step logic: only first 'Pending' step is in-progress, previous steps are done if status is Pass, Fail, or Scheduled (for interview)
            function normalizeStatus(val: string | undefined | null) {
              return (val || "").toLowerCase();
            }
            // Removed unused statusList variable
            // Treat 'Insufficient' as 'Fail' for requirements
            const isReqFail = ["fail", "insufficient"].includes(
              normalizeStatus(job.req_status)
            );
            const failIndex = isReqFail
              ? 2
              : ["fail"].includes(normalizeStatus(job.exam_status))
              ? 1
              : ["fail"].includes(normalizeStatus(job.interview_status))
              ? 3
              : ["fail"].includes(normalizeStatus(job.result))
              ? 4
              : -1;
            const stepStatus = [
              job.submitted,
              ["pass", "fail"].includes(normalizeStatus(job.exam_status)),
              ["pass", "fail", "insufficient"].includes(
                normalizeStatus(job.req_status)
              ),
              ["pass", "fail"].includes(normalizeStatus(job.interview_status)),
              ["pass", "fail"].includes(normalizeStatus(job.result)),
            ];
            let foundInProgress = false;
            const steps = [
              { label: "Submitted", done: stepStatus[0] },
              {
                label: "Exam Status",
                done: stepStatus[1],
                inprogress:
                  !stepStatus[1] &&
                  !foundInProgress &&
                  normalizeStatus(job.exam_status) === "pending"
                    ? (foundInProgress = true)
                    : false,
                value: job.exam_status || "Pending",
              },
              {
                label: "Requirements",
                done: stepStatus[2],
                inprogress:
                  !stepStatus[2] &&
                  !foundInProgress &&
                  normalizeStatus(job.req_status) === "pending"
                    ? (foundInProgress = true)
                    : false,
                value: ["insufficient", "fail"].includes(
                  normalizeStatus(job.req_status)
                )
                  ? "Fail"
                  : job.req_status || "Pending",
              },
              {
                label: "Interview Status",
                done: stepStatus[3],
                inprogress:
                  !stepStatus[3] &&
                  !foundInProgress &&
                  (normalizeStatus(job.interview_status) === "Pending" ||
                    normalizeStatus(job.interview_status) === "scheduled")
                    ? (foundInProgress = true)
                    : false,
                value: job.interview_status || "Pending",
              },
              {
                label: "Result",
                done: stepStatus[4],
                inprogress:
                  !stepStatus[4] &&
                  !foundInProgress &&
                  normalizeStatus(job.result) === "Pending"
                    ? (foundInProgress = true)
                    : false,
                value: job.result || "Pending",
              },
            ];
            // Find current step
            const currentStep = steps.findIndex((s) => s.inprogress);
            return (
              <div
                key={idx}
                className="mb-10 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-lg p-8 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-extrabold text-white tracking-wide">
                      {job.title}
                    </div>
                    <div className="text-sm text-green-400 font-semibold mt-1">
                      {job.department}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                    Applied: {job.submitted ? "Yes" : "No"}
                  </div>
                </div>
                {/* Stepper */}
                <div className="relative flex items-center justify-between w-full px-2 py-6">
                  {/* Progress stepper line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gray-700 rounded-full">
                    {/* Progress line: green up to failIndex, red after failIndex */}
                    {(() => {
                      const lastChecked = steps
                        .map((step, i) => (step.done ? i : null))
                        .filter((i) => i !== null)
                        .pop();
                      let percent = 0;
                      if (typeof lastChecked === "number") {
                        percent = ((lastChecked + 1) / steps.length) * 100;
                      }
                      if (
                        percent > 0 &&
                        (failIndex === -1 ||
                          (typeof lastChecked === "number" &&
                            lastChecked < failIndex))
                      ) {
                        return (
                          <div
                            className="absolute h-1 bg-green-400 rounded-full"
                            style={{
                              left: 0,
                              top: 0,
                              width: `${percent}%`,
                              transition: "width 0.4s",
                            }}
                          ></div>
                        );
                      }
                      // If failIndex is set, show green up to failIndex, red after
                      if (failIndex !== -1) {
                        const greenPercent = (failIndex / steps.length) * 100;
                        return (
                          <>
                            <div
                              className="absolute h-1 bg-green-400 rounded-full"
                              style={{
                                left: 0,
                                top: 0,
                                width: `${greenPercent}%`,
                                transition: "width 0.4s",
                              }}
                            ></div>
                            <div
                              className="absolute h-1 bg-red-500 rounded-full"
                              style={{
                                left: `${greenPercent}%`,
                                top: 0,
                                width: `${100 - greenPercent}%`,
                                transition: "width 0.4s",
                              }}
                            ></div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className="relative z-10 flex-1 flex flex-col items-center"
                    >
                      {/* Step icon: check for done, circle for current, outlined for upcoming, red X for failed */}
                      <div
                        className="w-7 h-7 flex items-center justify-center"
                        style={{ position: "relative", top: "24px" }}
                      >
                        {failIndex !== -1 && i >= failIndex ? (
                          // Red X icon for failed steps
                          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 6L14 14M6 14L14 6"
                                stroke="white"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : step.done ? (
                          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-400 text-white">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 10.5L9 14.5L15 7.5"
                                stroke="white"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : i === currentStep ? (
                          <span className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-blue-400 bg-gray-900">
                            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                          </span>
                        ) : (
                          <span className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-gray-600 bg-gray-900">
                            <span className="w-3 h-3 rounded-full bg-gray-700"></span>
                          </span>
                        )}
                      </div>
                      {/* Move label and status below the line using absolute positioning */}
                      <div
                        className="flex flex-col items-center"
                        style={{ marginTop: "72px" }}
                      >
                        <div
                          className={`mb-1 text-xs font-semibold ${
                            failIndex !== -1 && i >= failIndex
                              ? "text-red-500"
                              : step.done
                              ? "text-green-400"
                              : i === currentStep
                              ? "text-blue-400"
                              : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </div>
                        <div
                          className="text-xs mb-2 mt-1"
                          style={{
                            color:
                              failIndex !== -1 && i >= failIndex
                                ? "#ef4444"
                                : i === 2 && isReqFail
                                ? "#ef4444"
                                : (() => {
                                    let statusValue = "";
                                    if (i === 1) statusValue = job.exam_status;
                                    if (i === 2) statusValue = job.req_status;
                                    if (i === 3)
                                      statusValue = job.interview_status;
                                    if (i === 4) statusValue = job.result;
                                    if (typeof statusValue === "string") {
                                      const val = statusValue
                                        .trim()
                                        .toLowerCase();
                                      if (i === 3 && val === "scheduled")
                                        return "#3b82f6"; // Interview Status: blue if scheduled
                                      if (val === "pass") return "#22c55e"; // green
                                      if (val === "fail") return "#ef4444"; // red
                                      if (val === "pending" || val === "")
                                        return "#3b82f6"; // blue
                                      return "#3b82f6"; // blue for other values
                                    }
                                    return "#3b82f6";
                                  })(),
                          }}
                        >
                          {(() => {
                            if (i === 1) return job.exam_status || "Pending";
                            if (i === 2) return job.req_status || "Pending";
                            if (i === 3)
                              return job.interview_status || "Pending";
                            if (i === 4) return job.result || "Pending";
                            return "";
                          })()}
                        </div>
                        {/* Show Interview Date below Interview Status if scheduled */}
                        {step.label === "Interview Status" &&
                          normalizeStatus(job.interview_status) ===
                            "scheduled" &&
                          job.interview_date && (
                            <div className="text-xs mt-1 text-blue-400">
                              Interview Date: {job.interview_date}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Job Opening Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-5xl relative min-h-[420px] flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
              onClick={() => setSelectedJob(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Column 1: Job Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {selectedJob.title}
                </h3>
                <div className="mb-2 text-base text-gray-900 dark:text-gray-200">
                  <span className="font-semibold">Department:</span>{" "}
                  {selectedJob.department}
                </div>
                <div className="mb-6 text-sm text-gray-700 dark:text-gray-400">
                  <span className="font-semibold">Posted:</span>{" "}
                  {selectedJob.posted_date?.split("T")[0]}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Description
                </div>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-xs">
                  {selectedJob.description || (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
              {/* Column 2: Role & Responsibilities */}
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Role & Responsibilities
                </div>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-xs">
                  {selectedJob.role ? (
                    selectedJob.role
                      .split(/\n|\.\s+/)
                      .filter(Boolean)
                      .map((item: string, idx: number) => (
                        <li key={idx}>{item.trim()}</li>
                      ))
                  ) : (
                    <li className="text-gray-400">-</li>
                  )}
                </ul>
              </div>
              {/* Column 3: Requirements */}
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Requirements
                </div>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-xs">
                  {selectedJob.requirements ? (
                    selectedJob.requirements
                      .split(/\n|\.\s+/)
                      .filter(Boolean)
                      .map((item: string, idx: number) => (
                        <li key={idx}>{item.trim()}</li>
                      ))
                  ) : (
                    <li className="text-gray-400">-</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              {(() => {
                // Helper for selectedJob context
                const normalizeStatus = (val: string | undefined | null) =>
                  (val || "").toLowerCase();
                const reqFailed = ["fail", "insufficient"].includes(
                  normalizeStatus(selectedJob.req_status)
                );
                return (
                  <button
                    className={`px-6 py-2 rounded font-semibold ${
                      appliedJobIds.includes(selectedJob.id) || reqFailed
                        ? "bg-red-600 text-white cursor-not-allowed"
                        : "bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800"
                    }`}
                    disabled={
                      appliedJobIds.includes(selectedJob.id) || reqFailed
                    }
                    onClick={() => {
                      if (appliedJobIds.includes(selectedJob.id) || reqFailed)
                        return;
                      const userId = localStorage.getItem("userId");
                      const jobId = selectedJob?.id;
                      const examID = selectedJob?.exam_id;
                      if (userId && jobId) {
                        window.location.href = `/job-application/${userId}/${jobId}/${examID}`;
                      }
                    }}
                  >
                    {appliedJobIds.includes(selectedJob.id)
                      ? "Already Applied"
                      : reqFailed
                      ? "Cannot Proceed (Requirements Failed)"
                      : "Proceed with the application process"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Change Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 w-full max-w-xs text-center relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Profile Image Updated
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-200">
              Your profile image has been updated successfully.
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
      {/* Simple Footer */}
      <footer className="w-full mt-12 flex flex-col items-center">
        <hr className="max-w-4xl w-full border-t border-gray-300 dark:border-gray-700 mb-4" />
        <div className="text-center text-base text-gray-500 dark:text-gray-400 px-4 pb-6 max-w-4xl">
          This system was created solely for human resource management and has
          full authority to grant or revoke access without prior notice. All
          rights reserved ©2025 | TRUBANK
        </div>
      </footer>
    </div>
  );
};

export default ApplicantDashboard;
