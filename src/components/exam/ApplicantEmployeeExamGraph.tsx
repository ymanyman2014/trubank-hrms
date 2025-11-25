import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";

const chartOptions: ApexOptions = {
  chart: {
    type: "line" as "line",
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  colors: ["#22c55e", "#84cc16"],
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      type: "vertical",
      shadeIntensity: 0.5,
      gradientToColors: ["#84cc16", "#22c55e"],
      inverseColors: false,
      opacityFrom: 0.7,
      opacityTo: 0.2,
      stops: [0, 100],
    },
  },
  xaxis: {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    labels: { style: { colors: "#a3e635" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: "#a3e635" } },
  },
  legend: { show: true, labels: { colors: "#a3e635" } },
  grid: { show: false },
  tooltip: { theme: "dark" },
};

const ApplicantEmployeeExamGraph = () => {
  const [series, setSeries] = useState([
    { name: "Applicants", data: Array(12).fill(0) },
    { name: "Employees", data: Array(12).fill(0) },
  ]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const years = Array.from(
    { length: currentYear - 2023 + 1 },
    (_, i) => 2023 + i
  );

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3001/api/monthly-average-score/${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        // data: { applicant: [...], refresher: [...] }
        const applicantData = Array.isArray(data.applicant)
          ? data.applicant.map((v: number | null) =>
              v == null ? 0 : Number(v)
            )
          : Array(12).fill(0);
        const employeeData = Array.isArray(data.refresher)
          ? data.refresher.map((v: number | null) =>
              v == null ? 0 : Number(v)
            )
          : Array(12).fill(0);
        setSeries([
          { name: "Applicants", data: applicantData },
          { name: "Employees", data: employeeData },
        ]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedYear]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative">
      {/* Year dropdown in top right overlay */}
      <div className="absolute top-4 right-4 z-10">
        <select
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded px-2 py-1 shadow"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Applicant & Employee Exam Graph
      </h2>
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : (
        <ReactApexChart
          options={{
            ...chartOptions,
            xaxis: {
              ...chartOptions.xaxis,
              labels: {
                style: {
                  colors: [
                    "#64748b", // light mode
                    "#a3e635", // dark mode
                  ],
                },
              },
            },
            yaxis: {
              ...chartOptions.yaxis,
              labels: {
                style: {
                  colors: [
                    "#64748b", // light mode
                    "#a3e635", // dark mode
                  ],
                },
              },
            },
            legend: {
              ...chartOptions.legend,
              labels: {
                colors: ["#64748b", "#a3e635"],
              },
            },
          }}
          series={series}
          type="line"
          height={250}
        />
      )}
    </div>
  );
};

export default ApplicantEmployeeExamGraph;
