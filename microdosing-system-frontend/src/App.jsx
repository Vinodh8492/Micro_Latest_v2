import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MaterialDetails from "./pages/MaterialDetails";
import Recipes from "./pages/Recipes";
import Batches from "./pages/Batches";
import Sidebar from "./components/Sidebar";
import MaterialForm from "./pages/MaterialForm";
import RecipeEditForm from "./pages/RecipeEditForm";
import EditMaterial from "./pages/EditMaterial";
import MaterialTransactionPage from "./pages/MaterialTransactionForm";
import ThemeToggle from "./pages/ThemeToggle";
import ActiveOrders from "./pages/ActiveOrders";
import Topbar from "./pages/Topbar";
import ViewOrder from "./pages/ViewOrder";
import ViewRecipe from "./pages/ViewRecipe";
import Bucket_Batches from "./pages/Bucket_Batches";
import ViewMaterial from "./pages/ViewMaterial";
import CreateStorageBucketForm from "./pages/CreateStorageBucketForm";
import { ThemeProvider } from "./context/ThemeContext";
import AdminPage from "./pages/AdminPage";
import { LogoContext } from "./context/LogoContext";
import History from "./pages/History";
import FormulaEditForm from "./pages/FormulaDetailsEdit";
import { DosingProvider } from "./pages/DosingContext";
import CreateBatch from './pages/CreateBatch';
import FormulaViewDetails from './pages/FormulaViewDetails'

// ✅ Updated Layout
function Layout({ children }) {
  const location = useLocation();
  const hideForRoutes = ["/login"];
  const shouldHideTopbar = hideForRoutes.includes(location.pathname);

  return (
    <div className="flex h-screen">
      {!shouldHideTopbar && <Sidebar />}
      <div
        className="flex-1 p-6 overflow-auto relative"
        style={{ background: "transparent", transition: "background 0.4s ease" }}
      >
        {!shouldHideTopbar && <Topbar />}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const [materials, setMaterials] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');

  return (
    <DosingProvider>
      <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/material" element={<MaterialDetails />} />
            <Route path="/material/create" element={<MaterialForm setMaterials={setMaterials} />} />
            <Route path="/material/:material_id" element={<EditMaterial />} />
            <Route path="/material/view/:material_id" element={<ViewMaterial />} />
            <Route path="/material-transactions" element={<MaterialTransactionPage />} />
            <Route path="/orders/:order_id" element={<ViewOrder />} />
            <Route path="/activeorders" element={<ActiveOrders />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/edit/:recipe_id" element={<RecipeEditForm />} />
            <Route path="/formula-details/edit/:recipe_id" element={<FormulaEditForm />} />
            <Route path="/recipes/view/:recipe_id" element={<FormulaViewDetails />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/create-batch" element={<CreateBatch />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/storage" element={<Bucket_Batches />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-storage" element={<CreateStorageBucketForm />} />
            <Route path="/settings" element={<AdminPage />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Layout>
      </LogoContext.Provider>
    </DosingProvider>
  );
}

function AppContent() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
