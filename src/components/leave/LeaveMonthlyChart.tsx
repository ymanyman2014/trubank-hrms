import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const LeaveMonthlyChart = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [years, setYears] = useState([currentYear]);
  const [series, setSeries] = useState([
    { name: "Sick Leave", data: Array(12).fill(0) },
    { name: "Vacation Leave", data: Array(12).fill(0) },
    { name: "Maternity/Paternity Leave", data: Array(12).fill(0) },
    { name: "Leave Without Pay", data: Array(12).fill(0) },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available years from leave records
    const fetchYears = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/leaves");
        if (res.data && Array.isArray(res.data)) {
          const allYears = Array.from(
            new Set(
              res.data
                .map(
                  (l) => l.start_date && new Date(l.start_date).getFullYear()
                )
                .filter((y) => typeof y === "number" && !!y)
            )
          );
          allYears.sort((a, b) => b - a);
          setYears(allYears);
          if (!allYears.includes(selectedYear)) {
            setSelectedYear(allYears[0] || currentYear);
          }
        }
      } catch (err) {
        setYears([currentYear]);
      }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    const fetchLeaveCounts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:3001/api/leave-count/${selectedYear}`
        );
        // Expected response: { sickLeave, vacationLeave, maternityPaternityLeave, leaveWithoutPay } (each: [12])
        if (res.data) {
          setSeries([
            {
              name: "Sick Leave",
              data: res.data.sickLeave || Array(12).fill(0),
            },
            {
              name: "Vacation Leave",
              data: res.data.vacationLeave || Array(12).fill(0),
            },
            {
              name: "Maternity/Paternity Leave",
              data: res.data.maternityPaternityLeave || Array(12).fill(0),
            },
            {
              name: "Leave Without Pay",
              data: res.data.leaveWithoutPay || Array(12).fill(0),
            },
          ]);
        }
      } catch (err) {
        setSeries([
          { name: "Sick Leave", data: Array(12).fill(0) },
          { name: "Vacation Leave", data: Array(12).fill(0) },
          { name: "Maternity/Paternity Leave", data: Array(12).fill(0) },
          { name: "Leave Without Pay", data: Array(12).fill(0) },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveCounts();
  }, [selectedYear]);

  const options = {
    chart: { type: "bar" as const, background: "transparent" },
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
    },
    plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
    dataLabels: { enabled: false },
    legend: { position: "top" as const },
    colors: ["#228B22", "#98FF98", "#FFD700", "#FF6347"], // green, mint, gold, tomato
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Leave Trend
        </h3>
        <select
          className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ minWidth: 80 }}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <ReactApexChart
          type="bar"
          height={320}
          series={series}
          options={options}
        />
      )}
    </div>
  );
};
export default LeaveMonthlyChart;
