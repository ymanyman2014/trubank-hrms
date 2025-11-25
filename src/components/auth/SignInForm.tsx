import React, { useState } from "react";
// Removed unused Link import
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useNavigate } from "react-router-dom";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import Label from "../form/Label";

export default function SignInForm() {
  // Only one set of state declarations below
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check session on mount
  React.useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (userId) {
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "employee" || role === "hr") {
        navigate("/employee");
      } else if (role === "applicant") {
        navigate("/applicant");
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Save userId and role to localStorage
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);
        const role = (data.role || "").toLowerCase();
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "employee" || role === "hr") {
          navigate("/employee");
        } else if (role === "applicant") {
          navigate("/applicant");
        } else {
          navigate("/");
        }
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                </div>
                {error && (
                  <div className="text-error-500 text-sm text-center">
                    {error}
                  </div>
                )}
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                  </span>
                  <a
                    href="/signup"
                    className="text-green-600 hover:underline dark:text-green-400"
                  >
                    Sign up
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
