import { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "react-bootstrap";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import store from "./store/auth.js";
import { UserAuthContextProvider } from "./firebase/auth/UserAuthContext";
import { LoaderProvider, useLoader } from "./constants/LoaderContext";
import LoaderR from "./components/common/LoaderR";
import Layout from "./components/layout";
import Header from "./components/common/Header";

// Pages
import Home from "./pages/Home";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/dashboard/Dashboard";
import UserManagement from "./pages/dashboard/UserManagement";
import Setting from "./pages/dashboard/Setting";
import DietitianManagement from "./pages/dashboard/DietitianManagement";
import DietitianRequests from "./pages/dashboard/DietitianRequests";
import DietChartRequests from "./pages/dashboard/DietChartRequests";
import DietPlanPage from "./pages/dashboard/DietPlan";
import AIDietPlans from "./pages/dashboard/AIDietPlans";
import AIDietPlanReview from "./pages/dashboard/AIDietPlanReview";
import AIDietPlanView from "./pages/dashboard/AIDietPlanView";
import NutritionConfigPage from "./pages/dashboard/NutritionConfig";
import CouponManagement from "./pages/dashboard/CouponManagement";
import CouponRedemptions from "./pages/dashboard/CouponRedemptions";
import Appointments from "./pages/dashboard/Appointments";
import CourseManagement from "./pages/dashboard/CourseManagement";
import HealthGoalsList from "./pages/dashboard/ai-diet-plan/HealthGoalsList";
import DiseaseList from "./pages/dashboard/ai-diet-plan/DiseaseList";
import FoodAllergiesList from "./pages/dashboard/ai-diet-plan/FoodAllergiesList";
import CuisineList from "./pages/dashboard/ai-diet-plan/CuisineList";
import MedicalConditionsList from "./pages/dashboard/ai-diet-plan/MedicalConditionsList";
import BroadcastEmailPage from "./pages/dashboard/BroadcastEmail";
import Earnings from "./pages/dashboard/Earnings";
import Career from "./pages/dashboard/Career";
import OfflineAppointments from "./pages/dashboard/OfflineAppointments";
import OfflineDietCharts from "./pages/dashboard/OfflineDietCharts";
import DietitianPlanView from "./pages/dashboard/DietitianPlanView";

const LoaderHandler = () => {
  const { loading } = useLoader();
  return loading ? <LoaderR /> : null;
};

// Equivalent of the Next.js `isDashboard` branch in _app.js: dashboard routes
// get the Header + Layout shell, everything else renders bare.
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <Header onToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Layout sidebarOpen={sidebarOpen} onClose={closeSidebar}>
        <Outlet />
      </Layout>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <UserAuthContextProvider>
          <LoaderProvider>
            <LoaderHandler />
            <Toaster />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="dietitian-requests" element={<DietitianRequests />} />
                <Route path="diet-chart-requests" element={<DietChartRequests />} />
                <Route path="dietitian-management" element={<DietitianManagement />} />
                <Route path="setting" element={<Setting />} />
                <Route path="diet-plan/:id" element={<DietPlanPage />} />
                <Route path="ai-diet-plans" element={<AIDietPlans />} />
                <Route path="ai-diet-plans/:id" element={<AIDietPlanReview />} />
                <Route path="ai-diet-plans/:id/view" element={<AIDietPlanView />} />
                <Route path="nutrition-config" element={<NutritionConfigPage />} />
                <Route path="coupon-management" element={<CouponManagement />} />
                <Route path="coupon-redemptions" element={<CouponRedemptions />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="offline-appointments" element={<OfflineAppointments />} />
                <Route path="offline-diet-charts" element={<OfflineDietCharts />} />
                <Route path="dietitian-plans/:id/view" element={<DietitianPlanView />} />
                <Route path="course-management" element={<CourseManagement />} />
                <Route path="ai-diet-plan/health-goals" element={<HealthGoalsList />} />
                <Route path="ai-diet-plan/diseases" element={<DiseaseList />} />
                <Route path="ai-diet-plan/food-allergies" element={<FoodAllergiesList />} />
                <Route path="ai-diet-plan/cuisines" element={<CuisineList />} />
                <Route path="ai-diet-plan/medical-conditions" element={<MedicalConditionsList />} />
                <Route path="broadcast-email" element={<BroadcastEmailPage />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="career" element={<Career />} />
              </Route>
            </Routes>

            <div id="recaptcha-container" className="d-none" />
          </LoaderProvider>
        </UserAuthContextProvider>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
