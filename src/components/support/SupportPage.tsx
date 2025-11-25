import React from "react";
// ...existing code...

// ...existing code...

export function SetQuestionsList() {
  const [deleteModal, setDeleteModal] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editQuestion, setEditQuestion] = React.useState("");
  const [editAnswer, setEditAnswer] = React.useState("");
  const [showEditSuccess, setShowEditSuccess] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [newQuestion, setNewQuestion] = React.useState("");
  const [newAnswer, setNewAnswer] = React.useState("");
  type QuestionType = { id: number; question: string; answer: string };
  const [questions, setQuestions] = React.useState<QuestionType[]>([]);

  // Fetch questions from API
  const fetchQuestions = React.useCallback(() => {
    fetch("http://localhost:3001/api/set_questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch(() => setQuestions([]));
  }, []);

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions: QuestionType[] = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.answer.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        Set Questions
      </h3>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1"
          style={{ minWidth: 0 }}
        />
        <button
          type="button"
          className="ml-2 p-0 bg-transparent border-none outline-none flex items-center justify-center"
          title="Add Question"
          onClick={() => setShowModal(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors hover:stroke-green-500"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <ul className="space-y-3">
        {filteredQuestions.map((q) => (
          <li
            key={q.id}
            className="group p-4 flex justify-between items-start gap-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div>
              <div className="font-bold text-gray-700 dark:text-white">
                {q.question}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {q.answer}
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              {/* Pen (edit) icon */}
              <button
                title="Edit"
                className="p-1 rounded bg-transparent border-none outline-none flex items-center justify-center"
                onClick={() => {
                  setEditId(q.id);
                  setEditQuestion(q.question);
                  setEditAnswer(q.answer);
                  setEditModal(true);
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors hover:stroke-green-500"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              {/* Trash (delete) icon */}
              <button
                title="Delete"
                className="p-1 rounded bg-transparent border-none outline-none flex items-center justify-center"
                onClick={() => {
                  setDeleteId(q.id);
                  setDeleteModal(true);
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors hover:stroke-green-500"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
              {deleteModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{
                    background: "rgba(41, 40, 40, 0.46)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                      Delete Question?
                    </h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                      Are you sure you want to delete this question? This action
                      cannot be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                        onClick={() => setDeleteModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                        onClick={async () => {
                          if (!deleteId) return;
                          const res = await fetch(
                            `http://localhost:3001/api/set_questions/${deleteId}`,
                            {
                              method: "DELETE",
                            }
                          );
                          if (res.ok) {
                            setDeleteModal(false);
                            setDeleteId(null);
                            fetchQuestions();
                            setShowDeleteSuccess(true);
                          } else {
                            alert("Failed to delete question.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showDeleteSuccess && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{
                    background: "rgba(41, 40, 40, 0.46)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                    <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
                      Question deleted successfully!
                    </h3>
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 mt-2"
                      onClick={() => setShowDeleteSuccess(false)}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Edit Set Question
            </h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editId) return;
                const res = await fetch(
                  `http://localhost:3001/api/set_questions/${editId}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      question: editQuestion,
                      answer: editAnswer,
                    }),
                  }
                );
                if (res.ok) {
                  setEditModal(false);
                  setEditId(null);
                  setEditQuestion("");
                  setEditAnswer("");
                  fetchQuestions();
                  setShowEditSuccess(true);
                } else {
                  alert("Failed to update question.");
                }
              }}
            >
              <input
                type="text"
                className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                placeholder="Question"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                required
              />
              <textarea
                className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                placeholder="Answer"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                rows={3}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => setEditModal(false)}
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
        </div>
      )}

      {showEditSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
              Question updated successfully!
            </h3>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 mt-2"
              onClick={() => setShowEditSuccess(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Add Set Question
            </h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                // Add question to database
                const res = await fetch(
                  "http://localhost:3001/api/set_questions",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      question: newQuestion,
                      answer: newAnswer,
                    }),
                  }
                );
                if (res.ok) {
                  setShowModal(false);
                  setNewQuestion("");
                  setNewAnswer("");
                  fetchQuestions();
                  setShowSuccess(true);
                } else {
                  alert("Failed to add question.");
                }
              }}
            >
              <input
                type="text"
                className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                placeholder="Question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
              />
              <textarea
                className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                placeholder="Answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                  onClick={() => setShowModal(false)}
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
        </div>
      )}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(41, 40, 40, 0.46)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">
              Question added successfully!
            </h3>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 mt-2"
              onClick={() => setShowSuccess(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FAQList() {
  const [faqQuestions, setFaqQuestions] = React.useState<
    { question: string; count: number }[]
  >([]);
  React.useEffect(() => {
    fetch("http://localhost:3001/api/convo")
      .then((res) => res.json())
      .then((data) => {
        // Filter only questions (messages ending with '?')
        const questions = data
          .map((item: any) => item.message)
          .filter((msg: string) => msg.trim().endsWith("?"));
        // Count frequency
        const freq: Record<string, number> = {};
        questions.forEach((q: string) => {
          const normalized = q.trim().toLowerCase();
          freq[normalized] = (freq[normalized] || 0) + 1;
        });
        // Sort by frequency, take top 10
        const ranked = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([question, count]) => ({ question, count }));
        setFaqQuestions(ranked);
      });
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Frequently Asked Questions
      </h3>
      <ul className="space-y-3">
        {faqQuestions.length === 0 ? (
          <li className="text-gray-500 dark:text-gray-400">
            No frequently asked questions found.
          </li>
        ) : (
          faqQuestions.map((q, idx) => (
            <li
              key={idx}
              className="group p-4 flex justify-between items-center rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-white">
                <span className="text-xs text-gray-400 font-semibold">
                  {idx + 1}.
                </span>
                {q.question.charAt(0).toUpperCase() + q.question.slice(1)}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Asked {q.count} times
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
        Support
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <SetQuestionsList />
        <FAQList />
      </div>
    </div>
  );
}
