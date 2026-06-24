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
import NutritionConfigPage from "./pages/dashboard/NutritionConfig";

const LoaderHandler = () => {
  const { loading } = useLoader();
  return loading ? <LoaderR /> : null;
};

// Equivalent of the Next.js `isDashboard` branch in _app.js: dashboard routes
// get the Header + Layout shell, everything else renders bare.
function DashboardLayout() {
  return (
    <>
      <Header />
      <Layout>
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
                <Route path="nutrition-config" element={<NutritionConfigPage />} />
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
