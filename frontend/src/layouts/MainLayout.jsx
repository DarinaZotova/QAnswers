// frontend/src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: 80,      
          minHeight: "100vh"
        }}
      >
        <Header />

        <main style={{ padding: "24px", margin: "0 auto", flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
