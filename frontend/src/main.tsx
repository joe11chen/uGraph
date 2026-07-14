import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import "vditor/dist/index.css";
import "./styles.css";
import { GraphPage } from "./pages/GraphPage";
import { PaperEditorPage } from "./pages/PaperEditorPage";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GraphPage />} />
          <Route path="/projects/default/graph" element={<GraphPage />} />
          <Route path="/papers/:paperId/edit" element={<PaperEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
