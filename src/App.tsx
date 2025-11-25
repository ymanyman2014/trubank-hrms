import { BrowserRouter as Router, Routes, Route } from "react-router";
import EmployeeHome from "./pages/EmployeeHome";
import JobApplicationLanding from "./pages/JobApplicationLanding";
import Support from "./pages/Support";
import UserManagement from "./pages/UserManagement";
import LeaveManagement from "./pages/LeaveManagement";
import Announcement from "./pages/Announcement";
import ExamManagement from "./pages/ExamManagement";
import LeaveLedger from "./pages/LeaveLedger";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import RecruitmentPage from "./pages/Recruitment";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Pages */}
          <Route index path="/" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Public Job Application Landing Page */}
          {/* Remove generic /job-application route to ensure 404 for /job-application */}
          <Route
            path="/job-application/:userId/:jobId"
            element={<JobApplicationLanding />}
          />
          <Route
            path="/job-application/:userId/:jobId/:examId"
            element={<JobApplicationLanding />}
          />

          {/* Employee page outside dashboard */}
          <Route path="/employee" element={<EmployeeHome />} />

          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            {/* Role-based Dashboards */}
            <Route path="/admin" element={<Home />} />
            {/* Admin Sidebar Pages */}
            {/* Dashboard now routes to /admin */}
            <Route path="/admin" element={<Home />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/leave-management" element={<LeaveManagement />} />
            <Route path="/announcement" element={<Announcement />} />
            <Route path="/exam-management" element={<ExamManagement />} />
            <Route path="/leave-ledger" element={<LeaveLedger />} />
            <Route path="/support" element={<Support />} />
            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />
            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Applicant Dashboard - outside admin layout */}
          <Route path="/applicant" element={<ApplicantDashboard />} />

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
