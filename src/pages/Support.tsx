import { useEffect } from "react";
import SupportPage from "../components/support/SupportPage";

const Support = () => {
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!userId) {
      window.location.replace("/");
    } else if (role !== "admin") {
      window.location.replace("/employee");
    }
  }, []);
  return <SupportPage />;
};

export default Support;
