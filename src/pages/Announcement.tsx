import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  receiver?: string;
  created_at?: string;
  date?: string;
}
import PageMeta from "../components/common/PageMeta";

const Announcement = () => {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId) {
      window.location.replace("/");
    } else if (role !== "admin") {
      window.location.replace("/employee");
    }
  }, []);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  // Fetch announcements from backend on mount
  useEffect(() => {
    async function fetchAnnouncements() {
      setLoadingAnnouncements(true);
      try {
        const res = await axios.get("http://localhost:3001/api/announcements");
        if (Array.isArray(res.data)) {
          setAnnouncements(res.data);
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
        setAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    }
    fetchAnnouncements();
  }, []);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [receiver, setReceiver] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAnnouncement, setUpdateAnnouncement] =
    useState<AnnouncementItem | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateReceiver, setUpdateReceiver] = useState("");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<
    number | null
  >(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !content.trim() || !receiver.trim()) return;
    try {
      const res = await axios.post("http://localhost:3001/api/announcements", {
        title,
        content,
        receiver,
        created_by: "admin",
      });
      if (res.status === 200 || res.status === 201) {
        setShowAddModal(false);
        setShowSuccessModal(true);
        setTitle("");
        setContent("");
        setReceiver("");
        setAnnouncements((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  // Open update modal and set fields
  const handleEditAnnouncement = (a: AnnouncementItem) => {
    setUpdateAnnouncement(a);
    setUpdateTitle(a.title);
    setUpdateContent(a.content);
    setUpdateReceiver(a.receiver || "");
    setShowUpdateModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (id: number) => {
    setDeleteAnnouncementId(id);
    setShowDeleteModal(true);
  };

  // Delete announcement API call (after confirmation)
  const handleDeleteAnnouncement = async () => {
    if (!deleteAnnouncementId) return;
    try {
      const res = await axios.delete(
        `http://localhost:3001/api/announcements/${deleteAnnouncementId}`
      );
      if (res.status === 200) {
        // Refetch announcements from backend for consistency
        const refreshed = await axios.get(
          "http://localhost:3001/api/announcements"
        );
        setAnnouncements(Array.isArray(refreshed.data) ? refreshed.data : []);
        setShowDeleteModal(false);
        setShowDeleteSuccessModal(true);
        setDeleteAnnouncementId(null);
      } else {
        setShowDeleteModal(false);
        setDeleteAnnouncementId(null);
      }
    } catch (err) {
      setShowDeleteModal(false);
      setDeleteAnnouncementId(null);
    }
  };

  // Update announcement API call
  const handleUpdateAnnouncement = async () => {
    if (
      !updateAnnouncement ||
      !updateTitle.trim() ||
      !updateContent.trim() ||
      !updateReceiver.trim()
    )
      return;
    try {
      const res = await axios.put(
        `http://localhost:3001/api/announcements/${updateAnnouncement.id}`,
        {
          title: updateTitle,
          content: updateContent,
          receiver: updateReceiver,
          status: "Active",
        }
      );
      if (res.status === 200) {
        setShowUpdateModal(false);
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === updateAnnouncement.id
              ? {
                  ...item,
                  title: updateTitle,
                  content: updateContent,
                  receiver: updateReceiver,
                }
              : item
          )
        );
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="TRuBank HRMS"
        description="TRuBank HRMS Admin Dashboard"
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Announcement History
            <p className="text-sm text-gray-400 dark:text-gray-400">
              Announcements are automatically deleted after 30 days.
            </p>
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="h-10 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-4 text-base text-gray-900 dark:text-white w-56 font-medium"
              placeholder="Search..."
              // onChange={...} // Add search logic if needed
            />
            <button
              className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Add Announcement"
              aria-label="Add Announcement"
              onClick={() => setShowAddModal(true)}
            >
              +
            </button>
            {/* Add Announcement Modal */}
            {showAddModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-10 w-full max-w-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Add Announcement
                  </h3>
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                    placeholder="Announcement Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                  <textarea
                    className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                    placeholder="Announcement Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                  />
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                    placeholder="Receiver"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowAddModal(false);
                        setTitle("");
                        // Socket.IO client for real-time updates
                        const socket = io("http://localhost:3001");

                        useEffect(() => {
                          socket.on("newAnnouncement", (announcement) => {
                            // Map backend announcement to AnnouncementItem shape
                            setAnnouncements((prev) => [
                              {
                                id: announcement.id,
                                title: announcement.title,
                                content: announcement.content,
                                receiver: announcement.receiver,
                                created_at: announcement.created_at,
                              },
                              ...prev,
                            ]);
                          });
                          return () => {
                            socket.off("newAnnouncement");
                          };
                        }, []);
                        setContent("");
                        setReceiver("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                      onClick={handleAddAnnouncement}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <ul className="space-y-3">
          {loadingAnnouncements ? (
            <li className="p-3 text-center text-gray-500">Loading...</li>
          ) : announcements.length === 0 ? (
            <li className="p-3 text-center text-gray-500">
              No announcements found.
            </li>
          ) : Array.isArray(announcements) ? (
            announcements.map((a) => (
              <li
                key={a.id}
                className="p-3 rounded-lg flex justify-between items-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <span className="mr-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-5 h-5 text-yellow-500 dark:text-yellow-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="font-bold text-gray-700 dark:text-white">
                      {a.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {a.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {a.created_at ? a.created_at.slice(0, 10) : a.date}
                      {a.receiver && (
                        <span className="ml-2 text-gray-500">
                          | Receiver: {a.receiver}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    className="ml-4 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Edit Announcement"
                    aria-label="Edit Announcement"
                    onClick={() => handleEditAnnouncement(a)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h12"
                      />
                    </svg>
                  </button>
                  <button
                    className="ml-2 p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    title="Delete Announcement"
                    aria-label="Delete Announcement"
                    onClick={() => openDeleteModal(a.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-5 h-5 text-red-500 dark:text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="p-3 text-center text-red-500">
              Error loading announcements.
            </li>
          )}
        </ul>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-red-700 dark:text-red-400">
                Delete Announcement
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                Are you sure you want to delete this announcement? This action
                cannot be undone.
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteAnnouncementId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                  onClick={handleDeleteAnnouncement}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Modal */}
        {showDeleteSuccessModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-red-700 dark:text-red-400">
                Announcement Deleted!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                The announcement has been successfully deleted.
              </div>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={() => setShowDeleteSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Update Announcement Modal (moved outside map/button) */}
        {showUpdateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-10 w-full max-w-lg">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Update Announcement
              </h3>
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Announcement Title"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Announcement Content"
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                rows={3}
              />
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Receiver"
                value={updateReceiver}
                onChange={(e) => setUpdateReceiver(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateAnnouncement(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  onClick={handleUpdateAnnouncement}
                >
                  Update
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                Announcement Added!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                Your announcement has been successfully added.
              </div>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcement;
