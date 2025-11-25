import React from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const archivedApplicants = [
	{
		id: 101,
		applicationDate: "2025-10-15",
		name: "Mark Evans",
		email: "mark.evans@email.com",
		resume: "Resume-MarkEvans.pdf",
		position: "Backend Developer",
		examDate: "2025-10-20",
		kpis: "89%",
		proctor: "Ms. Lee",
		status: "Archived",
	},
	{
		id: 102,
		applicationDate: "2025-10-18",
		name: "Sara Kim",
		email: "sara.kim@email.com",
		resume: "Resume-SaraKim.pdf",
		position: "Frontend Developer",
		examDate: "2025-10-25",
		kpis: "91%",
		proctor: "Mr. Brown",
		status: "Archived",
	},
];

export default function ArchivedApplicants() {
	const [search, setSearch] = React.useState("");
	const tableRef = React.useRef<HTMLTableElement>(null);

	// PDF Export
	const handleExportPDF = async () => {
		if (!tableRef.current) return;
		const input = tableRef.current;
		const canvas = await html2canvas(input);
		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF({
			orientation: "landscape",
			unit: "pt",
			format: "a4",
		});
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const imgWidth = pageWidth;
		const imgHeight = (canvas.height * imgWidth) / canvas.width;
		pdf.addImage(
			imgData,
			"PNG",
			0,
			0,
			imgWidth,
			imgHeight > pageHeight ? pageHeight : imgHeight
		);
		pdf.save("ArchivedApplicants.pdf");
	};

	const filteredApplicants = archivedApplicants.filter((applicant) => {
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
		<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 mt-8">
			<div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-white">
					Archived Applicants (Reserve List)
				</h3>
				<div className="flex items-center gap-2">
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search archived applicants..."
						className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
						style={{ minWidth: 220 }}
					/>
					<button
						type="button"
						title="Export PDF"
						className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center"
						onClick={handleExportPDF}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 text-gray-500 dark:text-gray-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8"
							/>
						</svg>
						<span className="ml-1 text-xs text-gray-500 dark:text-gray-300">
							PDF
						</span>
					</button>
				</div>
			</div>
			<div className="overflow-x-auto mt-2">
				<table
					ref={tableRef}
					className="min-w-full rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-800"
				>
					<thead>
						<tr>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Application Date
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Name
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Resume
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Position
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Exam Date
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								KPIs
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Proctor
							</th>
							<th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
								Status
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredApplicants.map((applicant) => (
							<tr
								key={applicant.id}
								className="hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
							>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									{applicant.applicationDate}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									<div>{applicant.name}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{applicant.email}
									</div>
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 dark:text-green-400 underline cursor-pointer">
									{applicant.resume}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									{applicant.position}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									{applicant.examDate}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-green-700 dark:text-green-400 font-semibold">
									{applicant.kpis}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									{applicant.proctor}
								</td>
								<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
									<span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold bg-gray-400/10 text-gray-600">
										{applicant.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
