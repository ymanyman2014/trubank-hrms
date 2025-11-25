import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/react-datepicker-float.css";
import axios from "axios";
import ComponentCard from "../common/ComponentCard";

type Employee = {
  id: number;
  idNumber: string;
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  department: string;
  position: string;
  dateHired: string;
  role: string;
  status: string;
  profileImage: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  address: string;
  contactNumber: string;
  emergencyPerson: string;
  emergencyNumber: string;
  emergencyRelationship: string;
  tin: string;
  sss: string;
  philhealth: string;
  pagibig: string;
  psaBirthCert: string;
};

const UserList = () => {
  // Add User form submit handler
  const [addUserLoading, setAddUserLoading] = useState(false);
  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddUserLoading(true);
    const errors: typeof addUserErrors = {
      email: "",
      dateOfBirth: "",
      contactNumber: "",
      idNumber: "",
    };

    // 1. Check password match
    if (newUser.password !== newUser.confirmPassword) {
      errors.idNumber = "Passwords do not match.";
    }

    // 2. Check id number and email using existing functions
    if (checkIdNumberExists(newUser.idNumber)) {
      errors.idNumber = "ID number already exists.";
    }
    if (!validateEmail(newUser.email)) {
      errors.email = "Invalid email format.";
    }
    if (
      employees.some(
        (emp) => emp.email.toLowerCase() === newUser.email.toLowerCase()
      )
    ) {
      errors.email = "Email already exists.";
    }
    if (!validateDate(newUser.dateOfBirth)) {
      errors.dateOfBirth = "Invalid birth date.";
    }
    if (!validatePhone(newUser.contactNumber)) {
      errors.contactNumber = "Invalid contact number.";
    }

    setAddUserErrors(errors);
    if (
      errors.email ||
      errors.dateOfBirth ||
      errors.contactNumber ||
      errors.idNumber
    ) {
      setAddUserLoading(false);
      return;
    }

    // 3. Insert into database using POST /api/employees
    const formData = new FormData();
    // Append all fields from newUser except confirmPassword
    Object.entries(newUser).forEach(([key, value]) => {
      if (key !== "confirmPassword") {
        formData.append(key, value);
      }
    });
    // Profile image
    const profileImageInput = document.getElementById(
      "profileImageInput"
    ) as HTMLInputElement | null;
    if (
      profileImageInput &&
      profileImageInput.files &&
      profileImageInput.files[0]
    ) {
      formData.append("profileImage", profileImageInput.files[0]);
    }

    try {
      await axios.post("http://localhost:3001/api/employees", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Refetch employees after successful add
      const res = await axios.get("http://localhost:3001/api/employees");
      const data = res.data;
      setEmployees(Array.isArray(data) ? data : []);
      setShowModal(false);
      setShowSuccessModal(true);
      setNewUser({
        idNumber: "",
        lastname: "",
        firstname: "",
        email: "",
        password: "",
        department: "",
        position: "",
        dateHired: today,
        role: "Employee",
        status: "Active",
        profileImage: "",
        created_at: "",
        updated_at: "",
        created_by: "system",
        dateOfBirth: "",
        gender: "",
        civilStatus: "",
        nationality: "",
        address: "",
        contactNumber: "",
        emergencyPerson: "",
        emergencyNumber: "",
        emergencyRelationship: "",
        tin: "",
        sss: "",
        philhealth: "",
        pagibig: "",
        psaBirthCert: "",
        confirmPassword: "",
      });
      setProfileImage(null);
    } catch (err) {
      console.error("Add user error:", err);
      setShowErrorModal(true);
    } finally {
      setAddUserLoading(false);
    }
  };
  // CSV download handler
  const handleDownloadCSV = () => {
    const exportDate = new Date().toISOString().slice(0, 10);
    const headers = [
      "ID Number",
      "Last Name",
      "First Name",
      "Email",
      "Department",
      "Position",
      "Date Hired",
      "Role",
      "Status",
      "Date Exported",
    ];
    // Filtered employees (same as table)
    const filtered = employees
      .filter((emp) => {
        const q = search.toLowerCase();
        return (
          emp.lastname?.toLowerCase().includes(q) ||
          emp.firstname?.toLowerCase().includes(q) ||
          emp.email?.toLowerCase().includes(q) ||
          emp.department?.toLowerCase().includes(q) ||
          emp.position?.toLowerCase().includes(q) ||
          emp.role?.toLowerCase().includes(q) ||
          emp.status?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.id - a.id);
    const rows = filtered.map((emp) => [
      emp.idNumber ?? "",
      emp.lastname ?? "",
      emp.firstname ?? "",
      emp.email ?? "",
      emp.department ?? "",
      emp.position ?? "",
      emp.dateHired
        ? new Date(emp.dateHired).toISOString().substring(0, 10)
        : "",
      emp.role ?? "",
      emp.status ?? "",
      exportDate,
    ]);
    let csvContent = "";
    csvContent += headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent +=
        row
          .map(
            (field) =>
              '"' +
              (field != null ? String(field).replace(/"/g, '""') : "") +
              '"'
          )
          .join(",") + "\n";
    });
    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `user-list-${exportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/employees")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          setEmployees([]);
          console.error("API did not return an array:", data);
        }
      })
      .catch((err) => {
        setEmployees([]);
        console.error("Error fetching employees:", err);
      });
  }, []);
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  // Helper to generate next idNumber in TRU-XXXXX format
  function getNextIdNumber(employees: Employee[]): string {
    const maxNum = employees
      .map((emp) => {
        // Accept only plain number (no TRU- prefix)
        if (!emp.idNumber) return 0;
        const match = String(emp.idNumber).match(/^\d{5}$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    const nextNum = maxNum + 1;
    return nextNum.toString().padStart(5, "0");
  }

  const [newUser, setNewUser] = useState({
    idNumber: "",
    lastname: "",
    firstname: "",
    email: "",
    password: "",
    department: "",
    position: "",
    dateHired: today,
    role: "Employee",
    status: "Active",
    profileImage: "",
    created_at: "",
    updated_at: "",
    created_by: "system",
    dateOfBirth: "",
    gender: "",
    civilStatus: "",
    nationality: "",
    address: "",
    contactNumber: "",
    emergencyPerson: "",
    emergencyNumber: "",
    emergencyRelationship: "",
    tin: "",
    sss: "",
    philhealth: "",
    pagibig: "",
    psaBirthCert: "",
    confirmPassword: "", // Only for frontend validation
  });

  // Validation state for Add User modal
  const [addUserErrors, setAddUserErrors] = useState({
    email: "",
    dateOfBirth: "",
    contactNumber: "",
    idNumber: "",
  });
  const [emailExists, setEmailExists] = useState(false);
  const [idNumberExists, setIdNumberExists] = useState(false);

  // Checks if email exists in employees list
  async function checkEmailExists(email: string): Promise<boolean> {
    return employees.some(
      (emp) => emp.email.toLowerCase() === email.toLowerCase()
    );
  }

  function checkIdNumberExists(idNumber: string): boolean {
    // Check for plain 5-digit number only
    return employees.some((emp) => emp.idNumber === idNumber);
  }

  // Validation functions
  function validateEmail(email: string) {
    // Stricter RFC-like email validation
    // 1. No consecutive dots, no leading/trailing dot, valid domain
    // 2. Local part: letters, digits, . _ -
    // 3. Domain: letters, digits, - and at least one dot
    if (!email) return false;
    // No consecutive dots
    if (/\.\./.test(email)) return false;
    // No leading/trailing dot
    if (/^\.|\.$/.test(email)) return false;
    // Basic RFC-like regex
    const rfcRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!rfcRegex.test(email)) return false;
    // Domain must not start/end with dash or dot
    const domain = email.split("@")[1];
    if (!domain || /^[-.]/.test(domain) || /[-.]$/.test(domain)) return false;
    // Domain must have at least one dot
    if (domain.indexOf(".") === -1) return false;
    return true;
  }
  function validateDate(date: string) {
    // Check for valid date and not in the future
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d instanceof Date && !isNaN(d.getTime()) && d <= now;
  }
  function validatePhone(phone: string) {
    // Accepts numbers, spaces, dashes, parentheses, starts with digit, 7-15 digits
    return /^\+?[0-9\s\-()]{7,15}$/.test(phone);
  }

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  // Validation state for Edit User modal
  const [editUserErrors, setEditUserErrors] = useState({
    email: "",
    idNumber: "",
  });
  const handleEdit = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      // If idNumber is missing, set to empty string to avoid crashing modal
      setEditUser({
        ...emp,
        idNumber: emp.idNumber ?? "",
      });
      setShowEditModal(true);
    } else {
      // If no employee found, close modal and show error
      setEditUser(null);
      setShowEditModal(false);
      setShowErrorModal(true);
    }
  };
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showDeletePromptModal, setShowDeletePromptModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof editUserErrors = {
      email: "",
      idNumber: "",
    };
    // Check for duplicate ID number (exclude current user)
    if (
      employees.some(
        (emp) => emp.idNumber === editUser.idNumber && emp.id !== editUser.id
      )
    ) {
      errors.idNumber = "ID number already exists.";
    }
    // Check for duplicate email (exclude current user)
    if (
      employees.some(
        (emp) =>
          emp.email.toLowerCase() === editUser.email.toLowerCase() &&
          emp.id !== editUser.id
      )
    ) {
      errors.email = "Email already exists.";
    }
    setEditUserErrors(errors);
    if (errors.email || errors.idNumber) {
      return;
    }
    const formData = new FormData();
    // Use same fields as Add User modal
    formData.append("idNumber", editUser.idNumber);
    formData.append("lastname", editUser.lastname);
    formData.append("firstname", editUser.firstname);
    formData.append("email", editUser.email);
    // Do not update password from this page
    formData.append("department", editUser.department);
    formData.append("position", editUser.position);
    formData.append("dateHired", editUser.dateHired);
    formData.append("role", editUser.role);
    formData.append("status", editUser.status);
    formData.append("dateOfBirth", editUser.dateOfBirth);
    formData.append("gender", editUser.gender);
    formData.append("civilStatus", editUser.civilStatus);
    formData.append("nationality", editUser.nationality);
    formData.append("address", editUser.address);
    formData.append("contactNumber", editUser.contactNumber);
    formData.append("emergencyPerson", editUser.emergencyPerson);
    formData.append("emergencyNumber", editUser.emergencyNumber);
    formData.append("emergencyRelationship", editUser.emergencyRelationship);
    formData.append("tin", editUser.tin);
    formData.append("sss", editUser.sss);
    formData.append("philhealth", editUser.philhealth);
    formData.append("pagibig", editUser.pagibig);
    formData.append("psaBirthCert", editUser.psaBirthCert);
    formData.append("created_by", editUser.created_by || "system");
    // Profile image
    const profileImageInput = document.getElementById(
      "editProfileImageInput"
    ) as HTMLInputElement | null;
    if (
      profileImageInput &&
      profileImageInput.files &&
      profileImageInput.files[0]
    ) {
      formData.append("profileImage", profileImageInput.files[0]);
    } else if (editUser.profileImage) {
      formData.append("profileImage", editUser.profileImage);
    }
    await axios.put(
      `http://localhost:3001/api/employees/${editUser.id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    // Refetch employees after successful edit
    const res = await axios.get("http://localhost:3001/api/employees");
    const data = res.data;
    setEmployees(Array.isArray(data) ? data : []);
    setShowEditModal(false);
    setEditUser(null);
    setEditProfileImage(null);
    setShowUpdateSuccessModal(true);
  };
  const handleDeletePrompt = (id: number) => {
    setDeleteId(id);
    setShowDeletePromptModal(true);
  };
  const handleDeleteConfirm = async () => {
    if (deleteId !== null) {
      await axios.delete(`http://localhost:3001/api/employees/${deleteId}`);
      setShowDeletePromptModal(false);
      setShowDeleteSuccessModal(true);
      setDeleteId(null);
      // Refetch employees
      axios.get("http://localhost:3001/api/employees").then((res) => {
        const data = res.data;
        setEmployees(Array.isArray(data) ? data : []);
      });
    }
  };

  // When opening Add User modal, auto-generate idNumber
  const handleOpenAddUserModal = () => {
    setNewUser((u) => ({
      ...u,
      idNumber: getNextIdNumber(employees),
    }));
    setShowModal(true);
  };

  return (
    <ComponentCard className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
      {/* Edit Success Confirmation Modal */}
      {showUpdateSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Update Successful
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              The account has been successfully updated.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowUpdateSuccessModal(false)}
              >
                OK
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
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Account Created
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              The account has been successfully created and credentials have
              been sent to the user's email.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Error Creating Account
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              There was an error creating the account. Please check your input
              and try again. If the problem persists, contact support.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
            height: "100vh",
            minHeight: "100vh",
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xl relative"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#22c55e #333333ff", // green on gray
            }}
          >
            {/* X button to close modal */}
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white text-2xl font-bold focus:outline-none"
              aria-label="Close"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <div className="custom-scrollbar"></div>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Add User
            </h3>
            <form onSubmit={handleAddUserSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                {/* Column 1: Personal Info */}
                <div>
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex flex-col items-center justify-center w-full">
                      <img
                        src={profileImage || "/src/profile-image/default.jpg"}
                        alt="Profile Preview"
                        className="w-28 h-28 rounded-full object-cover border-2 mb-2 shadow-lg transition duration-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                      <label
                        htmlFor="profileImageInput"
                        className="cursor-pointer px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 mb-2 text-center transition"
                      >
                        Choose Image
                        <input
                          id="profileImageInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setProfileImage(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setProfileImage(null);
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Upload a profile image (optional)
                      </span>
                    </div>
                  </div>
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Personal Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Row 1: ID Number - Last Name - First Name */}
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        TRU-
                      </span>
                      <input
                        type="text"
                        className={`w-full rounded-r border px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-semibold ${
                          idNumberExists
                            ? "border-orange-500"
                            : "border-gray-300 dark:border-gray-700"
                        }`}
                        placeholder="12345"
                        value={newUser.idNumber}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 5);
                          setNewUser((u) => ({
                            ...u,
                            idNumber: val,
                          }));
                          setIdNumberExists(checkIdNumberExists(val));
                        }}
                        maxLength={5}
                        pattern="\d{5}"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Last Name"
                      value={newUser.lastname}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, lastname: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="First Name"
                      value={newUser.firstname}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, firstname: e.target.value }))
                      }
                      required
                    />
                    {/* Row 2: Date of Birth - Gender - Civil Status */}
                    <div className="relative">
                      <DatePicker
                        selected={
                          newUser.dateOfBirth
                            ? new Date(newUser.dateOfBirth)
                            : null
                        }
                        onChange={(date: Date | null) =>
                          setNewUser((u) => ({
                            ...u,
                            dateOfBirth: date
                              ? date.toISOString().slice(0, 10)
                              : "",
                          }))
                        }
                        dateFormat="yyyy-MM-dd"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                        placeholderText="Date of Birth"
                        required
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        popperClassName="datepicker-float"
                      />
                    </div>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={newUser.gender}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, gender: e.target.value }))
                      }
                      required
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={newUser.civilStatus}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          civilStatus: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                    {/* Row 3: Address (colspan-2) - Nationality (Autocomplete countries) */}
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 md:col-span-2"
                      placeholder="Address"
                      value={newUser.address}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Nationality"
                      value={newUser.nationality}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          nationality: e.target.value,
                        }))
                      }
                      required
                    />
                    {/* Row 4: Email Address (colspan-2) - Contact Number */}
                    <div className="relative md:col-span-2">
                      <input
                        type="email"
                        className={`w-full rounded border px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 ${
                          emailExists
                            ? "border-orange-500"
                            : "border-gray-300 dark:border-gray-700"
                        }`}
                        placeholder="Email Address"
                        value={newUser.email}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setNewUser((u) => ({ ...u, email: value }));
                          if (value) {
                            const exists = await checkEmailExists(value);
                            setEmailExists(exists);
                          } else {
                            setEmailExists(false);
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        +63
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-r border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                        placeholder="XXX-XXX-XXXX"
                        value={newUser.contactNumber}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d-]/g, "");
                          val = val.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          );
                          setNewUser((u) => ({
                            ...u,
                            contactNumber: val.slice(0, 12),
                          }));
                          setAddUserErrors((err) => ({
                            ...err,
                            contactNumber: "",
                          }));
                        }}
                        maxLength={12}
                        pattern="\d{3}-\d{3}-\d{4}"
                        required
                      />
                    </div>
                    {addUserErrors.contactNumber && (
                      <span className="text-xs text-red-600 md:col-span-3">
                        {addUserErrors.contactNumber}
                      </span>
                    )}
                    {/* Row 5: Department - Position */}
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Department"
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          department: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Position"
                      value={newUser.position}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, position: e.target.value }))
                      }
                      required
                    />
                    {/* Row 6: Role - Date of Employment */}
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, role: e.target.value }))
                      }
                      required
                    >
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                      <option value="HR">HR</option>
                    </select>
                    <div className="relative">
                      <DatePicker
                        selected={
                          newUser.dateHired ? new Date(newUser.dateHired) : null
                        }
                        onChange={(date: Date | null) =>
                          setNewUser((u) => ({
                            ...u,
                            dateHired: date
                              ? date.toISOString().slice(0, 10)
                              : "",
                          }))
                        }
                        dateFormat="yyyy-MM-dd"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                        placeholderText="Date of Employment"
                        required
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        popperClassName="datepicker-float"
                      />
                    </div>
                    {/* Row 7: Password - Confirm Password */}
                    <input
                      type="password"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, password: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="password"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Confirm Password"
                      value={newUser.confirmPassword || ""}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Emergency Contact
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Person"
                      value={newUser.emergencyPerson}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          emergencyPerson: e.target.value,
                        }))
                      }
                      required
                    />
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        +63
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-r border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                        placeholder="XXX-XXX-XXXX"
                        value={newUser.emergencyNumber}
                        onChange={(e) => {
                          // Only allow numbers and dashes, format as XXX-XXX-XXXX
                          let val = e.target.value.replace(/[^\d-]/g, "");
                          val = val.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          );
                          setNewUser((u) => ({
                            ...u,
                            emergencyNumber: val.slice(0, 12),
                          }));
                        }}
                        maxLength={12}
                        pattern="\d{3}-\d{3}-\d{4}"
                        required
                      />
                    </div>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={newUser.emergencyRelationship}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          emergencyRelationship: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Poster Parents">Poster Parents</option>
                    </select>
                  </div>
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Government Identification
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="TIN"
                      value={newUser.tin}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, tin: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="SSS Number"
                      value={newUser.sss}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, sss: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="PhilHealth Number"
                      value={newUser.philhealth}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          philhealth: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Pag-IBIG Number"
                      value={newUser.pagibig}
                      onChange={(e) =>
                        setNewUser((u) => ({ ...u, pagibig: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 md:col-span-2"
                      placeholder="PSA Birth Certificate Number (optional)"
                      value={newUser.psaBirthCert}
                      onChange={(e) =>
                        setNewUser((u) => ({
                          ...u,
                          psaBirthCert: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <div className="flex-1 flex items-center">
                  {Object.values(addUserErrors).some((err) => err) && (
                    <span className="text-red-600 text-sm font-medium mr-4 text-left">
                      {addUserErrors.email ||
                        addUserErrors.dateOfBirth ||
                        addUserErrors.contactNumber ||
                        addUserErrors.idNumber}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => setShowModal(false)}
                  disabled={addUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-semibold ${
                    addUserLoading
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                  disabled={addUserLoading}
                >
                  {addUserLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      Saving...
                    </span>
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
            height: "100vh",
            minHeight: "100vh",
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xl relative"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#22c55e #333333ff",
            }}
          >
            {/* X button to close modal */}
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white text-2xl font-bold focus:outline-none"
              aria-label="Close"
              onClick={() => setShowEditModal(false)}
            >
              &times;
            </button>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                <div>
                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex flex-col items-center justify-center w-full">
                      <img
                        src={
                          editProfileImage ||
                          editUser.profileImage ||
                          "/src/profile-image/default.jpg"
                        }
                        alt="Profile Preview"
                        className="w-28 h-28 rounded-full object-cover border-2 mb-2 shadow-lg transition duration-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                      <label
                        htmlFor="editProfileImageInput"
                        className="cursor-pointer px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 mb-2 text-center transition"
                      >
                        Choose Image
                        <input
                          id="editProfileImageInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setEditProfileImage(
                                  ev.target?.result as string
                                );
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setEditProfileImage(null);
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Upload a profile image (optional)
                      </span>
                    </div>
                  </div>
                  {/* Personal Information */}
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Personal Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Error messages for Edit User modal */}
                    {(editUserErrors.idNumber || editUserErrors.email) && (
                      <div className="col-span-3 mb-2">
                        {editUserErrors.idNumber && (
                          <div className="text-orange-600 text-xs font-semibold mb-1">
                            {editUserErrors.idNumber}
                          </div>
                        )}
                        {editUserErrors.email && (
                          <div className="text-orange-600 text-xs font-semibold mb-1">
                            {editUserErrors.email}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        TRU-
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-r border px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-semibold"
                        placeholder="12345"
                        value={editUser.idNumber.replace(/^TRU-/, "")}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 5);
                          setEditUser((u: any) => ({ ...u, idNumber: val }));
                        }}
                        maxLength={5}
                        pattern="\d{5}"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Last Name"
                      value={editUser.lastname}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          lastname: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="First Name"
                      value={editUser.firstname}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          firstname: e.target.value,
                        }))
                      }
                      required
                    />
                    <div className="relative">
                      <DatePicker
                        selected={
                          editUser.dateOfBirth
                            ? new Date(editUser.dateOfBirth)
                            : null
                        }
                        onChange={(date: Date | null) =>
                          setEditUser((u: any) => ({
                            ...u,
                            dateOfBirth: date
                              ? date.toISOString().slice(0, 10)
                              : "",
                          }))
                        }
                        dateFormat="yyyy-MM-dd"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                        placeholderText="Date of Birth"
                        required
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        popperClassName="datepicker-float"
                      />
                    </div>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={editUser.gender}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          gender: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={editUser.civilStatus}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          civilStatus: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                    </select>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 md:col-span-2"
                      placeholder="Address"
                      value={editUser.address}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Nationality"
                      value={editUser.nationality}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          nationality: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="email"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 md:col-span-2"
                      placeholder="Email Address"
                      value={editUser.email}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        +63
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-r border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                        placeholder="XXX-XXX-XXXX"
                        value={editUser.contactNumber}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d-]/g, "");
                          val = val.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          );
                          setEditUser((u: any) => ({
                            ...u,
                            contactNumber: val.slice(0, 12),
                          }));
                        }}
                        maxLength={12}
                        pattern="\d{3}-\d{3}-\d{4}"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Department"
                      value={editUser.department}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          department: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Position"
                      value={editUser.position}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          position: e.target.value,
                        }))
                      }
                      required
                    />
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={editUser.role}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          role: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                      <option value="HR">HR</option>
                    </select>
                    <div className="relative">
                      <DatePicker
                        selected={
                          editUser.dateHired
                            ? new Date(editUser.dateHired)
                            : null
                        }
                        onChange={(date: Date | null) =>
                          setEditUser((u: any) => ({
                            ...u,
                            dateHired: date
                              ? date.toISOString().slice(0, 10)
                              : "",
                          }))
                        }
                        dateFormat="yyyy-MM-dd"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                        placeholderText="Date of Employment"
                        required
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        popperClassName="datepicker-float"
                      />
                    </div>
                  </div>
                  {/* Emergency Contact */}
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Emergency Contact
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Person"
                      value={editUser.emergencyPerson}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          emergencyPerson: e.target.value,
                        }))
                      }
                      required
                    />
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-2 rounded-l border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        +63
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-r border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                        placeholder="XXX-XXX-XXXX"
                        value={editUser.emergencyNumber}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d-]/g, "");
                          val = val.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "$1-$2-$3"
                          );
                          setEditUser((u: any) => ({
                            ...u,
                            emergencyNumber: val.slice(0, 12),
                          }));
                        }}
                        maxLength={12}
                        pattern="\d{3}-\d{3}-\d{4}"
                        required
                      />
                    </div>
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      value={editUser.emergencyRelationship}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          emergencyRelationship: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Poster Parents">Poster Parents</option>
                    </select>
                  </div>
                  {/* Government Identification */}
                  <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
                    Government Identification
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="TIN"
                      value={editUser.tin}
                      onChange={(e) =>
                        setEditUser((u: any) => ({ ...u, tin: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="SSS Number"
                      value={editUser.sss}
                      onChange={(e) =>
                        setEditUser((u: any) => ({ ...u, sss: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="PhilHealth Number"
                      value={editUser.philhealth}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          philhealth: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                      placeholder="Pag-IBIG Number"
                      value={editUser.pagibig}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          pagibig: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 md:col-span-2"
                      placeholder="PSA Birth Certificate Number (optional)"
                      value={editUser.psaBirthCert}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          psaBirthCert: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {/* Status Dropdown at the bottom */}
                  <div className="mb-4">
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                      value={editUser.status}
                      onChange={(e) =>
                        setEditUser((u: any) => ({
                          ...u,
                          status: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Retired">Retired</option>
                      <option value="Suspended">Suspended</option>
                      <option value="AWOL">AWOL</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 items-center">
                    <div className="flex-1 flex items-center">
                      {(editUserErrors.idNumber || editUserErrors.email) && (
                        <div>
                          {editUserErrors.idNumber && (
                            <span className="text-orange-600 text-xs font-semibold mr-2">
                              {editUserErrors.idNumber}
                            </span>
                          )}
                          {editUserErrors.email && (
                            <span className="text-orange-600 text-xs font-semibold mr-2">
                              {editUserErrors.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditUser(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeletePromptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              Are you sure you want to delete this account? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
                onClick={() => {
                  setShowDeletePromptModal(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Delete Successful
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              The account has been successfully deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowDeleteSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          User List
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ minWidth: 180 }}
          />
          <button
            type="button"
            onClick={handleOpenAddUserModal}
            className="inline-flex items-center gap-2 rounded-md p-2 bg-transparent text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition text-xl"
            aria-label="Add Account"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 rounded-md p-2 bg-transparent text-blue-400 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition text-xl"
            aria-label="Download CSV"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M10 3v10m0 0-3.5-3.5M10 13l3.5-3.5"
              />
              <rect
                x="3"
                y="15"
                width="14"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <span className="ml-1 text-xs font-medium">CSV</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mt-2">
        <table
          id="user-table"
          className="min-w-full rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-800"
        >
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Profile
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                ID Number
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Department
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Date Hired
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = employees
                .filter((emp) => {
                  const q = search.toLowerCase();
                  return (
                    emp.lastname?.toLowerCase().includes(q) ||
                    emp.firstname?.toLowerCase().includes(q) ||
                    emp.email?.toLowerCase().includes(q) ||
                    emp.department?.toLowerCase().includes(q) ||
                    emp.position?.toLowerCase().includes(q) ||
                    emp.role?.toLowerCase().includes(q) ||
                    emp.status?.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => b.id - a.id); // Sort by id descending (newest first)
              if (filtered.length === 0) {
                return (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-semibold"
                    >
                      No added user account
                    </td>
                  </tr>
                );
              }
              return filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <img
                      src={emp.profileImage || "/src/profile-image/default.jpg"}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.role === "Applicant" ? "N/A" : `TRU-${emp.idNumber}`}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="font-semibold">
                      {emp.lastname ? emp.lastname : ""},{" "}
                      {emp.firstname ? emp.firstname : ""}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {emp.email ? emp.email : ""}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.role === "Applicant" ? (
                      <div>N/A</div>
                    ) : (
                      <>
                        <div>{emp.department ? emp.department : ""}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {emp.position ? emp.position : ""}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {emp.role === "Applicant"
                      ? "N/A"
                      : emp.dateHired
                      ? new Date(emp.dateHired).toISOString().substring(0, 10)
                      : ""}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {emp.role || ""}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span
                      className={
                        emp.status === "Active"
                          ? "bg-green-600/10 text-green-600 px-2 py-1 rounded-full text-xs font-semibold"
                          : emp.status === "Inactive"
                          ? "bg-purple-600/10 text-purple-600 px-2 py-1 rounded-full text-xs font-semibold"
                          : "bg-gray-600/10 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold"
                      }
                    >
                      {emp.status ? emp.status : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {/* View */}
                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(emp.id)}
                      className="mr-2 inline-flex items-center justify-center p-0 bg-transparent border-none text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition text-xl"
                      aria-label="Edit"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 4.5l3 3L7.75 19.25l-4 1 1-4L16.5 4.5z"
                        />
                      </svg>
                    </button>
                    {/* X icon for delete */}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:text-white hover:bg-red-500 transition text-lg font-bold"
                      aria-label="Delete Account"
                      style={{ width: "32px", height: "32px" }}
                      onClick={() => handleDeletePrompt(emp.id)}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </ComponentCard>
  );
};

export default UserList;
