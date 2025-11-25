import { useState, useEffect } from "react";
import axios from "axios";

type JobOpening = {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  posted_date: string;
  exam_id?: number | null;
  status: string;
};

// Remove initialJobOpenings, fetch from backend

export default function JobOpeningsList() {
  const [formError, setFormError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-Time",
    posted_date: today,
    status: "Open",
    exam_title: "",
    exam_id: "",
    description: "",
    role: "",
    requirements: "",
  });
  const [loading, setLoading] = useState(true);
  const [successPrompt, setSuccessPrompt] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    title: "",
    department: "",
    location: "",
    type: "Full-Time",
    posted_date: today,
    status: "Open",
    exam_title: "",
    exam_id: "",
    description: "",
    role: "",
    requirements: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [exams, setExams] = useState<{ id: number; title: string }[]>([]);
  // Fetch exams for applicant using the correct API endpoint
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/exam/applicant")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setExams(
            res.data.map((exam: any) => ({ id: exam.id, title: exam.name }))
          );
        }
      })
      .catch(() => setExams([]));
  }, []);

  // Fetch job openings from backend
  useEffect(() => {
    let isMounted = true;
    const fetchJobs = () => {
      setLoading(true);
      axios
        .get("http://localhost:3001/api/job_opening")
        .then((res) => {
          if (isMounted) setJobOpenings(res.data);
        })
        .catch(() => {
          if (isMounted) setJobOpenings([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };
    fetchJobs();
  }, []);

  // Filter job openings by search
  // Filter job openings by search and hide id = 0
  const filteredJobs = jobOpenings
    .filter((job) => job.id !== 0)
    .filter((job) => {
      const term = search.toLowerCase();
      return (
        job.title.toLowerCase().includes(term) ||
        job.department.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.type.toLowerCase().includes(term) ||
        job.status.toLowerCase().includes(term)
      );
    });

  // Custom scrollbar styles
  const scrollbarStyles = `
    .job-openings-scroll::-webkit-scrollbar {
      width: 6px;
    .job-openings-scroll::-webkit-scrollbar-thumb {
      background: #22c55e;
      border-radius: 4px;
    }
    .job-openings-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .job-openings-scroll {
      scrollbar-width: thin;
      scrollbar-color: #22c55e transparent;
    }
  `;

  // If more than 10 jobs, make table scrollable
  const isScrollable = filteredJobs.length > 10;

  // Modal handlers
  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setForm({
      title: "",
      department: "",
      location: "",
      type: "Full-Time",
      posted_date: today,
      status: "Open",
      exam_title: "",
      exam_id: "",
      description: "",
      role: "",
      requirements: "",
    });
  };
  const openEditModal = (
    job: JobOpening & {
      description?: string;
      role?: string;
      requirements?: string;
      exam_title?: string;
    }
  ) => {
    setEditForm({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      posted_date: job.posted_date,
      status: job.status,
      exam_title: job.exam_title ?? "",
      exam_id: job.exam_id ? String(job.exam_id) : "",
      description: job.description ?? "",
      role: job.role ?? "",
      requirements: job.requirements ?? "",
    });
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditForm({
      id: 0,
      title: "",
      department: "",
      location: "",
      type: "Full-Time",
      posted_date: today,
      status: "Open",
      exam_title: "",
      exam_id: "",
      description: "",
      role: "",
      requirements: "",
    });
  };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const openDeleteModal = (id: number) => {
    setDeleteJobId(id);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteJobId(null);
  };
  const handleDeleteConfirm = async () => {
    if (deleteJobId == null) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/job_opening/${deleteJobId}`
      );
      setSuccessPrompt("Job opening deleted successfully!");
      setTimeout(() => setSuccessPrompt(""), 2500);
      closeDeleteModal();
      // Refresh job openings
      axios
        .get("http://localhost:3001/api/job_opening")
        .then((res) => setJobOpenings(res.data))
        .catch(() => setJobOpenings([]));
    } catch (error) {
      setSuccessPrompt("Failed to delete job opening.");
      setTimeout(() => setSuccessPrompt(""), 2500);
      closeDeleteModal();
    }
  };
  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (
      !form.description.trim() ||
      !form.role.trim() ||
      !form.requirements.trim()
    ) {
      setFormError("Description, Role, and Requirements cannot be empty.");
      return;
    }
    try {
      // Send to backend
      const res = await axios.post("http://localhost:3001/api/job_opening", {
        title: form.title,
        department: form.department,
        location: form.location,
        type: form.type,
        posted_date: form.posted_date,
        status: form.status,
        exam_title: form.exam_title,
        exam_id: form.exam_id ? Number(form.exam_id) : null,
        description: form.description,
        role: form.role,
        requirements: form.requirements,
      });
      if (res.data && res.data.id) {
        setSuccessPrompt("Job opening added successfully!");
        setTimeout(() => setSuccessPrompt(""), 2500);
        closeModal();
        // Refresh job openings
        axios
          .get("http://localhost:3001/api/job_opening")
          .then((res) => setJobOpenings(res.data))
          .catch(() => setJobOpenings([]));
      }
    } catch (error) {
      setSuccessPrompt("Failed to add job opening.");
      setTimeout(() => setSuccessPrompt(""), 2500);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (
      !editForm.description.trim() ||
      !editForm.role.trim() ||
      !editForm.requirements.trim()
    ) {
      setFormError("Description, Role, and Requirements cannot be empty.");
      return;
    }
    try {
      // Update job opening
      const res = await axios.put(
        `http://localhost:3001/api/job_opening/${editForm.id}`,
        {
          title: editForm.title,
          department: editForm.department,
          location: editForm.location,
          type: editForm.type,
          status: editForm.status,
          exam_title: editForm.exam_title,
          exam_id: editForm.exam_id ? Number(editForm.exam_id) : null,
          description: editForm.description,
          role: editForm.role,
          requirements: editForm.requirements,
        }
      );
      if (res.data && res.data.success) {
        setSuccessPrompt("Job opening updated successfully!");
        setTimeout(() => setSuccessPrompt(""), 2500);
        closeEditModal();
        // Refresh job openings
        axios
          .get("http://localhost:3001/api/job_opening")
          .then((res) => setJobOpenings(res.data))
          .catch(() => setJobOpenings([]));
      }
    } catch (error) {
      setSuccessPrompt("Failed to update job opening.");
      setTimeout(() => setSuccessPrompt(""), 2500);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 mb-8">
      <style>
        {scrollbarStyles}
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #22c55e transparent;
        }
      `}
      </style>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-0">
          List of Job Openings
        </h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            title="Add Job Opening"
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition"
            onClick={openModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      <div
        className={`overflow-x-auto mt-2 ${
          isScrollable ? "job-openings-scroll" : ""
        }`}
        style={isScrollable ? { maxHeight: 400, overflowY: "auto" } : {}}
      >
        <table className="min-w-full rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Department
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Posted Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Exam ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
              >
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.title}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.department}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.location}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.type}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.posted_date ? job.posted_date.slice(0, 10) : ""}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.exam_id ?? "-"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {job.status}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white flex gap-4">
                  {/* Feather Edit (Pen) icon */}
                  <button
                    title="Edit"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => openEditModal(job)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  {/* Feather Delete (X) icon */}
                  <button
                    title="Delete"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => openDeleteModal(job.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </td>
                {/* Confirmation Modal for Delete Job Opening (single instance, outside table) */}
                {showDeleteModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                      background: "rgba(41, 40, 40, 0.46)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs relative">
                      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white text-center">
                        Confirm Delete
                      </h3>
                      <p className="mb-6 text-gray-700 dark:text-gray-300 text-center">
                        Are you sure you want to delete this job opening?
                      </p>
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={closeDeleteModal}
                          className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteConfirm}
                          className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Success Prompt */}
      {successPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded shadow-lg font-semibold text-lg">
            {successPrompt}
          </div>
        </div>
      )}
      {/* Modal for Add Job Opening */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative flex flex-row gap-8">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              title="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Add Job Opening
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="text-red-600 font-semibold mb-2">
                    {formError}
                  </div>
                )}
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Title"
                  autoFocus
                />
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Department"
                />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Location"
                />
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
                <input
                  name="posted_date"
                  type="date"
                  value={form.posted_date}
                  readOnly
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 cursor-not-allowed"
                  placeholder="Posted Date"
                />
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                {/* Exam dropdown at the bottom */}
                <select
                  name="exam_id"
                  value={form.exam_id}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
            {/* Right side fields */}
            <div className="flex-1 flex flex-col gap-4 border-l border-gray-200 dark:border-gray-700 pl-8">
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Description:
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Description"
                rows={3}
              />
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Role & Responsibilities:
              </label>
              <textarea
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Role"
                rows={2}
              />
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Requirements:
              </label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Requirements"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for Edit Job Opening */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative flex flex-row gap-8">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeEditModal}
              title="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Edit Job Opening
              </h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {formError && (
                  <div className="text-red-600 font-semibold mb-2">
                    {formError}
                  </div>
                )}
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Title"
                  autoFocus
                />
                <input
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Department"
                />
                <input
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                  placeholder="Location"
                />
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
                <input
                  name="posted_date"
                  type="date"
                  value={
                    editForm.posted_date
                      ? editForm.posted_date.slice(0, 10)
                      : ""
                  }
                  readOnly
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2 cursor-not-allowed"
                  placeholder="Posted Date"
                />
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                {/* Exam dropdown at the bottom */}
                <select
                  name="exam_id"
                  value={editForm.exam_id}
                  onChange={handleEditChange}
                  className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
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
              </form>
            </div>
            {/* Right side fields */}
            <div className="flex-1 flex flex-col gap-4 border-l border-gray-200 dark:border-gray-700 pl-8">
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Description:
              </label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Description"
                rows={3}
              />
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Role & Responsibilities:
              </label>
              <textarea
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Role"
                rows={2}
              />
              <label className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Requirements:
              </label>
              <textarea
                name="requirements"
                value={editForm.requirements}
                onChange={handleEditChange}
                required
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 min-h-[80px] resize-vertical custom-scrollbar"
                style={{ fontSize: "10pt" }}
                placeholder="Requirements"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
