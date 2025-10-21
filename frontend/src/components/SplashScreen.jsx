// src/components/SplashScreen.jsx
export default function SplashScreen({ hide = false }) {
  return (
    <div className={`splash ${hide ? "splash--hide" : ""}`}>
      <div className="splash__inner">
        <img src="/logo.png" alt="QAnswers" className="splash__logo" />
      </div>
    </div>
  );
}
