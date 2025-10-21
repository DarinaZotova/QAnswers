// frontend/src/components/PostCard.jsx
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../shared/utils/datetime";
import "./PostCard.css";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

function resolveAvatar(raw) {
  if (!raw || raw === "null" || raw === "undefined") return "/avatar_def.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_ORIGIN}${normalized}`;
}

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const preview =
    post.content.length > 200 ? post.content.slice(0, 200) + "..." : post.content;
  const avatarSrc = resolveAvatar(post.author?.avatar);

  return (
    <article
      className="post-card"
      onClick={() => navigate(`/posts/${post.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/posts/${post.id}`)}
    >
      <header className="post-card__head">
        <img
          className="post-card__avatar"
          src={avatarSrc}
          alt="avatar"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/avatar_def.png";
          }}
        />
        <div className="post-card__meta">
          <span
            className="post-card__author"
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (post.author?.id) navigate(`/profile/${post.author.id}`);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (post.author?.id) navigate(`/profile/${post.author.id}`);
              }
            }}
            title="Открыть профиль"
            style={{ cursor: "pointer" }}
          >
            {post.author?.login || "Unknown"}
          </span>
          
          <span className="post-card__dot">•</span>
          <time className="post-card__time">{formatDateTime(post.published_at)}</time>
        </div>
      </header>

      <h3 className="post-card__title">{post.title}</h3>
      <p className="post-card__text">{preview}</p>

      {post.categories?.length > 0 && (
        <div className="post-card__cats">
          {post.categories.map((cat) => (
            <span key={cat.id} className="post-card__cat">
              {cat.title}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
