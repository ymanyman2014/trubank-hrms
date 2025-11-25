function renderMessageWithLinks(message: string) {
  if (!message) return null;
  // Regex to match URLs (http/https or www.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = message.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Add protocol if missing
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  ChatBox,
  ChatButton,
  ChatMessage,
} from "../components/chat/ChatComponents";

function getUserId() {
  return Number(localStorage.getItem("userId"));
}

// Get user_id from localStorage (parsed as number)
const user_id = getUserId();

interface User {
  id: number;
  idNumber: string;
  email: string;
  firstname: string;
  lastname: string;
  department: string;
  position: string;
  dateHired: string;
  role: string;
  status: string;
  profileImage?: string;
  leave_balance?: number;
  address?: string;
  contactNumber?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  gender?: string;
  nationality?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  tin?: string;
  emergencyPerson?: string;
  emergencyNumber?: string;
  emergencyRelationship?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function EmployeeHome() {
  // Socket.IO client for real-time updates
  const socket = io("http://localhost:3001");

  useEffect(() => {
    // Real-time Announcements
    socket.on("newAnnouncement", (announcement) => {
      // Map backend announcement to expected shape
      const mapped = {
        from: announcement.title || "",
        message: announcement.content || announcement.title || "",
        date: announcement.created_at
          ? announcement.created_at.slice(0, 10)
          : "",
      };
      setAnnouncements((prev) => [mapped, ...prev]);
    });

    // Real-time Leave Requests
    socket.on("leaveRequestChanged", (leaveRequest) => {
      setUserLeaveRequests((prev) => {
        // Update or add the leave request in the table
        const idx = prev.findIndex((lr) => lr.id === leaveRequest.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = leaveRequest;
          return updated;
        }
        return [leaveRequest, ...prev];
      });
    });

    return () => {
      socket.off("newAnnouncement");
      socket.off("leaveRequestChanged");
    };
  }, []);
  // Helper: Check if user has enough leave balance for the request
  function hasEnoughLeaveBalance(type: string, days: number, balances: any) {
    if (type.toLowerCase() === "sick") return balances.sick >= days;
    if (type.toLowerCase() === "vacation") return balances.vacation >= days;
    if (type.toLowerCase() === "leave without pay")
      return balances.lwop >= days;
    // For Maternity/Paternity, skip check (or always allow)
    return true;
  }
  // Show/hide password toggle
  const [showPassword, setShowPassword] = useState(false);
  // State for password change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  // Helper: Calculate leave balances from leave records
  function getLeaveBalances(leaves: any[]) {
    const maxDays = 12;
    let sickUsed = 0,
      vacationUsed = 0,
      lwopUsed = 0;
    for (const l of leaves) {
      // Only count if status is not 'Pending'
      const status = (l.status || "").toLowerCase();
      if (status === "pending") continue;
      // Calculate days for each leave
      let days = 1;
      const start = new Date(l.start_date || l.date_start);
      const end = new Date(
        l.end_date || l.date_end || l.start_date || l.date_start
      );
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        days =
          Math.floor(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;
        if (days < 1) days = 1;
      }
      if ((l.leave_type || "").toLowerCase().includes("sick")) sickUsed += days;
      else if ((l.leave_type || "").toLowerCase().includes("vacation"))
        vacationUsed += days;
      else if ((l.leave_type || "").toLowerCase().includes("without pay"))
        lwopUsed += days;
    }
    return {
      sick: Math.max(0, maxDays - sickUsed),
      vacation: Math.max(0, maxDays - vacationUsed),
      lwop: Math.max(0, maxDays - lwopUsed),
      maxDays,
      sickUsed,
      vacationUsed,
      lwopUsed,
    };
  }
  // Session check and redirect on mount
  const navigateTo = (path: string) => {
    window.location.replace(path);
  };
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId) {
      navigateTo("/");
    } else if (role === "admin") {
      navigateTo("/admin");
    } else if (role !== "employee" && role !== "hr") {
      navigateTo("/");
    }
  }, []);
  // Always fetch leave requests for user_id on mount
  // (Handled in main useEffect below)
  // Leave Request Table: use a distinct variable
  const [userLeaveRequests, setUserLeaveRequests] = useState<any[]>([]);
  const [userLeaveRequestsLoading, setUserLeaveRequestsLoading] =
    useState(true);

  // Fetch leave requests for the current user and selected year
  const fetchUserLeaveRequests = async (employeeId: number, year: number) => {
    setUserLeaveRequestsLoading(true);
    try {
      const axios = (await import("axios")).default;
      const res = await axios.get(
        `http://localhost:3001/api/leaves/${employeeId}/${year}`
      );
      setUserLeaveRequests(res.data);
    } catch (err: any) {
      setUserLeaveRequests([]);
      // Show a user-friendly message if no leave data found
      if (err.response && err.response.status === 404) {
        setUserLeaveRequests([
          { error: `No leave data found for year ${year}.` },
        ]);
      } else {
        setUserLeaveRequests([{ error: "Error fetching leave data." }]);
      }
    } finally {
      setUserLeaveRequestsLoading(false);
    }
  };
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<any | null>(null);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Format date to YYYY-MM-DD only
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteSuccessModalOpen, setDeleteSuccessModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>({
    id: user_id,
    idNumber: String(user_id),
    email: "",
    firstname: "",
    lastname: "",
    department: "admin",
    position: "",
    dateHired: "",
    role: "",
    status: "",
    profileImage: "",
  });
  // Logout modal state
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  // Eligibility modal state for leave request
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  const today = new Date();
  const [selectedDept, setSelectedDept] = useState("");
  const [, setDepartments] = useState<string[]>([]);
  const [leaves2, setLeaves2] = useState<any[]>([]); // Used for calendar only

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Get user id for chat
  const accountId = user?.id ?? user_id;

  // Send message to API and get response
  const handleChatSend = async (message: string) => {
    setChatMessages((msgs) => [...msgs, { sender: "user", text: message }]);
    setChatLoading(true);
    try {
      const axios = (await import("axios")).default;
      const res = await axios.post("http://localhost:3001/api/chatbot", {
        message,
        user_id: accountId,
      });
      setChatMessages((msgs) => [
        ...msgs,
        {
          sender: "bot",
          text: res.data.reply || "Thank you for your message!",
        },
      ]);
    } catch (err) {
      setChatMessages((msgs) => [
        ...msgs,
        {
          sender: "bot",
          text: "Sorry, there was a problem. Please try again later.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  function isEmployedMoreThanYear(dateHired?: string): boolean {
    if (!dateHired) return false;
    const hiredDate = new Date(dateHired);
    if (isNaN(hiredDate.getTime())) return false;
    const now = new Date();
    const diffYears =
      (now.getTime() - hiredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears >= 1;
  }

  useEffect(() => {
    (async () => {
      try {
        const axios = (await import("axios")).default;
        const res = await axios.get("http://localhost:3001/api/departments");
        setDepartments(res.data);
        if (res.data.length > 0) setSelectedDept(res.data[0]);
      } catch {
        setDepartments([]);
      }
    })();
  }, []);

  // Reload user info when localStorage userId changes
  const [leaveBalanceYear, setLeaveBalanceYear] = useState(today.getFullYear());
  useEffect(() => {
    const fetchUserInfo = async (id: number) => {
      try {
        const axios = (await import("axios")).default;
        const res = await axios.get(
          `http://localhost:3001/api/employees/${id}`
        );
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    const userId = Number(localStorage.getItem("userId"));
    if (userId) {
      fetchUserInfo(userId);
      fetchUserLeaveRequests(userId, leaveBalanceYear);
    }
    // Listen for localStorage changes (from other tabs/windows)
    const handleStorageChange = () => {
      const newUserId = Number(localStorage.getItem("userId"));
      if (newUserId) {
        fetchUserInfo(newUserId);
        fetchUserLeaveRequests(newUserId, leaveBalanceYear);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [leaveBalanceYear]);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // Removed erroneous error handling code that referenced 'err'.
  // Password change error handling is already managed inside the form's onSubmit handler.

  // Get first day of month (0=Sun, 6=Sat)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
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

  // Set selectedDept to user's department when user is loaded
  useEffect(() => {
    if (user && user.department) {
      setSelectedDept(user.department);
    }
  }, [user]);

  // Fetch department leaves and set leaves2 for calendar
  useEffect(() => {
    if (!selectedDept) return;
    (async () => {
      try {
        const axios = (await import("axios")).default;
        const res = await axios.get(
          `http://localhost:3001/api/leaves/department/${encodeURIComponent(
            selectedDept
          )}`
        );
        setLeaves2(res.data);
      } catch {
        setLeaves2([]);
      }
    })();
  }, [selectedDept]);

  useEffect(() => {
    function onLoadHandler() {
      async function fetchUserAndDepartmentLeaves() {
        try {
          const axios = (await import("axios")).default;
          const res = await axios.get(
            `http://localhost:3001/api/employees/${user_id}`
          );
          setUser(res.data);
        } catch (err) {
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
      fetchUserAndDepartmentLeaves();
      // Fetch leave requests for the current user (employee_id = user.id)
      fetchUserLeaveRequests(user_id, leaveBalanceYear);
    }
    window.addEventListener("load", onLoadHandler);
    return () => {
      window.removeEventListener("load", onLoadHandler);
    };
  }, []);

  function handleAnnouncementClick(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedAnnouncement(null);
  }

  function openLeaveModal() {
    setLeaveModalOpen(true);
  }
  function closeLeaveModal() {
    setLeaveModalOpen(false);
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setRemarks("");
  }

  interface Announcement {
    from: string;
    message: string;
    date: string;
  }
  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements for user's department
  useEffect(() => {
    if (user && user.department) {
      (async () => {
        try {
          const axios = (await import("axios")).default;
          const res = await axios.get(
            `http://localhost:3001/api/announcements/receiver/${encodeURIComponent(
              user.department
            )}`
          );
          const data = res.data;
          // Map API data to Announcement[] shape
          const mapped = Array.isArray(data)
            ? data.map((a: any) => ({
                from: a.title || "",
                message: a.content || a.title || "",
                date: a.created_at ? a.created_at.slice(0, 10) : "",
              }))
            : [];
          setAnnouncements(mapped);
        } catch {
          setAnnouncements([]);
        }
      })();
    }
  }, [user]);

  // Download Leave Ledger PDF for current user
  const [downloadingLedger, setDownloadingLedger] = useState(false);
  async function handleDownloadLeaveLedger() {
    setDownloadingLedger(true);
    try {
      const axios = (await import("axios")).default;
      const response = await axios.get(
        `http://localhost:3001/api/leave-ledger/${user_id}/${leaveBalanceYear}`,
        { responseType: "blob" }
      );
      if (response && response.data) {
        // Create a blob and download
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
      setDownloadingLedger(false);
    }
  }

  // Insufficient leave warning state
  const [insufficientLeaveWarning, setInsufficientLeaveWarning] = useState<{
    show: boolean;
    type: string;
    left: number;
    requested: number;
  }>({ show: false, type: "", left: 0, requested: 0 });

  // Refresher Exam button state
  const [refresherEnabled, setRefresherEnabled] = useState(false);
  // Refresher Exam ID state
  const [refresherExamId, setRefresherExamId] = useState<string | null>(null);
  useEffect(() => {
    async function checkRefresherEligibilityAndFetchExamId() {
      if (!user || !user.department || !user.id) {
        setRefresherEnabled(false);
        setRefresherExamId(null);
        return;
      }
      const axios = (await import("axios")).default;
      const currentYear = new Date().getFullYear();
      try {
        // 1. Check if department exam is active (returns boolean)
        const activeRes = await axios.get(
          `http://localhost:3001/api/refresher_exam/is-active/${encodeURIComponent(
            user.department
          )}`
        );
        // 2. Check if user has proctoring event for current year (returns boolean)
        const existsRes = await axios.get(
          `http://localhost:3001/api/proctoring_event/exists-year/${user.id}/${currentYear}`
        );
        // 3. Fetch refresher exam id for department
        let examId = null;
        try {
          const examIdRes = await axios.get(
            `http://localhost:3001/api/refresher_exam/exam_id/${encodeURIComponent(
              user.department
            )}`
          );
          examId = examIdRes.data?.exam_id ?? null;
        } catch (err) {
          examId = null;
        }
        setRefresherExamId(examId);
        // Enable only if first is true and second is false and examId exists
        setRefresherEnabled(
          Boolean(activeRes.data) === true &&
            Boolean(existsRes.data) === false &&
            !!examId
        );
      } catch {
        setRefresherEnabled(false);
        setRefresherExamId(null);
      }
    }
    checkRefresherEligibilityAndFetchExamId();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden py-12 px-4">
      {/* ...existing code... */}
      <div className="max-w-6xl mx-auto flex flex-col">
        {/* Top Row: Account Info & Announcements */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-x-10 gap-y-12 auto-rows-min mb-8">
          {/* Account Information (left) */}
          <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 60% 40%, rgba(34,197,94,0.08) 0%, transparent 70%)",
              }}
            ></div>

            <div className="flex flex-col items-center mb-4 w-full">
              <h2 className="text-xl font-bold mb-10 text-green-700 dark:text-green-400">
                Account Information
              </h2>

              <div
                className="w-36 h-36 rounded-full overflow-hidden border-4 border-green-400 shadow-lg mb-4 z-10 flex items-center justify-center"
                style={{ boxShadow: "0 4px 24px rgba(34,197,94,0.15)" }}
              >
                <img
                  src={
                    user?.profileImage || "/src/profile-image/default-user.png"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {user?.firstname} {user?.lastname}
                </div>
                <div className="text-base text-gray-500 dark:text-gray-300 mb-2">
                  {user?.position} | {user?.department}
                </div>
                <div className="text-base text-gray-400 dark:text-gray-500 mb-1">
                  ID: TRU-{user?.idNumber}
                </div>
                <div className="text-base text-gray-400 dark:text-gray-500">
                  Email: {user?.email}
                </div>
                <div className="mt-2 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="px-10 py-2 rounded-full bg-green-500 hover:bg-green-400 text-white font-semibold shadow transition duration-150"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    More Information
                  </button>
                  <button
                    type="button"
                    className={`px-10 py-2 rounded-full bg-gray-500 hover:bg-gray-400 text-white font-semibold shadow transition duration-150 ${
                      !refresherEnabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (refresherEnabled && refresherExamId) {
                        window.location.href = `/job-application/${user_id}/0/${refresherExamId}`;
                      }
                    }}
                    disabled={!refresherEnabled || !refresherExamId}
                  >
                    Refresher Exam
                  </button>
                </div>
                {profileModalOpen && user && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                      background: "rgba(41, 40, 40, 0.46)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center relative border border-gray-200 dark:border-gray-700 scrollbar-thin"
                      style={{
                        maxHeight: "90vh",
                        overflowY: "auto",
                        scrollbarColor: "#22c55e #222",
                        scrollbarWidth: "thin",
                      }}
                    >
                      <h3 className="text-2xl font-bold mb-6 text-green-700 dark:text-green-400">
                        Profile Information
                      </h3>
                      <div className="flex flex-col gap-2 w-full items-center">
                        {/* Section 1: Profile Box with Picture */}
                        <div
                          className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 border border-b border-gray-200 dark:border-gray-700 min-w-[220px] w-full mb-6"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottomWidth: "1px",
                            borderBottomStyle: "solid",
                            borderBottomColor: "rgba(156,163,175,0.18)",
                          }}
                        >
                          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full shadow mb-3 border border-gray-300 dark:border-gray-600">
                            <img
                              src={
                                user.profileImage ||
                                "/src/profile-image/default-user.png"
                              }
                              alt="Profile"
                              className="w-28 h-28 rounded-full object-cover"
                            />
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-base text-gray-500 dark:text-gray-300 mb-1">
                            {user.position} | {user.department}
                          </div>
                          <div className="text-base text-gray-400 dark:text-gray-500 mb-1">
                            ID: TRU-{user.idNumber}
                          </div>
                          <div className="text-base text-gray-400 dark:text-gray-500">
                            Email: {user.email}
                          </div>
                        </div>
                        {/* Section 2: Additional Information */}
                        <div
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 border border-b border-gray-200 dark:border-gray-700 w-full mb-6"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottomWidth: "1px",
                            borderBottomStyle: "solid",
                            borderBottomColor: "rgba(156,163,175,0.18)",
                          }}
                        >
                          <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">
                            Additional Information
                          </h4>
                          <div className="grid grid-cols-1 gap-y-4">
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Date Hired:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.dateHired
                                  ? new Date(user.dateHired).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )
                                  : "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Address:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.address || "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Contact Number:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.contactNumber
                                  ? `(+63) ${user.contactNumber.replace(
                                      /^(\+63)?\s?/,
                                      ""
                                    )}`
                                  : "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Date of Birth:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.dateOfBirth
                                  ? new Date(
                                      user.dateOfBirth
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Civil Status:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.civilStatus || "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Gender:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.gender || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Nationality:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.nationality || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Section 3: Contributions */}
                        <div
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 border border-b border-gray-200 dark:border-gray-700 w-full mb-6"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottomWidth: "1px",
                            borderBottomStyle: "solid",
                            borderBottomColor: "rgba(156,163,175,0.18)",
                          }}
                        >
                          <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">
                            Contributions
                          </h4>
                          <div className="grid grid-cols-1 gap-y-4">
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                SSS:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.sss || "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                PhilHealth:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.philhealth || "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Pag-IBIG:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.pagibig || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                TIN:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.tin || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Section 4: Emergency Contact */}
                        <div
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 border border-b border-gray-200 dark:border-gray-700 w-full"
                          style={{
                            borderTop: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottomWidth: "1px",
                            borderBottomStyle: "solid",
                            borderBottomColor: "rgba(156,163,175,0.18)",
                          }}
                        >
                          <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">
                            Emergency Contact
                          </h4>
                          <div className="grid grid-cols-1 gap-y-4">
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Emergency Contact:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.emergencyPerson || "-"}
                              </span>
                            </div>
                            <div
                              className="pb-2"
                              style={{
                                borderBottom:
                                  "1px solid rgba(156,163,175,0.18)",
                              }}
                            >
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Emergency Number:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.emergencyNumber
                                  ? `(+63) ${user.emergencyNumber.replace(
                                      /^(\+63)?\s?/,
                                      ""
                                    )}`
                                  : "-"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Relationship:
                              </span>{" "}
                              <span className="text-gray-900 dark:text-white">
                                {user.emergencyRelationship || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="mt-8 px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                        onClick={() => setProfileModalOpen(false)}
                        type="button"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="my-6" />
            {loading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            ) : user ? (
              <form
                className="w-full flex flex-col gap-4 items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPasswordChangeError("");
                  setPasswordChangeSuccess("");
                  if (!oldPassword || !newPassword || !confirmNewPassword) {
                    setPasswordChangeError("All fields are required.");
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    setPasswordChangeError(
                      "New password and confirm password do not match."
                    );
                    return;
                  }
                  try {
                    const axios = (await import("axios")).default;
                    const res = await axios.put(
                      `http://localhost:3001/api/employees/${user_id}/password`,
                      {
                        currentPassword: oldPassword,
                        newPassword,
                      }
                    );
                    if (res.data && res.data.success) {
                      setPasswordChangeSuccess(
                        "Password updated successfully."
                      );
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                    } else {
                      if (res.data && res.data.message) {
                        setPasswordChangeError(res.data.message);
                      } else {
                        setPasswordChangeError("Failed to update password.");
                      }
                    }
                  } catch (err) {
                    if (
                      typeof err === "object" &&
                      err !== null &&
                      "response" in err &&
                      (err as any).response &&
                      (err as any).response.data &&
                      (err as any).response.data.message
                    ) {
                      setPasswordChangeError(
                        (err as any).response.data.message
                      );
                    } else {
                      setPasswordChangeError("Error updating password.");
                    }
                  }
                }}
              >
                <div className="relative w-full mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-4 py-3 w-full text-base pr-12"
                    placeholder="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 text-sm px-2 py-1 rounded focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative w-full mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-4 py-3 w-full text-base pr-12"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 text-sm px-2 py-1 rounded focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative w-full mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-4 py-3 w-full text-base pr-12"
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 text-sm px-2 py-1 rounded focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordChangeError && (
                  <div className="text-red-500 text-sm text-center w-full">
                    {passwordChangeError}
                  </div>
                )}
                {passwordChangeSuccess && (
                  <div className="text-green-600 text-sm text-center w-full">
                    {passwordChangeSuccess}
                  </div>
                )}
                <div className="flex gap-2 w-full">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow mt-2 w-full text-base"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-lg bg-gray-400 text-white font-bold hover:bg-gray-500 shadow mt-2 w-full text-base"
                    onClick={() => setLogoutModalOpen(true)}
                  >
                    Logout
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-red-500 bg-gray-900 rounded p-2 text-center">
                Failed to load user data.
              </div>
            )}
            {/* Extra space at the bottom of account section */}
            <div className="pb-6" />
          </section>
          {/* Announcements (right) */}
          <div className="flex flex-col gap-4">
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center min-h-[220px] border border-gray-200 dark:border-gray-700 mb-6">
              <h2 className="text-xl font-bold mb-6 text-green-700 dark:text-green-400">
                Announcements
              </h2>
              <ul
                className="w-full flex flex-col gap-3 max-h-64 overflow-y-auto scrollbar-thin"
                style={{
                  scrollbarColor: "#22c55e #222",
                  scrollbarWidth: "thin",
                }}
              >
                {announcements.slice(0, 5).map((a, idx) => (
                  <li
                    key={idx}
                    className="flex items-center cursor-pointer transition rounded list-none hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-3"
                    onClick={() => handleAnnouncementClick(a)}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 mr-4">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {a.from}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {renderMessageWithLinks(a.message)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {a.date}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            {/* Leave Balance KPI Section under Announcements */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 pb-8 flex flex-col items-center min-h-[120px] border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between w-full mb-6">
                <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
                  Leave Balance
                </h2>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="leave-balance-year"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Year:
                  </label>
                  <select
                    id="leave-balance-year"
                    className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                    value={leaveBalanceYear}
                    onChange={async (e) => {
                      const selectedYear = Number(e.target.value);
                      setLeaveBalanceYear(selectedYear);
                      // Fetch and log leave data for the selected year
                      const axios = (await import("axios")).default;
                      try {
                        const res = await axios.get(
                          `http://localhost:3001/api/leaves/${user_id}/${selectedYear}`
                        );
                        console.log(
                          "Leave data for year",
                          selectedYear,
                          res.data
                        );
                      } catch (err) {
                        console.log(
                          "Error fetching leave data for year",
                          selectedYear,
                          err
                        );
                      }
                    }}
                  >
                    {Array.from(
                      { length: 6 },
                      (_, i) => today.getFullYear() - i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-full max-w-md">
                {(() => {
                  const balances = getLeaveBalances(userLeaveRequests);
                  return (
                    <>
                      <div className="mb-4 text-base text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          Available Leave:
                        </span>
                        <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
                          {balances.sick + balances.vacation + balances.lwop}{" "}
                          days
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (Sick, Vacation, LWOP max 12 days each)
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-200">
                              Sick Leave
                            </span>
                            <span className="font-bold text-green-600">
                              {balances.sick} days left
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
                            <div
                              className="bg-red-500 h-4 rounded"
                              style={{
                                width: `${
                                  (balances.sick / balances.maxDays) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-200">
                              Vacation Leave
                            </span>
                            <span className="font-bold text-green-600">
                              {balances.vacation} days left
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
                            <div
                              className="bg-green-400 h-4 rounded"
                              style={{
                                width: `${
                                  (balances.vacation / balances.maxDays) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-200">
                              Leave Without Pay
                            </span>
                            <span className="font-bold text-green-600">
                              {balances.lwop} days left
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
                            <div
                              className="bg-blue-400 h-4 rounded"
                              style={{
                                width: `${
                                  (balances.lwop / balances.maxDays) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {/* Download Leave Ledger Button */}
                      <div className="w-full flex justify-center mt-8">
                        <button
                          className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow text-base flex items-center justify-center"
                          onClick={handleDownloadLeaveLedger}
                          disabled={downloadingLedger}
                        >
                          {downloadingLedger ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                ></path>
                              </svg>
                              Generating PDF...
                            </>
                          ) : (
                            "Download Leave Ledger"
                          )}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </section>
          </div>
        </div>
        {/* Department Calendar & Leave Request: full width, stacked */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center min-h-[220px] border border-gray-200 dark:border-gray-700 w-full mb-8">
          <h2 className="text-xl font-bold mb-6 text-green-700 dark:text-green-400">
            Department Calendar
          </h2>
          <div className="text-gray-700 dark:text-gray-300 text-base mb-3">
            Upcoming leaves and schedules for your department.
          </div>
          <div className="w-full">
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
              {calendarCells.map((cell, idx) => {
                // Build date string for lookup
                const dateStr =
                  `${viewYear}-` +
                  String(viewMonth + 1).padStart(2, "0") +
                  `-` +
                  String(cell).padStart(2, "0");
                // Find leaves for this date from leaves2
                const leavesForDay = leaves2.filter((l) => {
                  const start = new Date(l.start_date || l.date_start);
                  const end = new Date(
                    l.end_date || l.date_end || l.start_date || l.date_start
                  );
                  const d = new Date(dateStr);
                  return d >= start && d <= end;
                });
                return (
                  <div
                    key={idx}
                    className="min-h-[60px] bg-gray-50 dark:bg-white/[0.03] rounded-none p-1 flex flex-col items-center justify-start border border-gray-300 dark:border-gray-700"
                  >
                    {cell && (
                      <>
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                          {cell}
                        </div>
                        {leavesForDay.map((leave: any, i: number) => {
                          let bgColor = "bg-gray-400";
                          const type = leave.leave_type || leave.type || "";
                          if (type.toLowerCase().includes("sick"))
                            bgColor = "bg-red-600";
                          else if (type.toLowerCase().includes("vacation"))
                            bgColor = "bg-green-600";
                          else if (
                            type.toLowerCase().includes("maternity") ||
                            type.toLowerCase().includes("paternity")
                          )
                            bgColor = "bg-gray-400";
                          else if (type.toLowerCase().includes("without pay"))
                            bgColor = "bg-blue-600";
                          // Show employee name or fallback
                          const name =
                            leave.employee_name ||
                            leave.name ||
                            leave.firstname ||
                            leave.lastname ||
                            "Employee";
                          return (
                            <div
                              key={i}
                              className={`w-full flex items-center justify-center text-[10px] font-medium rounded-md px-1 py-0.5 mb-1 text-white ${bgColor}`}
                            >
                              {name}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center min-h-[220px] border border-gray-200 dark:border-gray-700 w-full mb-6">
          <div className="flex items-center justify-between w-full mb-6">
            <h2 className="text-lg font-bold text-green-400 dark:text-green-400">
              Leave Request
            </h2>
            <button
              type="button"
              className="ml-4 p-0 bg-transparent border-none outline-none flex items-center group"
              aria-label="Add Leave Request"
              onClick={() => {
                if (!isEmployedMoreThanYear(user?.dateHired)) {
                  setShowEligibilityModal(true);
                } else {
                  openLeaveModal();
                }
              }}
              disabled={false}
              title={
                !isEmployedMoreThanYear(user?.dateHired)
                  ? "Leave provision is for employees with over one year of service."
                  : "Add Leave Request"
              }
            >
              {/* Eligibility Modal */}
              {typeof showEligibilityModal !== "undefined" &&
                showEligibilityModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                      background: "rgba(41, 40, 40, 0.46)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      style={{
                        background: "rgba(41, 40, 40, 0.46)",
                        backdropFilter: "blur(6px)",
                      }}
                      onClick={() => setShowEligibilityModal(false)}
                    >
                      <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-lg font-bold mb-4 text-yellow-700 dark:text-yellow-400">
                          Not Eligible for Leave
                        </h3>
                        <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                          Leave provision is only available for employees with
                          over one year of service.
                        </div>
                        <button
                          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                          onClick={() => setShowEligibilityModal(false)}
                          type="button"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors group-hover:stroke-green-500"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <div
              className="w-full scrollbar-thin" // Tailwind scrollbar-thin for slim scrollbar
              style={{
                maxHeight: "420px", // approx. 10 rows
                overflowY: "auto",
                borderRadius: "0.75rem",
                background: "inherit",
                scrollbarColor: "#22c55e #222", // green thumb, dark track
                scrollbarWidth: "thin",
              }}
            >
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      DATE
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      TYPE
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      REASON
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      STATUS
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      CREDIT
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      REMARKS
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-semibold">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Display userLeaveRequests data, ordered by id desc, fetched from /api/leaves/:user.id */}
                  {userLeaveRequestsLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-3 text-center text-gray-500 dark:text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : userLeaveRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-3 text-center text-gray-500 dark:text-gray-400"
                      >
                        No leave records found.
                      </td>
                    </tr>
                  ) : (
                    userLeaveRequests
                      .sort((a, b) => b.id - a.id)
                      .map((leave) => {
                        // Format date to YYYY-MM-DD only
                        const formatDate = (dateStr: string) => {
                          if (!dateStr) return "";
                          return dateStr.split("T")[0];
                        };
                        // Always show start - end date
                        let dateDisplay = `${formatDate(
                          leave.start_date
                        )} - ${formatDate(leave.end_date)}`;
                        // Status color logic
                        let statusColor = "text-red-500";
                        if (
                          leave.status === "Approved" ||
                          leave.status === "Accepted"
                        )
                          statusColor = "text-green-500";
                        else if (leave.status === "Pending")
                          statusColor = "text-yellow-400";

                        // Credit calculation: only for accepted status
                        let credit = "-";
                        if ((leave.status || "").toLowerCase() === "accepted") {
                          const start = new Date(
                            leave.start_date || leave.date_start
                          );
                          const end = new Date(
                            leave.end_date ||
                              leave.date_end ||
                              leave.start_date ||
                              leave.date_start
                          );
                          if (
                            !isNaN(start.getTime()) &&
                            !isNaN(end.getTime())
                          ) {
                            // Inclusive of both start and end date
                            const diffDays =
                              Math.floor(
                                (end.getTime() - start.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) + 1;
                            credit = diffDays > 0 ? diffDays.toString() : "1";
                          } else {
                            credit = "1";
                          }
                        }

                        return (
                          <tr key={leave.id}>
                            <td className="py-2 text-white dark:text-white font-medium text-xs">
                              {dateDisplay}
                            </td>
                            <td className="py-2 text-white dark:text-white text-xs">
                              {leave.leave_type}
                            </td>
                            <td className="py-2 text-white dark:text-white text-xs">
                              {leave.reason || leave.remarks || "-"}
                            </td>
                            <td
                              className={`py-2 font-bold text-xs ${statusColor}`}
                            >
                              {leave.status}
                            </td>
                            <td className="py-2 text-white dark:text-white text-xs">
                              {credit}
                            </td>
                            <td className="py-2 text-white dark:text-white text-xs">
                              {leave.remarks}
                            </td>
                            <td className="py-2 text-white dark:text-white text-xs">
                              {leave.status === "Pending" && (
                                <button
                                  className="px-3 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 text-sm"
                                  onClick={() => {
                                    setLeaveToDelete(leave);
                                    setConfirmDeleteOpen(true);
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-white dark:text-white">
              Confirm Logout
            </h3>
            <div className="mb-4 text-white dark:text-white text-center">
              Are you sure you want to logout?
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={() => {
                  localStorage.removeItem("userId");
                  localStorage.removeItem("role");
                  setLogoutModalOpen(false);
                  setLogoutSuccess(true);
                  setTimeout(() => {
                    window.location.reload();
                  }, 1200);
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Logout Success Modal */}
      {logoutSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
              Logged Out
            </h3>
            <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
              You have been successfully logged out.
            </div>
          </div>
        </div>
      )}
      {/* Floating Chatbox */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen ? (
          <ChatBox
            messages={chatMessages}
            onSend={(msgObj) => {
              if (msgObj.sender === "user") {
                handleChatSend(msgObj.text);
              } else {
                setChatMessages((msgs) => [...msgs, msgObj]);
              }
            }}
            loading={chatLoading}
            onMinimize={() => setChatOpen(false)}
            userId={accountId}
          />
        ) : (
          <ChatButton onClick={() => setChatOpen(true)} />
        )}
      </div>
      {modalOpen && selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Announcement Details
            </h3>
            <div className="mb-2 text-gray-700 dark:text-gray-200">
              <span className="font-semibold">From:</span>{" "}
              {selectedAnnouncement.from}
            </div>
            <div className="mb-2 text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Message:</span>{" "}
              {renderMessageWithLinks(selectedAnnouncement.message)}
            </div>
            <div className="mb-4 text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Date:</span>{" "}
              {selectedAnnouncement.date}
            </div>
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

      {/* Confirmation Modal for Deleting Leave */}
      {confirmDeleteOpen && leaveToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-red-700 dark:text-red-400">
              Cancel Leave Request?
            </h3>
            <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
              Are you sure you want to cancel this leave request?
              <br />
              This action cannot be undone.
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setLeaveToDelete(null);
                }}
              >
                No
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={async () => {
                  // Delete leave request
                  try {
                    const axios = (await import("axios")).default;
                    await axios.delete(
                      `http://localhost:3001/api/leaves/${leaveToDelete.id}`
                    );
                    setConfirmDeleteOpen(false);
                    setLeaveToDelete(null);
                    await fetchUserLeaveRequests(user_id, leaveBalanceYear);
                    setDeleteSuccessModalOpen(true);
                  } catch (err) {
                    alert("Error cancelling leave request.");
                  }
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {leaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Request Leave
            </h3>
            <form
              className="w-full flex flex-col gap-4 items-center"
              onSubmit={async (e) => {
                e.preventDefault();
                let errorMsg = "";
                const today = new Date();
                const start = new Date(startDate);
                const end = new Date(endDate);
                // Calculate requested days (inclusive)
                let requestedDays = 1;
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  requestedDays =
                    Math.floor(
                      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1;
                  if (requestedDays < 1) requestedDays = 1;
                }
                // Vacation/Leave Without Pay: must be filed 5 days in advance
                if (["Vacation", "Leave Without Pay"].includes(leaveType)) {
                  const minDate = new Date(today);
                  minDate.setDate(today.getDate() + 5);
                  if (start < minDate) {
                    errorMsg = `You must file ${leaveType} leave at least 5 days in advance.`;
                  }
                }
                // Sick: can be filed up to 5 days late
                else if (leaveType === "Sick") {
                  const maxLateDate = new Date(today);
                  maxLateDate.setDate(today.getDate() - 5);
                  if (start < maxLateDate) {
                    errorMsg =
                      "Sick leave can only be filed up to 5 days late.";
                  }
                }
                // Maternity/Paternity: must be filed 15 days in advance, max 105 days duration
                if (leaveType === "Maternity/Paternity") {
                  const minDate = new Date(today);
                  minDate.setDate(today.getDate() + 15);
                  if (start < minDate) {
                    errorMsg =
                      "You must file Maternity/Paternity leave at least 15 days in advance.";
                  }
                  if (endDate && startDate) {
                    const diffDays = Math.ceil(
                      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (diffDays > 105) {
                      errorMsg =
                        "Maternity/Paternity leave cannot exceed 105 days.";
                    }
                  }
                }
                // Check leave balance before submitting
                const balances = getLeaveBalances(userLeaveRequests);
                if (
                  !hasEnoughLeaveBalance(leaveType, requestedDays, balances)
                ) {
                  // Map leaveType to correct key
                  let key = "";
                  if (leaveType.toLowerCase() === "sick") key = "sick";
                  else if (leaveType.toLowerCase() === "vacation")
                    key = "vacation";
                  else if (leaveType.toLowerCase() === "leave without pay")
                    key = "lwop";
                  const left = key ? balances[key as keyof typeof balances] : 0;
                  setInsufficientLeaveWarning({
                    show: true,
                    type: leaveType,
                    left,
                    requested: requestedDays,
                  });
                  return;
                } else {
                  setInsufficientLeaveWarning({
                    show: false,
                    type: "",
                    left: 0,
                    requested: 0,
                  });
                }
                if (errorMsg) {
                  alert(errorMsg);
                  return;
                }
                const payload: any = {
                  employee_id: leaveType === "Sick" ? getUserId() : user_id,
                  leave_type: leaveType,
                  start_date: formatDate(startDate),
                  end_date: formatDate(endDate),
                  reason: remarks,
                };
                try {
                  const axios = (await import("axios")).default;
                  await axios.post("http://localhost:3001/api/leaves", payload);
                  setSuccessModalOpen(true);
                  closeLeaveModal();
                  await fetchUserLeaveRequests(user_id, leaveBalanceYear);
                } catch (err) {
                  alert("Error submitting leave request.");
                }
              }}
            >
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="Sick">Sick</option>
                <option value="Vacation">Vacation</option>
                <option value="Leave Without Pay">Leave Without Pay</option>
                <option value="Maternity/Paternity">Maternity/Paternity</option>
              </select>
              <input
                type="date"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 cursor-pointer"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={(() => {
                  if (["Vacation", "Leave Without Pay"].includes(leaveType)) {
                    const d = new Date();
                    d.setDate(d.getDate() + 5);
                    return d.toISOString().split("T")[0];
                  } else if (leaveType === "Maternity/Paternity") {
                    const d = new Date();
                    d.setDate(d.getDate() + 15);
                    return d.toISOString().split("T")[0];
                  }
                  // Sick leave: allow any date
                  return undefined;
                })()}
                max={(() => {
                  if (leaveType === "Sick") {
                    const d = new Date();
                    return d.toISOString().split("T")[0];
                  }
                  return undefined;
                })()}
                onClick={(e) =>
                  e.currentTarget.showPicker && e.currentTarget.showPicker()
                }
              />
              <input
                type="date"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 cursor-pointer"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);

                  // Check leave balance when end date changes
                  const start = new Date(startDate);
                  const end = new Date(e.target.value);
                  let requestedDays = 1;
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    requestedDays =
                      Math.floor(
                        (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1;
                    if (requestedDays < 1) requestedDays = 1;
                  }
                  const balances = getLeaveBalances(userLeaveRequests);
                  if (
                    !hasEnoughLeaveBalance(leaveType, requestedDays, balances)
                  ) {
                    // Map leaveType to correct key
                    let key = "";
                    if (leaveType.toLowerCase() === "sick") key = "sick";
                    else if (leaveType.toLowerCase() === "vacation")
                      key = "vacation";
                    else if (leaveType.toLowerCase() === "leave without pay")
                      key = "lwop";
                    const left = key
                      ? balances[key as keyof typeof balances]
                      : 0;
                    setInsufficientLeaveWarning({
                      show: true,
                      type: leaveType,
                      left,
                      requested: requestedDays,
                    });
                  } else {
                    setInsufficientLeaveWarning({
                      show: false,
                      type: "",
                      left: 0,
                      requested: 0,
                    });
                  }
                }}
                required
                min={startDate || undefined}
                placeholder="End Date"
                onClick={(e) =>
                  e.currentTarget.showPicker && e.currentTarget.showPicker()
                }
              />
              {/* Insufficient leave warning below remarks */}
              <textarea
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                rows={3}
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
              />
              {insufficientLeaveWarning.show && (
                <div className="w-full text-red-600 text-sm text-center mb-2">
                  You do not have enough{" "}
                  <span className="font-semibold">
                    {insufficientLeaveWarning.type}
                  </span>{" "}
                  leave.
                  <br />
                  <span className="font-semibold">Available:</span>{" "}
                  {insufficientLeaveWarning.left} days
                  <br />
                  <span className="font-semibold">Requested:</span>{" "}
                  {insufficientLeaveWarning.requested} days
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={closeLeaveModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {successModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
              Leave Request Submitted!
            </h3>
            <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
              Your leave request has been successfully submitted.
            </div>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
              onClick={() => setSuccessModalOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {deleteSuccessModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
              Leave Request Cancelled
            </h3>
            <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
              The leave request has been successfully cancelled.
            </div>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
              onClick={() => setDeleteSuccessModalOpen(false)}
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
}
