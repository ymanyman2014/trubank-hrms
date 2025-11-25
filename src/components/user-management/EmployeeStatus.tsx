// Removed unused React import
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ComponentCard from "../common/ComponentCard";

const EmployeeStatus = () => {
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [distinctStatuses, setDistinctStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const axios = (await import("axios")).default;
        const res = await axios.get("http://localhost:3001/api/all-employees");
        const employees = res.data;
        // Count by status
        const statusMap: { [key: string]: number } = {};
        for (const emp of employees) {
          const status = (emp.status || "").toLowerCase();
          statusMap[status] = (statusMap[status] || 0) + 1;
        }
        setStatusCounts(statusMap);
        setDistinctStatuses(Object.keys(statusMap));
      } catch {
        setStatusCounts({ drop: 0, accepted: 0, existing: 0 });
        setDistinctStatuses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartSeries = distinctStatuses.map(
    (status) => statusCounts[status] || 0
  );
  const chartOptions = {
    labels: distinctStatuses,
    colors: [
      "#228B22",
      "#808000",
      "#98FF98",
      "#FFB347",
      "#87CEEB",
      "#FF69B4",
      "#A9A9A9",
      "#FFD700",
      "#8A2BE2",
      "#00CED1",
    ],
    legend: { show: false },
    chart: { background: "transparent" },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    plotOptions: {
      pie: {
        dataLabels: { offset: 20, minAngleToShowLabel: 10 },
        expandOnClick: true,
      },
    },
  };

  return (
    <ComponentCard
      title="Employee Status"
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center justify-center md:w-1/2">
          <span className="text-gray-500 dark:text-gray-400 text-theme-sm mb-2">
            This Year
          </span>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <ReactApexChart
              type="pie"
              width={180}
              height={180}
              series={chartSeries}
              options={chartOptions}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 md:w-1/2">
          {distinctStatuses.length === 0 ? (
            <div className="text-gray-400">No status data</div>
          ) : (
            distinctStatuses.map((status, idx) => (
              <div
                key={status}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      chartOptions.colors[idx % chartOptions.colors.length],
                  }}
                ></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                  {statusCounts[status] || 0}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </ComponentCard>
  );
};

export default EmployeeStatus;
