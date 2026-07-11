import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastContainer } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import ToolsPage from "./pages/ToolsPage";
import WorkflowsPage from "./pages/WorkflowsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
