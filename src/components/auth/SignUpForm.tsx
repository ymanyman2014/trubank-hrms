import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/employee-applicant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastname: lname,
          firstname: fname,
          email,
          password,
          role: "Applicant",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSuccessModal(true);
      } else {
        setError(data.error || "Sign up failed");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
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
              Sign Up Successful!
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              Your account has been created. You can now sign in.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowSuccessModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/signin");
                }}
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
        {/* Removed Back to dashboard link */}
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign Up
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and password to sign up!
              </p>
            </div>
            <div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* <!-- First Name --> */}
                    <div className="sm:col-span-1">
                      <Label>
                        First Name<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="fname"
                        name="fname"
                        placeholder="Enter your first name"
                        value={fname}
                        onChange={(e) => setFname(e.target.value)}
                        required
                      />
                    </div>
                    {/* <!-- Last Name --> */}
                    <div className="sm:col-span-1">
                      <Label>
                        Last Name<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="lname"
                        name="lname"
                        placeholder="Enter your last name"
                        value={lname}
                        onChange={(e) => setLname(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {/* <!-- Email --> */}
                  <div>
                    <Label>
                      Email<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {/* <!-- Password --> */}
                  <div>
                    <Label>
                      Password<span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                  {/* <!-- Checkbox --> */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      className="w-5 h-5"
                      checked={isChecked}
                      onChange={setIsChecked}
                    />
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                  </div>
                  {/* <!-- Button --> */}
                  {error && (
                    <div className="text-error-500 text-sm text-center">
                      {error}
                    </div>
                  )}
                  <div>
                    <button
                      className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-green-500 shadow-theme-xs hover:bg-green-600"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Signing up..." : "Sign Up"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-5">
                <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                  Already have an account? {""}
                  <Link
                    to="/signin"
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
