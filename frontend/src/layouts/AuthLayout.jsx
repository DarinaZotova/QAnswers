// frontend/src/layouts/AuthLayout.jsx
import "../styles/auth.css";
import PrismaticBurst from "../components/PrismaticBurst";

export default function AuthLayout({ left, children, cardClass = "", mainClass = "" }) {
  return (
    <div className="auth-shell">
      <PrismaticBurst
        animationType="rotate"
        intensity={2}
        speed={0.5}
        mixBlendMode="screen"
        colors={["#2a1648","#4b2ea8","#2964f2","#19b2e6","#582fb9","#2b1750"]}
      />
      <div className={`auth-card ${cardClass}`} style={{ position: "relative", zIndex: 1 }}>
        <aside className="auth-aside">{left}</aside>
        <main className={`auth-main ${mainClass}`}>{children}</main>
      </div>
    </div>
  );
}
