// frontend/src/pages/ProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../shared/api/axios";
import PostCard from "../components/PostCard";
import "./ProfilePage.css";
import EditProfileModal from "../components/EditProfileModal";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const resolveAvatar = (raw) => {
  if (!raw || raw === "null" || raw === "undefined") return "/avatar_def.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_ORIGIN}${normalized}`;
};

export default function ProfilePage() {
  const { user: authUser } = useSelector((s) => s.auth);
  const { user_id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  

  useEffect(() => {
    if (!authUser) navigate("/login");
  }, [authUser, navigate]);

  const viewingOwn = useMemo(
    () => !!authUser && (!user_id || String(authUser.id) === String(user_id)),
    [authUser, user_id]
  );

  const [info, setInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser) return;
    const id = viewingOwn ? authUser.id : user_id;
    (async () => {
      setLoadingInfo(true); setError("");
      try {
        const { data } = await api.get(`/users/${id}`);
        setInfo(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, [authUser, user_id, viewingOwn]);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      setLoadingPosts(true);
      try {
        if (viewingOwn) {
          const { data } = await api.get(`/me/posts?status=all&sort=date&order=desc&page=1&limit=20`);
          setPosts(data?.items || []);
        } else {
          const { data } = await api.get(`/posts?status=active&sort=date&order=desc&page=1&limit=100`);
          const uid = Number(user_id);
          const mine = (data?.items || []).filter(p => Number(p?.author?.id) === uid);
          setPosts(mine);
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load posts");
      } finally {
        setLoadingPosts(false);
      }
    })();
  }, [authUser, user_id, viewingOwn]);

  const avatarSrc = resolveAvatar(info?.profile_pic);

  return (
    <div className="profile-page">
      <section className="profile-left">
        {loadingInfo ? (
          <div className="profile-card">Loading profile…</div>
        ) : error ? (
          <div className="profile-card" style={{ color: "tomato" }}>{error}</div>
        ) : info ? (
<div className="profile-card profile-card--pill">
  {/* цветная шапка */}
  <div className="profile-card__head">
    <img
      src={avatarSrc}
      alt="avatar"
      className="profile-avatar avatar--floating"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar_def.png"; }}
    />
  </div>

  <div className="profile-card__body">
    <span className={`role-badge role-${(info.role||'user').toLowerCase()}`}>
      {(info.role || "user").toLowerCase()}
    </span>

    <div className="login">{info.login}</div>
    <div className="full-name">{info.full_name || "—"}</div>
    <a className="email" href={`mailto:${info.email}`}>{info.email}</a>

<div className="rating">
  <span className="rating-num">{typeof info.rating === "number" ? info.rating : 0}</span>
  <img className="rating-icon" src="/star.png" alt="rating" />
</div>
    {viewingOwn && (
      <div className="profile-actions">
        <button className="pr-btn" onClick={() => setEditOpen(true)}>
          Edit profile
        </button>
      </div>
    )}
  </div>
</div>

        ) : null}
      </section>

      <section className="profile-right">
        <h2 className="profile-posts-title">
          {viewingOwn ? "My posts" : `Posts by ${info?.login || ""}`}
        </h2>

        <div className="feed">
          {loadingPosts && <div className="profile-hint">Loading posts…</div>}
          {!loadingPosts && posts.length === 0 && <div className="profile-hint">No posts yet.</div>}
          {posts.map(p => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>
       <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
