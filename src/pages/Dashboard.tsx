import { useEffect } from "react";

const Dashboard = () => {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId) {
      window.location.replace("/");
    } else if (role !== "admin") {
      window.location.replace("/employee");
    }
  }, []);
  return <div>Dashboard Page</div>;
};
export default Dashboard;
