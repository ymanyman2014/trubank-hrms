import { useState, useEffect } from "react";
import axios from "axios";

type Question = {
  id: number;
  exam_composition_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  question_order: number;
};
type Exam = { id: number; type: string; name: string };

const CreateExam = () => {
  // Edit Question Modal State
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editQuestionIdx, setEditQuestionIdx] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionChoices, setEditQuestionChoices] = useState([
    "",
    "",
    "",
    "",
  ]);
  const [editQuestionAnswer, setEditQuestionAnswer] = useState("");
  const [editQuestionError, setEditQuestionError] = useState("");
  const [showEditQuestionSuccess, setShowEditQuestionSuccess] = useState(false);
  const [showAddQuestionSuccess, setShowAddQuestionSuccess] = useState(false);
  const [showDeleteQuestionSuccess, setShowDeleteQuestionSuccess] =
    useState(false);
  // (Removed duplicate useEffect for fetching questions)
  const [showDeleteCompositionModal, setShowDeleteCompositionModal] =
    useState(false);
  // const [deleteCompositionIdx, setDeleteCompositionIdx] = useState<
  //   number | null
  // >(null);
  const [showDeleteCompositionSuccess, setShowDeleteCompositionSuccess] =
    useState(false);
  const [showQuestionWarning, setShowQuestionWarning] = useState(false);
  // Compositions state
  const [compositions, setCompositions] = useState<any[]>([]);
  const [loadingCompositions, setLoadingCompositions] = useState(false);
  // Composition modal state
  const [showAddCompositionModal, setShowAddCompositionModal] = useState(false);
  const [newCompositionName, setNewCompositionName] = useState("");
  const [, setNewCompositionOrder] = useState(1);
  const [compositionError, setCompositionError] = useState("");
  const [compositionSuccess, setCompositionSuccess] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const [editCompositionIdx, setEditCompositionIdx] = useState<number | null>(
    null
  );

  // Centralized fetch functions (axios)
  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await axios.get("http://localhost:3001/api/exam");
      const data = res.data;
      if (Array.isArray(data)) {
        setExams(data);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.log("Error fetching exams:", err);
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };
  useEffect(() => {
    fetchExams();
    // Only load once on mount
  }, []);

  // Centralized fetch for compositions (axios)
  const fetchCompositions = async (examId: number | null) => {
    if (!examId) {
      setCompositions([]);
      return;
    }
    setLoadingCompositions(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/exam_composition?exam_id=${examId}`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setCompositions(data);
      } else {
        setCompositions([]);
      }
    } catch {
      setCompositions([]);
    } finally {
      setLoadingCompositions(false);
    }
  };
  useEffect(() => {
    fetchCompositions(activeExamId);
    // Only load once per exam change or composition add/delete
  }, [activeExamId, compositionSuccess, showDeleteCompositionSuccess]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingExams, setLoadingExams] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionChoices, setNewQuestionChoices] = useState([
    "",
    "",
    "",
    "",
  ]);
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("");
  const [selectedComposition, setSelectedComposition] = useState<any | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  // Centralized fetch for questions (axios)
  const fetchQuestions = async (compositionId: number | null) => {
    if (!compositionId) {
      setQuestions([]);
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:3001/api/exam_question?exam_composition_id=${compositionId}`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setQuestions(data);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    }
  };
  useEffect(() => {
    fetchQuestions(selectedComposition ? selectedComposition.id : null);
    // Only load once per composition change or question add/edit/delete
  }, [
    selectedComposition,
    showAddQuestionSuccess,
    showEditQuestionSuccess,
    showDeleteQuestionSuccess,
  ]);
  const [questionError, setQuestionError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false); // Exam modal
  const [showEditCompositionModal, setShowEditCompositionModal] =
    useState(false); // Composition modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Exam delete modal
  const [deleteCompositionIdx, setDeleteCompositionIdx] = useState<
    number | null
  >(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamType, setNewExamType] = useState("");
  const [editExamIdx, setEditExamIdx] = useState<number | null>(null);
  const [editExamName, setEditExamName] = useState("");
  const [editExamType, setEditExamType] = useState("");
  const [deleteExamIdx, setDeleteExamIdx] = useState<number | null>(null);
  const [showGenerateAIModal, setShowGenerateAIModal] = useState(false);
  const [aiExamTitle, setAIExamTitle] = useState("");
  const [aiExamType, setAIExamType] = useState("");
  const [aiNumCompositions, setAINumCompositions] = useState(1);
  const [aiNumQuestionsPerComp, setAINumQuestionsPerComp] = useState(1);
  const [aiExamGoal, setAIExamGoal] = useState("");
  const [aiError, setAIError] = useState("");
  const [showGenerateAISuccess, setShowGenerateAISuccess] = useState(false);
  const [isGeneratingAIExam, setIsGeneratingAIExam] = useState(false);

  // Filter exams by search term
  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete exam
  const openDeleteModal = (idx: number) => {
    setDeleteExamIdx(idx);
    setShowDeleteModal(true);
  };
  const handleDeleteExam = async () => {
    if (deleteExamIdx === null) return;
    const exam = exams[deleteExamIdx];
    try {
      await axios.delete(`http://localhost:3001/api/exam/${exam.id}`);
      setShowDeleteModal(false);
      setShowDeleteSuccessModal(true);
      setDeleteExamIdx(null);
      fetchExams();
    } catch {
      setShowDeleteModal(false);
      setDeleteExamIdx(null);
    }
  };

  // Delete composition
  // Removed unused openDeleteCompositionModal function
  // Removed unused handleDeleteComposition function
  // const handleDeleteComposition = async () => { ... }

  async function handleGenerateAIExam() {
    setAIError("");
    setIsGeneratingAIExam(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/generate-exam-questions",
        {
          title: aiExamTitle.trim(),
          type: aiExamType.trim(),
          numComposition: aiNumCompositions,
          numQuestionsPerComposition: aiNumQuestionsPerComp,
          goal: aiExamGoal.trim(),
        }
      );
      if (res.status === 200) {
        setShowGenerateAIModal(false);
        setShowGenerateAISuccess(true);
        setAIExamTitle("");
        setAIExamType("");
        setAINumCompositions(1);
        setAINumQuestionsPerComp(1);
        setAIExamGoal("");
        setAIError("");
        // Auto-refresh exam list after generation
        await fetchExams();
      } else {
        setAIError(res.data?.error || "Failed to generate exam questions.");
      }
    } catch (err: any) {
      setAIError(err?.response?.data?.error || "Network error.");
    } finally {
      setIsGeneratingAIExam(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Exam List
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Exams are managed by admin.
              </p>
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: "180px" }}
            />
            <button
              className="flex items-center gap-2 px-4 h-10 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Add Exam Manually"
              aria-label="Add Exam Manually"
              onClick={() => setShowAddModal(true)}
            >
              <span className="text-2xl font-bold">+</span>
              <span>Generate Exam</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 h-10 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Generate Exam (AI)"
              aria-label="Generate Exam (AI)"
              onClick={() => setShowGenerateAIModal(true)}
            >
              <span className="text-2xl font-bold">🤖</span>
              <span>Generate Exam (AI)</span>
            </button>
          </div>
        </div>
        <ul className="space-y-3">
          {loadingExams ? (
            <li className="p-3 text-center text-gray-500">Loading...</li>
          ) : filteredExams.length === 0 ? (
            <li className="p-3 text-center text-gray-500">No exams found.</li>
          ) : Array.isArray(filteredExams) ? (
            filteredExams.map((exam) => (
              <li
                key={exam.id}
                className={`p-3 rounded-lg flex justify-between items-center transition-colors cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${
                    activeExamId === exam.id
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                onClick={() => {
                  if (activeExamId !== exam.id) {
                    setActiveExamId(exam.id);
                    setCompositions([]); // Clear compositions immediately on exam change
                  }
                }}
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
                        d="M12 17v.01M8.5 7.5a4 4 0 1 1 7 0c0 2.5-2.5 4-3.5 6.5"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="font-bold text-gray-700 dark:text-white">
                      {exam.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {exam.type}
                    </div>
                  </div>
                </div>
                {/* Edit and Delete buttons grouped together */}
                <div className="flex items-center">
                  <button
                    className="ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Edit Exam"
                    aria-label="Edit Exam"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditExamIdx(exams.findIndex((e) => e.id === exam.id));
                      setEditExamName(exam.name);
                      setEditExamType(exam.type);
                      setShowEditModal(true);
                    }}
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
                  {/* Edit Exam Modal */}
                  {showEditModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      style={{
                        background: "rgba(41, 40, 40, 0.46)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-10 w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                          Edit Exam
                        </h3>
                        <input
                          type="text"
                          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                          placeholder="Exam Name"
                          value={editExamName}
                          onChange={(e) => setEditExamName(e.target.value)}
                          autoFocus
                        />
                        <select
                          className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                          value={editExamType}
                          onChange={(e) => setEditExamType(e.target.value)}
                        >
                          <option value="">Select type</option>
                          <option value="applicant">Applicant</option>
                          <option value="refresher">Refresher</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="flex justify-end gap-2">
                          <button
                            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                            onClick={() => {
                              setShowEditModal(false);
                              setEditExamIdx(null);
                              setEditExamName("");
                              setEditExamType("");
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                            onClick={async () => {
                              if (
                                editExamIdx === null ||
                                !editExamName.trim() ||
                                !editExamType.trim()
                              )
                                return;
                              const exam = exams[editExamIdx];
                              try {
                                const res = await axios.put(
                                  `http://localhost:3001/api/exam/${exam.id}`,
                                  {
                                    type: editExamType.trim(),
                                    name: editExamName.trim(),
                                  }
                                );
                                if (res.status === 200) {
                                  setShowEditModal(false);
                                  setExams((prev) => {
                                    const updated = [...prev];
                                    updated[editExamIdx] = {
                                      ...updated[editExamIdx],
                                      name: editExamName.trim(),
                                      type: editExamType.trim(),
                                    };
                                    return updated;
                                  });
                                  setEditExamIdx(null);
                                  setEditExamName("");
                                  setEditExamType("");
                                  setShowEditSuccessModal(true);
                                }
                              } catch {}
                            }}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    className="ml-2 p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    title="Delete Exam"
                    aria-label="Delete Exam"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(exams.findIndex((e) => e.id === exam.id));
                    }}
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
                  {/* Success Modal for Delete Question */}
                  {showDeleteQuestionSuccess && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      style={{
                        background: "rgba(41, 40, 40, 0.46)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                        <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                          Question Deleted!
                        </h3>
                        <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                          The question has been successfully deleted.
                        </div>
                        <button
                          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                          onClick={() => setShowDeleteQuestionSuccess(false)}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="p-3 text-center text-red-500">
              Error loading exams.
            </li>
          )}
        </ul>
        {/* Add extra space below exam list */}
        <div className="h-8" />

        {/* New Section: Compositions and Questions */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Column 1: List of Composition/s (40%) */}
          <div className="md:w-2/5 w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  List of Compositions
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected Exam ID: {activeExamId ?? "None"}
                </div>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title="Add Composition"
                aria-label="Add Composition"
                onClick={() => {
                  if (!activeExamId) {
                    setCompositionError("Select an exam first.");
                    setTimeout(() => setCompositionError(""), 2000);
                    return;
                  }
                  setShowAddCompositionModal(true);
                }}
              >
                +
              </button>
            </div>
            {/* Placeholder for compositions */}
            <ul className="space-y-3">
              {loadingCompositions ? (
                <li className="p-3 text-center text-gray-400">Loading...</li>
              ) : compositions.length === 0 ? (
                <li className="p-3 text-center text-gray-400">
                  No compositions found.
                </li>
              ) : (
                compositions
                  .sort((a, b) => a.section_order - b.section_order)
                  .map((comp, idx) => (
                    <li
                      key={comp.id}
                      className={`p-3 rounded-lg flex justify-between items-center transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedComposition &&
                        selectedComposition.id === comp.id
                          ? "bg-gray-200 dark:bg-gray-800"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedComposition(comp);
                      }}
                    >
                      <span className="font-bold text-gray-700 dark:text-white">
                        {comp.name}
                      </span>
                      <span className="flex items-center gap-1">
                        {/* Arrow Up */}
                        <button
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Move Up"
                          aria-label="Move Up"
                          disabled={idx === 0}
                          style={{ opacity: idx === 0 ? 0.5 : 1 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (idx === 0) return;
                            const newComps = [...compositions];
                            const prev = newComps[idx - 1];
                            const curr = newComps[idx];
                            const tempOrder = prev.section_order;
                            newComps[idx - 1].section_order =
                              curr.section_order;
                            newComps[idx].section_order = tempOrder;
                            await axios.put(
                              `http://localhost:3001/api/exam_composition/${prev.id}`,
                              {
                                exam_id: prev.exam_id,
                                name: prev.name,
                                section_order: newComps[idx - 1].section_order,
                              }
                            );
                            await axios.put(
                              `http://localhost:3001/api/exam_composition/${curr.id}`,
                              {
                                exam_id: curr.exam_id,
                                name: curr.name,
                                section_order: newComps[idx].section_order,
                              }
                            );
                            setCompositions(
                              newComps.sort(
                                (a, b) => a.section_order - b.section_order
                              )
                            );
                          }}
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
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        {/* Arrow Down */}
                        <button
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Move Down"
                          aria-label="Move Down"
                          disabled={idx === compositions.length - 1}
                          style={{
                            opacity: idx === compositions.length - 1 ? 0.5 : 1,
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (idx === compositions.length - 1) return;
                            const newComps = [...compositions];
                            const next = newComps[idx + 1];
                            const curr = newComps[idx];
                            const tempOrder = next.section_order;
                            newComps[idx + 1].section_order =
                              curr.section_order;
                            newComps[idx].section_order = tempOrder;
                            await axios.put(
                              `http://localhost:3001/api/exam_composition/${next.id}`,
                              {
                                exam_id: next.exam_id,
                                name: next.name,
                                section_order: newComps[idx + 1].section_order,
                              }
                            );
                            await axios.put(
                              `http://localhost:3001/api/exam_composition/${curr.id}`,
                              {
                                exam_id: curr.exam_id,
                                name: curr.name,
                                section_order: newComps[idx].section_order,
                              }
                            );
                            setCompositions(
                              newComps.sort(
                                (a, b) => a.section_order - b.section_order
                              )
                            );
                          }}
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
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {/* Pen Icon (Edit) */}
                        <button
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Edit Composition"
                          aria-label="Edit Composition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCompositionIdx(idx);
                            setNewCompositionName(comp.name);
                            setNewCompositionOrder(comp.section_order ?? 1);
                            setShowAddCompositionModal(false);
                            setShowEditCompositionModal(true);
                          }}
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
                          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                          title="Delete Composition"
                          aria-label="Delete Composition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCompositionIdx(idx);
                            setShowDeleteCompositionModal(true);
                          }}
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
                      </span>
                      {/* Dedicated Edit Composition Modal for this item */}
                      {showEditCompositionModal &&
                        editCompositionIdx === idx && (
                          <div
                            className="fixed inset-0 z-50 flex items-center justify-center"
                            style={{
                              background: "rgba(41, 40, 40, 0.46)",
                              backdropFilter: "blur(6px)",
                            }}
                          >
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md border-2 border-blue-500 flex flex-col items-center">
                              <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                                Edit Composition
                              </h3>
                              <input
                                type="text"
                                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                                placeholder="Composition Name"
                                value={newCompositionName}
                                onChange={(e) =>
                                  setNewCompositionName(e.target.value)
                                }
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 w-full">
                                <button
                                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                                  onClick={() => {
                                    setShowEditCompositionModal(false);
                                    setEditCompositionIdx(null);
                                    setNewCompositionName("");
                                    setNewCompositionOrder(1);
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                                  onClick={async () => {
                                    const comp = compositions[idx];
                                    if (!newCompositionName.trim()) return;
                                    try {
                                      const res = await axios.put(
                                        `http://localhost:3001/api/exam_composition/${comp.id}`,
                                        {
                                          exam_id: comp.exam_id,
                                          name: newCompositionName.trim(),
                                          section_order: comp.section_order,
                                        }
                                      );
                                      if (res.status === 200) {
                                        setShowEditCompositionModal(false);
                                        setEditCompositionIdx(null);
                                        setNewCompositionName("");
                                        setNewCompositionOrder(1);
                                        setCompositionSuccess(true);
                                        setTimeout(
                                          () => setCompositionSuccess(false),
                                          2000
                                        );
                                      }
                                    } catch {}
                                  }}
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                    </li>
                  ))
              )}
            </ul>
            {/* Error message if no exam selected */}
            {compositionError && (
              <div className="text-center text-red-500 text-sm mt-2">
                {compositionError}
              </div>
            )}
            {/* Add Composition Modal */}
            {/* Delete Composition Confirmation Modal */}
            {showDeleteCompositionModal && deleteCompositionIdx !== null && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-4 text-red-700 dark:text-red-400">
                    Delete Composition
                  </h3>
                  <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                    Are you sure you want to delete this composition? This
                    action cannot be undone.
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowDeleteCompositionModal(false);
                        setDeleteCompositionIdx(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                      onClick={async () => {
                        if (deleteCompositionIdx === null) return;
                        const comp = compositions[deleteCompositionIdx];
                        try {
                          const res = await axios.delete(
                            `http://localhost:3001/api/exam_composition/${comp.id}`
                          );
                          if (res.status === 200) {
                            setCompositions((prev) =>
                              prev.filter((_, i) => i !== deleteCompositionIdx)
                            );
                            setShowDeleteCompositionModal(false);
                            setDeleteCompositionIdx(null);
                            setShowDeleteCompositionSuccess(true);
                            setTimeout(
                              () => setShowDeleteCompositionSuccess(false),
                              2000
                            );
                          } else {
                            setShowDeleteCompositionModal(false);
                            setDeleteCompositionIdx(null);
                          }
                        } catch {
                          setShowDeleteCompositionModal(false);
                          setDeleteCompositionIdx(null);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Composition Success Modal */}
            {showDeleteCompositionSuccess && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                    Composition Deleted!
                  </h3>
                  <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                    The composition has been successfully deleted.
                  </div>
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    onClick={() => setShowDeleteCompositionSuccess(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
            {showAddCompositionModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Add Composition
                  </h3>
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                    placeholder="Composition Name"
                    value={newCompositionName}
                    onChange={(e) => setNewCompositionName(e.target.value)}
                    autoFocus
                  />
                  {/* Removed section order input */}
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowAddCompositionModal(false);
                        setNewCompositionName("");
                        setNewCompositionOrder(1);
                        setCompositionError("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                      onClick={async () => {
                        if (!newCompositionName.trim()) {
                          setCompositionError("Name required.");
                          return;
                        }
                        if (!activeExamId) {
                          setCompositionError("Select an exam first.");
                          return;
                        }
                        const sectionOrder = compositions.length + 1;
                        try {
                          const res = await axios.post(
                            "http://localhost:3001/api/exam_composition",
                            {
                              exam_id: activeExamId,
                              name: newCompositionName.trim(),
                              section_order: sectionOrder,
                            }
                          );
                          if (res.status === 200) {
                            setCompositionSuccess(true);
                            setShowAddCompositionModal(false);
                            setNewCompositionName("");
                            setCompositionError("");
                            setTimeout(
                              () => setCompositionSuccess(false),
                              2000
                            );
                          } else {
                            setCompositionError("Failed to add composition.");
                          }
                        } catch {
                          setCompositionError("Failed to add composition.");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Success message */}
            {compositionSuccess && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                    Composition Added!
                  </h3>
                  <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                    The composition has been successfully added.
                  </div>
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    onClick={() => setCompositionSuccess(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Column 2: List of Question/s (60%) */}
          <div className="md:w-3/5 w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  List of Questions
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected Composition ID:{" "}
                  {selectedComposition ? selectedComposition.id : "None"}
                </div>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title="Add Question"
                aria-label="Add Question"
                onClick={() => {
                  if (!selectedComposition) {
                    setShowQuestionWarning(true);
                    setTimeout(() => setShowQuestionWarning(false), 2000);
                    return;
                  }
                  setShowAddQuestionModal(true);
                  setNewQuestionText("");
                  setNewQuestionChoices(["", "", "", ""]);
                  setNewQuestionAnswer("");
                  setQuestionError("");
                }}
              >
                +
              </button>
            </div>

            {/* Add Question Modal */}
            {showAddQuestionModal && selectedComposition && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Add Question
                  </h3>
                  <div className="mb-4">
                    <textarea
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      rows={2}
                      placeholder="Enter question text"
                    />
                  </div>
                  <div className="mb-4">
                    {newQuestionChoices.map((choice, i) => (
                      <input
                        key={i}
                        type="text"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                        placeholder={`Choice ${i + 1}`}
                        value={choice}
                        onChange={(e) => {
                          const updated = [...newQuestionChoices];
                          updated[i] = e.target.value;
                          setNewQuestionChoices(updated);
                        }}
                      />
                    ))}
                  </div>
                  <div className="mb-4">
                    <select
                      className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                      value={newQuestionAnswer}
                      onChange={(e) => setNewQuestionAnswer(e.target.value)}
                    >
                      <option value="">Select answer</option>
                      {newQuestionChoices.map((choice, i) => (
                        <option key={i} value={choice}>{`Choice ${
                          i + 1
                        }: ${choice}`}</option>
                      ))}
                    </select>
                  </div>
                  {questionError && (
                    <div className="text-center text-red-500 text-sm mb-2">
                      {questionError}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={() => {
                        setShowAddQuestionModal(false);
                        setSelectedComposition(null);
                        setNewQuestionText("");
                        setNewQuestionChoices(["", "", "", ""]);
                        setNewQuestionAnswer("");
                        setQuestionError("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                      onClick={async () => {
                        if (!selectedComposition || !selectedComposition.id) {
                          setQuestionError("Select a valid composition.");
                          return;
                        }
                        if (!newQuestionText.trim()) {
                          setQuestionError("Enter a question.");
                          return;
                        }
                        if (newQuestionChoices.some((c) => !c.trim())) {
                          setQuestionError("All choices required.");
                          return;
                        }
                        if (!newQuestionAnswer.trim()) {
                          setQuestionError("Select an answer.");
                          return;
                        }
                        // Determine next question_order
                        let nextOrder = 1;
                        if (questions && questions.length > 0) {
                          nextOrder =
                            Math.max(
                              ...questions.map((q) => q.question_order || 0)
                            ) + 1;
                        }
                        // Prepare correct_option as A/B/C/D
                        let correctOpt = "";
                        const idx = newQuestionChoices.findIndex(
                          (c) => c === newQuestionAnswer
                        );
                        if (idx === 0) correctOpt = "A";
                        else if (idx === 1) correctOpt = "B";
                        else if (idx === 2) correctOpt = "C";
                        else if (idx === 3) correctOpt = "D";
                        else {
                          setQuestionError(
                            "Correct option must match one of the choices."
                          );
                          return;
                        }
                        try {
                          const res = await axios.post(
                            "http://localhost:3001/api/exam_question",
                            {
                              exam_composition_id: selectedComposition.id,
                              question: newQuestionText.trim(),
                              option_a: newQuestionChoices[0].trim(),
                              option_b: newQuestionChoices[1].trim(),
                              option_c: newQuestionChoices[2].trim(),
                              option_d: newQuestionChoices[3].trim(),
                              correct_option: correctOpt,
                              question_order: nextOrder,
                            }
                          );
                          if (res.status === 200) {
                            setShowAddQuestionModal(false);
                            setNewQuestionText("");
                            setNewQuestionChoices(["", "", "", ""]);
                            setNewQuestionAnswer("");
                            setQuestionError("");
                            setShowAddQuestionSuccess(true);
                            // Refetch questions
                            fetch(
                              `http://localhost:3001/api/exam_question?exam_composition_id=${selectedComposition.id}`
                            )
                              .then((r) => r.json())
                              .then((data) => {
                                setQuestions(Array.isArray(data) ? data : []);
                              });
                          } else {
                            const errData = res.data;
                            setQuestionError(
                              errData.error || "Failed to add question."
                            );
                          }
                        } catch (err) {
                          setQuestionError("Network error.");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Modal for Add Question */}
            {showAddQuestionSuccess && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                  background: "rgba(41, 40, 40, 0.46)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                  <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                    Question Added!
                  </h3>
                  <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                    The question has been successfully added.
                  </div>
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    onClick={() => setShowAddQuestionSuccess(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* Question List */}
            <ul className="space-y-3">
              {questions.length === 0 ? (
                <li className="p-3 text-center text-gray-400">
                  No questions found.
                </li>
              ) : (
                questions.map((q, idx) => (
                  <li
                    key={q.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {q.question}
                      </span>
                      <span className="flex items-center gap-1">
                        {/* Arrow Up */}
                        <button
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Move Up"
                          aria-label="Move Up"
                          disabled={idx === 0}
                          style={{ opacity: idx === 0 ? 0.5 : 1 }}
                          onClick={() => {
                            /* TODO: Implement move up logic */
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4 text-gray-500 dark:text-gray-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        {/* Arrow Down */}
                        <button
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Move Down"
                          aria-label="Move Down"
                          disabled={idx === questions.length - 1}
                          style={{
                            opacity: idx === questions.length - 1 ? 0.5 : 1,
                          }}
                          onClick={() => {
                            /* TODO: Implement move down logic */
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4 text-gray-500 dark:text-gray-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Pen Icon (Edit) */}
                        <button
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Edit Question"
                          aria-label="Edit Question"
                          onClick={() => {
                            setEditQuestionIdx(idx);
                            setEditQuestionText(q.question);
                            setEditQuestionChoices([
                              q.option_a,
                              q.option_b,
                              q.option_c,
                              q.option_d,
                            ]);
                            setEditQuestionAnswer(q.correct_option);
                            setEditQuestionError("");
                            setShowEditQuestionModal(true);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4 text-gray-500 dark:text-gray-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h12"
                            />
                          </svg>
                        </button>

                        {/* Trash Icon (Delete) */}
                        <button
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                          title="Delete Question"
                          aria-label="Delete Question"
                          onClick={async () => {
                            try {
                              const res = await axios.delete(
                                `http://localhost:3001/api/exam_question/${q.id}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              if (res.status === 200) {
                                setQuestions((prev) =>
                                  prev.filter((item) => item.id !== q.id)
                                );
                                setShowDeleteQuestionSuccess(true);
                              }
                            } catch {}
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4 text-red-500 dark:text-red-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-200 mt-1">
                      Order: {q.question_order}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="text-gray-700 dark:text-gray-100">
                        A: {q.option_a}
                      </div>
                      <div className="text-gray-700 dark:text-gray-100">
                        B: {q.option_b}
                      </div>
                      <div className="text-gray-700 dark:text-gray-100">
                        C: {q.option_c}
                      </div>
                      <div className="text-gray-700 dark:text-gray-100">
                        D: {q.option_d}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      Correct: {q.correct_option}
                    </div>
                    {/* Edit Question Modal */}
                    {showEditQuestionModal && editQuestionIdx === idx && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{
                          background: "rgba(41, 40, 40, 0.46)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-lg">
                          <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                            Edit Question
                          </h3>
                          <div className="mb-4">
                            <textarea
                              className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                              value={editQuestionText}
                              onChange={(e) =>
                                setEditQuestionText(e.target.value)
                              }
                              rows={2}
                              placeholder="Enter question text"
                            />
                          </div>
                          <div className="mb-4">
                            {editQuestionChoices.map((choice, i) => (
                              <input
                                key={i}
                                type="text"
                                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-2"
                                placeholder={`Choice ${i + 1}`}
                                value={choice}
                                onChange={(e) => {
                                  const updated = [...editQuestionChoices];
                                  updated[i] = e.target.value;
                                  setEditQuestionChoices(updated);
                                }}
                              />
                            ))}
                          </div>
                          <div className="mb-4">
                            <select
                              className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                              value={editQuestionAnswer}
                              onChange={(e) =>
                                setEditQuestionAnswer(e.target.value)
                              }
                            >
                              <option value="">Select answer</option>
                              {editQuestionChoices.map((choice, i) => (
                                <option key={i} value={choice}>
                                  {choice
                                    ? `Choice ${i + 1}: ${choice}`
                                    : `Choice ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          {editQuestionError && (
                            <div className="text-center text-red-500 text-sm mb-2">
                              {editQuestionError}
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <button
                              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                              onClick={() => {
                                setShowEditQuestionModal(false);
                                setEditQuestionIdx(null);
                                setEditQuestionText("");
                                setEditQuestionChoices(["", "", "", ""]);
                                setEditQuestionAnswer("");
                                setEditQuestionError("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                              onClick={async () => {
                                if (
                                  !editQuestionText.trim() ||
                                  editQuestionChoices.some((c) => !c.trim()) ||
                                  !editQuestionAnswer.trim()
                                ) {
                                  setEditQuestionError(
                                    "Please fill all fields."
                                  );
                                  return;
                                }
                                const questionId = q.id;
                                try {
                                  const res = await axios.put(
                                    `http://localhost:3001/api/exam_question/${questionId}`,
                                    {
                                      exam_composition_id:
                                        q.exam_composition_id,
                                      question: editQuestionText.trim(),
                                      option_a: editQuestionChoices[0].trim(),
                                      option_b: editQuestionChoices[1].trim(),
                                      option_c: editQuestionChoices[2].trim(),
                                      option_d: editQuestionChoices[3].trim(),
                                      correct_option: editQuestionAnswer.trim(),
                                      question_order: q.question_order,
                                    }
                                  );
                                  if (res.status === 200) {
                                    setShowEditQuestionModal(false);
                                    setEditQuestionIdx(null);
                                    setEditQuestionText("");
                                    setEditQuestionChoices(["", "", "", ""]);
                                    setEditQuestionAnswer("");
                                    setEditQuestionError("");
                                    setShowEditQuestionSuccess(true);
                                    // Refresh questions
                                    const updated = res.data;
                                    setQuestions((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? { ...item, ...updated }
                                          : item
                                      )
                                    );
                                  } else {
                                    setEditQuestionError(
                                      "Failed to update question."
                                    );
                                  }
                                } catch {
                                  setEditQuestionError(
                                    "Failed to update question."
                                  );
                                }
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Modal for Edit Question */}
                    {showEditQuestionSuccess && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{
                          background: "rgba(41, 40, 40, 0.46)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
                          <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                            Question Updated!
                          </h3>
                          <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                            The question has been successfully updated.
                          </div>
                          <button
                            className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                            onClick={() => setShowEditQuestionSuccess(false)}
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
            {/* Warning if no composition selected */}
            {showQuestionWarning && (
              <div className="text-center text-red-500 text-sm mt-4 font-semibold">
                Select composition first.
              </div>
            )}
          </div>
        </div>

        {/* Add Exam Modal */}
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
                Add Exam
              </h3>
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Exam Name"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                autoFocus
              />
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value)}
              >
                <option value="">Select type</option>
                <option value="applicant">Applicant</option>
                <option value="refresher">Refresher</option>
                <option value="other">Other</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewExamName("");
                    setNewExamType("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                  onClick={async () => {
                    if (!newExamName.trim() || !newExamType.trim()) {
                      // You may want to show an error modal or message here
                      return;
                    }
                    try {
                      const res = await axios.post(
                        "http://localhost:3001/api/exam",
                        {
                          name: newExamName.trim(),
                          type: newExamType.trim(),
                        }
                      );
                      if (res.status === 200) {
                        const newExam = res.data;
                        setExams((prev) => [...prev, newExam]);
                        setShowAddModal(false);
                        setShowSuccessModal(true);
                        setNewExamName("");
                        setNewExamType("");
                      } else {
                        // You may want to show an error modal or message here
                      }
                    } catch {
                      // You may want to show an error modal or message here
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

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
                Delete Exam
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                Are you sure you want to delete this exam? This action cannot be
                undone.
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteExamIdx(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                  onClick={handleDeleteExam}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal (Add) */}
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
                Exam Added!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                Your exam has been successfully added.
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
        {/* Success Modal (Edit) */}
        {showEditSuccessModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                Exam Updated!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                Your exam has been successfully updated.
              </div>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowEditSuccessModal(false)}
              >
                OK
              </button>
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
                Exam Deleted!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                The exam has been successfully deleted.
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

        {/* Generate Exam (AI) Modal */}
        {showGenerateAIModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-10 w-full max-w-lg">
              <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                Generate Exam (AI)
              </h3>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Exam Title
              </label>
              <input
                type="text"
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Exam Title"
                value={aiExamTitle}
                onChange={(e) => setAIExamTitle(e.target.value)}
                autoFocus
              />
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Exam Type
              </label>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                value={aiExamType}
                onChange={(e) => setAIExamType(e.target.value)}
              >
                <option value="">Select type</option>
                <option value="applicant">Applicant</option>
                <option value="refresher">Refresher</option>
              </select>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Number of Compositions
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Number of Compositions"
                value={aiNumCompositions}
                onChange={(e) => setAINumCompositions(Number(e.target.value))}
              />
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Number of Questions per Composition
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Number of Questions per Composition"
                value={aiNumQuestionsPerComp}
                onChange={(e) =>
                  setAINumQuestionsPerComp(Number(e.target.value))
                }
              />
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Goal of the Exam
              </label>
              <textarea
                className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 mb-4"
                placeholder="Goal of the Exam"
                value={aiExamGoal}
                onChange={(e) => setAIExamGoal(e.target.value)}
                rows={3}
              />
              {aiError && (
                <div className="text-center text-red-500 text-sm mb-2">
                  {aiError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowGenerateAIModal(false);
                    setAIExamTitle("");
                    setAIExamType("");
                    setAINumCompositions(1);
                    setAINumQuestionsPerComp(1);
                    setAIExamGoal("");
                    setAIError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center min-w-[100px]"
                  onClick={() => {
                    if (
                      !aiExamTitle.trim() ||
                      !aiExamType.trim() ||
                      aiNumCompositions < 1 ||
                      aiNumQuestionsPerComp < 1 ||
                      !aiExamGoal.trim()
                    ) {
                      setAIError("All fields are required and must be valid.");
                      return;
                    }
                    handleGenerateAIExam();
                  }}
                  disabled={isGeneratingAIExam}
                >
                  {isGeneratingAIExam ? (
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
                      Generating...
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {showGenerateAISuccess && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(41, 40, 40, 0.46)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                Exam Generation Successful!
              </h3>
              <div className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                The exam and questions have been generated successfully.
              </div>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={() => setShowGenerateAISuccess(false)}
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

export default CreateExam;
