import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
// @ts-ignore
import * as faceapi from "face-api.js";

export default function JobApplicationLanding() {
  // Get userId, jobId, and examId from URL params as variables
  const params = useParams();
  const userId = params.userId ? Number(params.userId) : null;
  const jobId = params.jobId ? Number(params.jobId) : null;
  const examId = params.examId ? Number(params.examId) : null;
  // All state declarations at the top
  // Initialize employeeId and examIdState from variables
  // Always keep employeeId = userId, examIdState = examId
  const [employeeId, setEmployeeId] = useState<number | null>(userId);
  const [examIdState, setExamIdState] = useState<number | null>(examId);
  // Set employeeId and examIdState from params on mount
  // Keep employeeId and examIdState in sync with URL params
  useEffect(() => {
    setEmployeeId(userId);
    setExamIdState(examId);
  }, [userId, examId]);
  const [restrictionError, setRestrictionError] = useState("");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [proctoringError, setProctoringError] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [step, setStep] = useState(1);
  // Only keep userId, jobId, examId for exam flow
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const navigate = useNavigate();
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCheckLoading, setFaceCheckLoading] = useState(false);
  const [faceCheckError, setFaceCheckError] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [, setExamSubmitted] = useState(false);
  const [jobTitle, setJobTitle] = useState("");

  // Modal state for no face detected warning
  const [showNoFaceModal, setShowNoFaceModal] = useState(false);
  const [noFaceCountdown, setNoFaceCountdown] = useState(10);

  // Ensure video element displays the camera stream
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);
  // Helper: End exam and exit fullscreen
  const endExam = (reason: string) => {
    setRestrictionError(reason);
    setTimerActive(false);
    setExamStarted(false);
    setStep(3);
  };

  // Exit fullscreen automatically when step 5 is reached
  useEffect(() => {
    if (step === 5 && document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, [step]);

  // Open camera and show preview
  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setFaceCheckError("Camera access denied or not available.");
    }
  };
  // Pre-exam face detection effect (step 2, before examStarted)
  useEffect(() => {
    let video: HTMLVideoElement | null = null;
    let interval: NodeJS.Timeout;
    let modelsLoaded = false;
    async function startPreExamFaceDetection() {
      if (step === 2 && !examStarted && showCamera && videoRef.current) {
        setFaceCheckLoading(true);
        setFaceCheckError("");
        try {
          // Load models if not already loaded
          if (!modelsLoaded) {
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            modelsLoaded = true;
            console.log("FaceAPI: Model loaded");
          }
        } catch (err) {
          setFaceCheckError(
            "Face detection model failed to load. Please check /models folder and reload the page."
          );
          setFaceCheckLoading(false);
          console.error("FaceAPI: Model load error", err);
          return;
        }
        try {
          // Use the camera preview video element
          video = videoRef.current;
          interval = setInterval(async () => {
            if (video && video.readyState === 4) {
              try {
                const result = await faceapi.detectSingleFace(
                  video,
                  new faceapi.TinyFaceDetectorOptions()
                );
                console.log("FaceAPI: Detection result", result);
                if (result) {
                  setFaceDetected(true);
                  setFaceCheckError("");
                } else {
                  setFaceDetected(false);
                  setFaceCheckError(
                    "No face detected. Please ensure your face is visible to the camera."
                  );
                }
                setFaceCheckLoading(false);
              } catch (detectErr) {
                setFaceCheckError(
                  "Face detection failed. Please check your camera and reload the page."
                );
                setFaceCheckLoading(false);
                console.error("FaceAPI: Detection error", detectErr);
              }
            }
          }, 1500);
        } catch (camErr) {
          setFaceCheckError(
            "Camera access error. Please check your camera permissions and reload the page."
          );
          setFaceCheckLoading(false);
          console.error("FaceAPI: Camera error", camErr);
        }
      }
    }
    startPreExamFaceDetection();
    return () => {
      if (interval) clearInterval(interval);
      setFaceDetected(false);
      setFaceCheckError("");
      setFaceCheckLoading(false);
    };
  }, [step, examStarted, showCamera, videoRef]);

  // Navigation handlers
  const handleProceedToExam = async () => {
    // Always use employeeId = userId, examIdState = examId, jobId = jobId
    const eventType = jobId === 0 ? "Refresher" : "Applicant";
    console.log("handleProceedToExam debug:", {
      employeeId,
      examId,
      jobId,
      eventType,
    });
    if (!employeeId || !examId || jobId === null || jobId === undefined) {
      // If required params are not set, cannot log event
      setStep((s) => Math.min(s + 1, 3));
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  // Exam submit: calculate score per composition and save to DB
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamSubmitted(true);

    // Group questions by exam_composition_id
    const compositionMap: Record<number, any[]> = {};
    examQuestions.forEach((q) => {
      if (!compositionMap[q.exam_composition_id])
        compositionMap[q.exam_composition_id] = [];
      compositionMap[q.exam_composition_id].push(q);
    });

    // Calculate scores per composition
    const scores: {
      exam_composition_id: number;
      total_items: number;
      score: number;
    }[] = [];
    Object.entries(compositionMap).forEach(([compId, questions]) => {
      let total = questions.length;
      let correct = 0;
      questions.forEach((q: any) => {
        if (examAnswers[q.id] && examAnswers[q.id] === q.correct_option)
          correct++;
      });
      scores.push({
        exam_composition_id: Number(compId),
        total_items: total,
        score: correct,
      });
    });

    // Save scores to backend
    try {
      if (employeeId && examIdState) {
        // Fetch the latest proctoring event for this employee/exam/job
        let proctoring_event_id = null;
        try {
          const res = await axios.get(
            `http://localhost:3001/api/proctoring_event/exists/${employeeId}/${jobId}/${examIdState}`
          );
          console.log("[Exam Submit] proctoring_event_id response:", res.data);
          if (res.data && res.data.id) {
            proctoring_event_id = res.data.id;
          }
        } catch (err) {
          console.warn("Could not fetch proctoring_event_id", err);
        }
        console.log(
          "[Exam Submit] Sending proctoring_event_id:",
          proctoring_event_id
        );
        await axios.post("http://localhost:3001/api/exam-score", {
          employee_id: employeeId,
          exam_id: examIdState,
          scores,
          proctoring_event_id,
        });
      } else {
        throw new Error("Employee or exam ID missing.");
      }
    } catch (err) {
      console.error("Failed to save exam scores", err);
    }

    setStep(3);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < examQuestions.length - 1) {
      setCurrentQuestionIdx((idx) => idx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((idx) => idx - 1);
    }
  };

  const handleStartExam = async () => {
    setProctoringError("");
    // Only allow starting if face detected
    if (!faceDetected) {
      setProctoringError(
        "Cannot start exam: No face detected. Please ensure your face is visible to the camera."
      );
      return;
    }
    // Validate employeeId
    console.log("handleStartExam: employeeId (userId)", employeeId);
    if (!employeeId || isNaN(employeeId)) {
      setProctoringError(
        "Cannot start exam: Invalid or missing employee ID (userId). Please contact support."
      );
      return;
    }
    // Log proctoring event
    const eventType = jobId === 0 ? "Refresher" : "Applicant";
    try {
      await axios.post("http://localhost:3001/api/proctoring", {
        employee_id: employeeId,
        exam_id: examIdState,
        job_id: jobId,
        event_type: eventType,
        event_detail: "Proctoring session started",
      });
      // Fetch exam questions for this exam_id
      if (examIdState) {
        const questionsRes = await axios.get(
          `http://localhost:3001/api/exam_composition?exam_id=${examIdState}`
        );
        // Flatten all questions from all compositions
        let allQuestions: any[] = [];
        for (const comp of questionsRes.data) {
          const compQuestionsRes = await axios.get(
            `http://localhost:3001/api/exam_question?exam_composition_id=${comp.id}`
          );
          allQuestions = allQuestions.concat(compQuestionsRes.data);
        }
        setExamQuestions(allQuestions);
      }
    } catch (err) {
      setProctoringError(
        "Failed to start AI proctoring. Please try again or contact support."
      );
      console.error("Proctoring POST error:", err);
      return;
    }
    // Request fullscreen after exam setup, before showing questions
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (err) {
      setProctoringError(
        "Fullscreen is required for AI proctoring. Please allow fullscreen mode."
      );
      return;
    }
    setExamStarted(true);
    setTimerActive(true);
  };

  // Timer effect (runs outside handleStartExam)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && examStarted && step === 2) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setExamSubmitted(true);
            setStep(3);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, examStarted, step]);

  // End exam if user exits fullscreen during exam
  useEffect(() => {
    function handleFullscreenChange() {
      if (examStarted && step === 2 && !document.fullscreenElement) {
        endExam("Exam ended: Fullscreen mode exited.");
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examStarted, step]);

  // End exam if user switches screen (tab/window) during exam
  useEffect(() => {
    function handleVisibilityChange() {
      if (examStarted && step === 2 && document.visibilityState === "hidden") {
        endExam("Exam ended: Tab or window switch detected.");
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examStarted, step]);

  // End exam if no face detected during exam (real detection)
  useEffect(() => {
    let video: HTMLVideoElement | null = null;
    let interval: NodeJS.Timeout;
    let modelsLoaded = false;
    let noFaceActive = false;
    async function startFaceDetection() {
      if (examStarted && step === 2) {
        try {
          // Load models if not already loaded
          if (!modelsLoaded) {
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            modelsLoaded = true;
          }
          video = document.createElement("video");
          video.autoplay = true;
          video.width = 320;
          video.height = 240;
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          video.srcObject = stream;
          video.style.display = "none";
          document.body.appendChild(video);
          interval = setInterval(async () => {
            if (video && video.readyState === 4) {
              const result = await faceapi.detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions()
              );
              if (!result) {
                if (!noFaceActive) {
                  noFaceActive = true;
                  setShowNoFaceModal(true);
                  setNoFaceCountdown(10);
                }
              } else {
                if (noFaceActive) {
                  noFaceActive = false;
                  setShowNoFaceModal(false);
                  setNoFaceCountdown(10);
                }
              }
            }
          }, 1000);
        } catch {
          endExam("Exam ended: Camera error.");
        }
      }
    }
    startFaceDetection();
    return () => {
      if (video) {
        video.srcObject = null;
        document.body.removeChild(video);
      }
      if (interval) clearInterval(interval);
      setShowNoFaceModal(false);
      setNoFaceCountdown(10);
    };
  }, [examStarted, step]);

  // Countdown effect for no face detected modal
  useEffect(() => {
    if (showNoFaceModal) {
      if (noFaceCountdown === 0) {
        setShowNoFaceModal(false);
        endExam("Exam ended: No face detected by camera for 10 seconds.");
        return;
      }
      const countdownInterval = setInterval(() => {
        setNoFaceCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [showNoFaceModal, noFaceCountdown]);

  useEffect(() => {
    if (jobId === 0) {
      setJobTitle("Employee's Refresher Examination");
    } else if (jobId) {
      axios
        .get(`http://localhost:3001/api/job_opening_exam/${jobId}`)
        .then((res) => {
          if (res.data && res.data.title) {
            setJobTitle(res.data.title + " Examination");
          } else {
            setJobTitle("");
          }
        })
        .catch(() => setJobTitle(""));
    }
  }, [jobId]);

  return (
    <div className="dark p-6 max-w-2xl mx-auto bg-gray-900 min-h-screen flex items-center justify-center">
      {/* Modal for no face detected warning */}
      {showNoFaceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#222",
              borderRadius: "16px",
              padding: "2.5em 2em",
              boxShadow: "0 0 24px 0 rgba(0,0,0,0.5)",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <h2 className="text-xl font-bold text-red-400 mb-4">
              Warning: No Face Detected
            </h2>
            <p className="text-gray-200 mb-2">
              Please ensure your face is visible to the camera.
              <br />
              The exam will end in
              <span className="text-red-400 font-bold text-2xl mx-2">
                {noFaceCountdown}
              </span>
              seconds if your face is not detected again.
            </p>
            <p className="text-gray-400 text-sm">
              If your face is detected before the countdown ends, you may
              continue the exam.
            </p>
          </div>
        </div>
      )}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-lg p-8 flex flex-col items-stretch justify-center gap-8 w-full">
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 60% 40%, rgba(34,197,94,0.08) 0%, transparent 70%)",
          }}
        ></div>
        {/* Profile, name, email, number, address, update button */}
        <div className="flex flex-col items-center justify-center w-full">
          <h1 className="text-2xl font-bold text-green-400 mb-2">
            TRUBank Job Application
          </h1>
          {/* Always render a space below heading, show job title or fallback */}
          <div style={{ minHeight: "2.5em", width: "100%" }}>
            {(() => {
              // Debug log for params.jobId and jobTitle
              console.log(
                "JobApplicationLanding params.jobId:",
                params.jobId,
                "jobTitle:",
                jobTitle
              );
              if (params.jobId) {
                if (jobTitle) {
                  return (
                    <h2 className="text-xl font-semibold text-white mb-4 text-center">
                      {jobTitle}
                    </h2>
                  );
                } else {
                  return (
                    <h2 className="text-xl font-semibold text-red-400 mb-4 text-center">
                      Job title not found
                    </h2>
                  );
                }
              } else {
                return <div className="mb-4" />;
              }
            })()}
          </div>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        {step === 1 && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-green-400">
              Step 1: Examination Mechanics
            </h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                The examination you will take is
                <span className="font-semibold text-green-400">
                  {" "}
                  AI monitored
                </span>
                . You are{" "}
                <span className="font-semibold text-red-400">
                  not allowed to switch screen
                </span>
                —doing so will end your examination.
              </p>
              <p>
                Make sure your camera is working. The exam is powered by an AI
                proctoring system and
                <span className="font-semibold text-green-400">
                  {" "}
                  your appearance must be visible
                </span>
                while taking the exam.
              </p>
              <p>
                <span className="font-semibold text-green-400">
                  Read carefully:
                </span>{" "}
                You will have
                <span className="font-semibold text-green-400">
                  {" "}
                  15 minutes
                </span>{" "}
                to complete the examination. Good luck!
              </p>
              <p>
                Results will be sent to your email within
                <span className="font-semibold text-green-400">
                  {" "}
                  48 - 72 hours
                </span>
                .
              </p>
            </div>
            <div className="flex justify-end mt-10">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleProceedToExam}
              >
                Proceed to Exam
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-green-400">
              Step 2: Online Exam
            </h2>
            {!examStarted ? (
              <>
                <p className="text-gray-300 mb-4">
                  Before starting, please allow camera access and ensure your
                  Before starting, please allow camera access and ensure your
                  face is visible.
                  <br />
                  When you are ready, click{" "}
                  <span className="font-semibold">Start Exam</span> to begin.
                  <br />
                  The timer will start and you must complete the exam within 15
                  minutes.
                  <br />
                  Your camera will be activated and the exam will switch to
                  fullscreen for AI proctoring.
                </p>
                {/* Camera preview and open button */}
                <div className="mb-4 flex flex-col items-center">
                  {!showCamera && (
                    <button
                      className="mb-2 px-4 py-2 bg-green-600 text-white rounded font-semibold"
                      type="button"
                      onClick={handleOpenCamera}
                    >
                      Open Camera Preview
                    </button>
                  )}
                  {showCamera && (
                    <video
                      ref={videoRef}
                      autoPlay
                      width={320}
                      height={240}
                      style={{
                        borderRadius: "8px",
                        border: "2px solid #38a169",
                      }}
                    />
                  )}
                </div>
                {faceCheckLoading && (
                  <div className="text-blue-400 text-sm mb-2">
                    Checking for face...
                  </div>
                )}
                {faceCheckError && (
                  <div className="text-red-400 text-sm mb-2">
                    {faceCheckError}
                  </div>
                )}
                {(proctoringError || restrictionError) && (
                  <div className="text-red-400 text-sm mb-3">
                    {proctoringError || restrictionError}
                  </div>
                )}
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    type="button"
                    onClick={handlePrev}
                  >
                    Back
                  </button>
                  <button
                    className={`px-4 py-2 rounded font-semibold ${
                      showCamera && faceDetected
                        ? "bg-green-600 text-white"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                    type="button"
                    onClick={handleStartExam}
                    disabled={!(showCamera && faceDetected)}
                  >
                    Start Exam
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <span className="font-bold text-lg text-red-400">
                    Time Left:{" "}
                    {Math.floor(timeLeft / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <form className="space-y-4" onSubmit={handleExamSubmit}>
                  {examQuestions.length > 0 ? (
                    <>
                      <div
                        key={examQuestions[currentQuestionIdx]?.id}
                        className="mb-8 flex flex-col items-center justify-center"
                      >
                        <div className="font-bold text-2xl md:text-3xl text-center text-green-700 mb-6">
                          {currentQuestionIdx + 1}.{" "}
                          {examQuestions[currentQuestionIdx]?.question}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                          {["A", "B", "C", "D"].map((opt) => {
                            const selected =
                              examAnswers[
                                examQuestions[currentQuestionIdx]?.id
                              ] === opt;
                            return (
                              <label
                                key={opt}
                                className={`block w-full text-center rounded-lg border px-4 py-3 cursor-pointer transition-all duration-150 text-base font-medium border-gray-200 ${
                                  selected
                                    ? "bg-green-600 text-white border-green-600"
                                    : "bg-white text-gray-800"
                                } hover:bg-green-500 hover:text-white`}
                                style={{ minHeight: "44px" }}
                              >
                                <input
                                  type="radio"
                                  name={`q_${examQuestions[currentQuestionIdx]?.id}`}
                                  value={opt}
                                  checked={selected}
                                  onChange={() =>
                                    setExamAnswers((prev) => ({
                                      ...prev,
                                      [examQuestions[currentQuestionIdx]?.id]:
                                        opt,
                                    }))
                                  }
                                  className="hidden"
                                />
                                <span className="inline-block w-full py-1">
                                  {
                                    examQuestions[currentQuestionIdx]?.[
                                      `option_${opt.toLowerCase()}`
                                    ]
                                  }
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex justify-between mt-6">
                        <button
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition"
                          type="button"
                          onClick={handlePrevQuestion}
                          disabled={currentQuestionIdx === 0}
                        >
                          Previous
                        </button>
                        {currentQuestionIdx < examQuestions.length - 1 ? (
                          <button
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
                            type="button"
                            onClick={handleNextQuestion}
                            disabled={
                              !examAnswers[
                                examQuestions[currentQuestionIdx]?.id
                              ]
                            }
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
                            type="submit"
                            disabled={
                              !examAnswers[
                                examQuestions[currentQuestionIdx]?.id
                              ]
                            }
                          >
                            Submit Exam
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400">Loading exam questions...</p>
                  )}
                </form>
              </>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-green-400">Thank You!</h2>
            <p className="text-gray-300">
              We have received your application and exam submission.
              <br />
              We will send you an email of confirmation within{" "}
              <span className="font-semibold text-green-400">24-42 hours</span>.
              <br />
              <span className="font-semibold text-green-400">
                Best of luck in your career journey!
              </span>
            </p>
            <button
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-semibold"
              onClick={() => {
                navigate("/");
                window.location.reload();
              }}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
