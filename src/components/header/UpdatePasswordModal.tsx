import React, { useState } from "react";
import axios from "axios";

export interface UpdatePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
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

  if (!open) return null;

  return (
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
            onClose();
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
            const userId = localStorage.getItem("userId");
            if (!userId) {
              setPasswordError("User ID not found. Please log in again.");
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
            if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
              setPasswordError("New password and confirmation do not match.");
              setPasswordLoading(false);
              return;
            }
            if (passwordForm.newPassword.length < 6) {
              setPasswordError("New password must be at least 6 characters.");
              setPasswordLoading(false);
              return;
            }
            try {
              const response = await axios.put(
                `http://localhost:3001/api/employees/${userId}/password`,
                {
                  currentPassword: passwordForm.currentPassword,
                  newPassword: passwordForm.newPassword,
                }
              );
              if (response.data && response.data.success) {
                onClose();
                setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmNewPassword: "",
                });
                setPasswordError("");
                if (onSuccess) onSuccess("Password updated successfully.");
              } else {
                if (
                  response.data?.message
                    ?.toLowerCase()
                    ?.includes("current password is incorrect")
                ) {
                  setPasswordError("Current password is incorrect.");
                } else {
                  setPasswordError(
                    response.data?.message || "Failed to update password."
                  );
                }
              }
            } catch (err) {
              const error = err as any;
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                if (
                  typeof error.response.data.message === "string" &&
                  error.response.data.message
                    .toLowerCase()
                    .includes("current password is incorrect")
                ) {
                  setPasswordError("Current password is incorrect.");
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
                setShowPassword((s) => ({ ...s, current: !s.current }))
              }
              aria-label={
                showPassword.current ? "Hide password" : "Show password"
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
                setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-400 hover:text-green-500"
              tabIndex={-1}
              onClick={() => setShowPassword((s) => ({ ...s, new: !s.new }))}
              aria-label={showPassword.new ? "Hide password" : "Show password"}
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
                setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
              }
              aria-label={
                showPassword.confirm ? "Hide password" : "Show password"
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
                onClose();
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
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;
