import React, { useState, useEffect } from "react";

type EmployeeResult = {
  idNumber: string;
  lastname: string;
  firstname: string;
  email: string;
  department: string;
  position: string;
  dateOfExam: string;
  score: string;
};

const RefresherExamResults: React.FC = () => {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`http://localhost:3001/api/employees/role/employee`)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load results");
        return res.json();
      })
      .then(async (data) => {
        // For each employee, fetch their refresher exam date and score for selected year
        const enrichedResults: EmployeeResult[] = await Promise.all(
          data.map(async (emp: any) => {
            try {
              const res = await fetch(
                `http://localhost:3001/api/employee/average-score/${emp.id}/${year}`
              );
              if (!res.ok) throw new Error();
              const scoreData = await res.json();
              // scoreData: { date_of_exam, score } or empty
              let dateOfExam = scoreData?.date_of_exam || "";
              let score = scoreData?.score || "";
              // Format score: if not empty and is a number, show as float with 2 decimals
              if (score && !isNaN(Number(score))) {
                score = Number(score).toFixed(2);
              }
              // Format date: if not empty and valid date string
              if (dateOfExam && !isNaN(Date.parse(dateOfExam))) {
                dateOfExam = new Date(dateOfExam).toLocaleDateString();
              }
              return {
                idNumber: emp.idNumber,
                lastname: emp.lastname,
                firstname: emp.firstname,
                email: emp.email,
                department: emp.department,
                position: emp.position,
                dateOfExam,
                score,
              };
            } catch {
              return {
                idNumber: emp.idNumber,
                lastname: emp.lastname,
                firstname: emp.firstname,
                email: emp.email,
                department: emp.department,
                position: emp.position,
                dateOfExam: "",
                score: "",
              };
            }
          })
        );
        setResults(enrichedResults);
      })
      .catch(() => {
        setError("Unable to load results");
      })
      .finally(() => setLoading(false));
  }, [year]);

  // Filter by search
  const filteredResults = results.filter(
    (res) =>
      res.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      res.lastname.toLowerCase().includes(search.toLowerCase()) ||
      res.firstname.toLowerCase().includes(search.toLowerCase()) ||
      res.email.toLowerCase().includes(search.toLowerCase()) ||
      res.department.toLowerCase().includes(search.toLowerCase()) ||
      res.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow p-6 mt-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Refresher Exam Results
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            min={2000}
            max={new Date().getFullYear()}
            onChange={(e) => setYear(Number(e.target.value))}
            placeholder="Year"
            className="rounded-lg border border-gray-700 bg-gray-900 text-gray-200 placeholder-gray-400 px-4 py-2 focus:outline-none"
            style={{ width: 100 }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-lg border border-gray-700 bg-gray-900 text-gray-200 placeholder-gray-400 px-4 py-2 focus:outline-none"
            style={{ minWidth: 220 }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-semibold">
            Loading...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500 dark:text-red-400 text-lg font-semibold">
            {error}
          </div>
        ) : (
          <table className="min-w-full rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  ID Number
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Full Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Department
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date of Exam
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Average
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-semibold"
                  >
                    No results to display yet.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      TRU-{res.idNumber}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="font-semibold">
                        {res.lastname}, {res.firstname}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {res.email}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>{res.department}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {res.position}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {res.dateOfExam}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {res.score}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RefresherExamResults;
