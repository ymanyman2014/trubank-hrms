import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ComponentCard from "../common/ComponentCard";
import axios from "axios";

const LABELS = ["Total Applicant", "Total Passed", "Total Failed", "Ongoing"];
const COLORS = ["#228B22", "#2E8B57", "#FF6347", "#FFD700"];

const ApplicantsFrequency = () => {
  const [series, setSeries] = useState([0, 0, 0, 0]);
  const [counts, setCounts] = useState({
    applicant: 0,
    passed: 0,
    failed: 0,
    ongoing: 0,
  });
  useEffect(() => {
    const year = new Date().getFullYear();
    axios
      .get(`http://localhost:3001/api/proctoring_event/summary/${year}`)
      .then((res) => {
        // Expecting: { applicant_count, pass_count, fail_count, empty_result_count }
        if (res.data && typeof res.data === "object") {
          // Align data for chart and summary
          const applicant = res.data.applicant_count || 0;
          const passed = res.data.pass_count || 0;
          const failed = res.data.fail_count || 0;
          const ongoing = res.data.empty_result_count || 0;
          setSeries([applicant, passed, failed, ongoing]);
          setCounts({
            applicant,
            passed,
            failed,
            ongoing,
          });
        }
      });
  }, []);

  return (
    <ComponentCard
      title="Applicants Frequency"
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center justify-center md:w-1/2">
          <span className="text-gray-500 dark:text-gray-400 text-theme-sm mb-2">
            This Year
          </span>
          <ReactApexChart
            type="pie"
            width={180}
            height={180}
            series={series}
            options={{
              labels: LABELS,
              colors: COLORS,
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
            }}
          />
        </div>
        <div className="flex flex-col gap-2 md:w-1/2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[0] }}
            ></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Total Applicant
            </span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">
              {counts.applicant}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[1] }}
            ></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Total Passed
            </span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">
              {counts.passed}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[2] }}
            ></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Total Failed
            </span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">
              {counts.failed}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[3] }}
            ></span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Ongoing
            </span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">
              {counts.ongoing}
            </span>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default ApplicantsFrequency;
