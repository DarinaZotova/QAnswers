// frontend/src/components/Header.jsx
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { logout } from "../features/auth/authActions";
import { fetchPosts, setParams } from "../features/posts/postsActions"; 
import "./Header.css";
import EditProfileModal from "./EditProfileModal";//



const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

function resolveAvatar(raw) {
  if (!raw || raw === "null" || raw === "undefined") return "/avatar_def.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_ORIGIN}${normalized}`;
}

export default function Header() {
  const { user } = useSelector((s) => s.auth);
  const { params: postParams } = useSelector((s) => s.posts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState(postParams?.q || ""); 
  const menuRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false); //


  const onLogout = async () => {
    await dispatch(logout());
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    setQ(postParams?.q || "");
  }, [postParams?.q]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const next = {
      ...(postParams || {}),
      page: 1,
      q: q.trim(),
    };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
    if (location.pathname !== "/") navigate("/");
  };

  const clearSearch = () => {
    setQ("");
    const next = { ...(postParams || {}), page: 1, q: "" };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
    if (location.pathname !== "/") navigate("/");
  };

  const avatarSrcBase = resolveAvatar(user?.profile_pic);
  const avatarSrc = user?.profile_pic
    ? `${avatarSrcBase}?v=${encodeURIComponent(user?.updated_at || user?.id || Date.now())}`
    : "/avatar_def.png";

  return (
    <header
      style={{
        padding: "8px 24px",
        borderBottom: "1px solid #1f2430",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
      }}
    >
      <form onSubmit={onSearchSubmit} style={{ flex: 1, maxWidth: 360, position: "relative" }}>
        <img
          src="/search.png"
          alt="search"
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            width: 30,
            height: 30,
            left: 4,
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts by title…"
          aria-label="Search posts"
          className="search-input"
          style={{
            width: "100%",
            padding: "8px 32px 8px 34px",
            background: "transparent",
            border: "none",
            borderBottom: "2px solid #bfa5ff",
            color: "rgba(201, 216, 255, .9)",
            outline: "none",
          }}
        />
        {q && (
          <button
            type="button"
            onClick={clearSearch}
            title="Clear"
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#bfa5ff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        )}
      </form>

      <Link to="/" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <img src="/logo.png" alt="Logo" style={{ height: 50 }} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {!user ? (
          <>
            <Link to="/login" title="Log in">
              <img src="/log_in.png" alt="Login" style={{ height: 28 }} />
            </Link>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="user-id">
              <span className={`user-role role-${(user.role || "user").toLowerCase()}`}>
                {(user.role || "user").toLowerCase()}
              </span>
              <span className="user-sep"> | </span>
              <span className="user-login">{user.login || user.email}</span>
            </span>

            <div ref={menuRef} style={{ position: "relative" }}>
              <img
                key={avatarSrc}
                src={avatarSrc}
                alt="avatar"
                style={{ height: 40, width: 40, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                onClick={() => setMenuOpen(!menuOpen)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/avatar_def.png";
                }}
              />
              {menuOpen && (
  <div className="acct-popover" role="menu" aria-label="Account menu">
    <div className="acct-popover__header">My account</div>

    <div className="acct-popover__list">
      {(user?.role || "").toLowerCase() === "admin" && (
        <button
          type="button"
          className="acct-item"
          onClick={() => { setMenuOpen(false); navigate("/admin"); }}
          role="menuitem"
        >
          <img src="/admin.png" alt="" className="acct-item__icon" />
          <span>Admin Panel</span>
        </button>
      )}

      <button
        type="button"
        className="acct-item"
        onClick={() => { setMenuOpen(false); navigate(`/profile/${user?.id || ""}`); }}
        role="menuitem"
      >
        <img src="/profile.png" alt="" className="acct-item__icon" />
        <span>My profile</span>
      </button>
      
      <button
        type="button"
        className="acct-item"
        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
        role="menuitem"
      >
        <img src="/edit.png" alt="" className="acct-item__icon" />
        <span>Edit profile</span>
      </button>

      <div className="acct-divider" role="separator" />

      <button
        type="button"
        className="acct-item acct-item--danger"
        onClick={onLogout}
        role="menuitem"
      >
        <img src="/log.png" alt="" className="acct-item__icon" />
        <span>Log out</span>
      </button>
    </div>
  </div>
)}

            </div>
          </div>
        )}
      </div>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </header>
  );
}
