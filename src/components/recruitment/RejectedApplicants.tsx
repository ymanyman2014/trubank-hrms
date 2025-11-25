import React from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const rejectedApplicants = [
  {
    id: 4,
    applicationDate: "2025-11-07",
    name: "Bob Brown",
    email: "bob.brown@email.com",
    resume: "Resume-BobBrown.pdf",
    position: "QA Analyst",
    examDate: "2025-11-18",
    kpis: "76%",
    proctor: "Ms. Garcia",
    status: "Rejected"
  },
  // Add more rejected applicants here if needed
];

/**
 * Displays a searchable and exportable table of rejected applicants.
 *
 * Features:
 * - Search functionality to filter applicants by name, position, resume, proctor, or email.
 * - Exports the current table view to PDF format.
 * - Shows key applicant details: application date, name, email, resume, position, exam date, KPIs, and proctor.
 *
 * **Privacy Notice:**  
 * All information and accounts will be automatically deleted within a 90-day period.
 */
export default function RejectedApplicants() {
  const [search, setSearch] = React.useState("");
  const tableRef = React.useRef<HTMLTableElement>(null);

  // PDF Export
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    const input = tableRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight > pageHeight ? pageHeight : imgHeight);
    pdf.save('RejectedApplicants.pdf');
  };

  const filteredApplicants = rejectedApplicants.filter(applicant => {
    const q = search.toLowerCase();
    return (
      applicant.name.toLowerCase().includes(q) ||
      applicant.position.toLowerCase().includes(q) ||
      applicant.resume.toLowerCase().includes(q) ||
      applicant.proctor.toLowerCase().includes(q) ||
      (applicant.email && applicant.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-red-200 bg-white dark:border-red-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 mt-6">
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Rejected Applicants</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            All rejected accounts and its information will be automatically deleted within a 90-day period.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rejected applicants..."
            className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{ minWidth: 220 }}
          />
          <button type="button" title="Export PDF" className="p-2 rounded hover:bg-red-200 dark:hover:bg-red-700 flex items-center" onClick={handleExportPDF}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8" />
            </svg>
            <span className="ml-1 text-xs text-red-500 dark:text-red-300">PDF</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mt-2">
        <table ref={tableRef} className="min-w-full rounded-lg shadow divide-y divide-red-200 dark:divide-red-800">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Application Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Resume</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Position</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Exam Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">KPIs</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Proctor</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.map(applicant => (
              <tr key={applicant.id} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{applicant.applicationDate}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div>{applicant.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{applicant.email}</div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 dark:text-green-400 underline cursor-pointer">{applicant.resume}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{applicant.position}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{applicant.examDate}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 dark:text-green-400 font-semibold">{applicant.kpis}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{applicant.proctor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
