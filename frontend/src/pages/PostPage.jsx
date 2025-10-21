// src/pages/PostPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../shared/api/axios";
import { formatDateTime } from "../shared/utils/datetime";
import "./PostPage.css";
import EditPostModal from "../components/EditPostModal";
import EditCommentModal from "../components/EditCommentModal";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";


function PortalPopover({ open, pos, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const target = e.target;
      if (!(target.closest && target.closest("[data-q-popover]"))) {
        onClose?.();
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onEsc);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [open, onClose]);

  if (!open) return null;
  const style = {
    position: "fixed",
    top: Math.max(8, pos?.top ?? 0),
    left: Math.max(8, pos?.left ?? 0),
    zIndex: 9999,
  };

  return createPortal(
    <div data-q-popover style={style}>
      <div className="q-popover" style={{ zIndex: 9999 }}>{children}</div>
    </div>,
    document.body
  );
}

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const resolve = (raw) =>
  !raw || raw === "null" || raw === "undefined"
    ? "/avatar_def.png"
    : /^https?:\/\//i.test(raw)
    ? raw
    : `${API_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;

export default function PostPage() {
  const { post_id } = useParams();
  const { user: authUser } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [postMenuPos, setPostMenuPos] = useState(null);
  const postMenuBtnRef = useRef(null);

  const [editPostOpen, setEditPostOpen] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [replyToId, setReplyToId] = useState(null);         
  const [replyText, setReplyText] = useState("");  
  
  const [openThreads, setOpenThreads] = useState(() => new Set()); 

  const canEditPost = useMemo(
    () => !!authUser && (authUser.role === "admin" || authUser.id === post?.author_id),
    [authUser, post]
  );

  const canTogglePost = useMemo(
    () => !!authUser && authUser.role === "admin",
    [authUser]
  );

  const canSeeInactive = useMemo(
    () => !!authUser && (authUser.role === "admin" || authUser.id === post?.author_id),
    [authUser, post]
  );

  const canComment = (post?.is_active ?? true) || canSeeInactive;

  const updatePostReactions = async () => {
    const { data } = await api.get(`/posts/${post_id}/like`);
    if (Array.isArray(data)) {
      setLikes(data.filter((x) => x.type === "like").length);
      setDislikes(data.filter((x) => x.type === "dislike").length);
    } else {
      setLikes(Number(data?.likes || 0));
      setDislikes(Number(data?.dislikes || 0));
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const tryPublic = async () => api.get(`/posts/${post_id}`);
        const tryAdmin = async () => api.get(`/admin/posts/${post_id}`);

        let data;
        try {
          const r = await tryPublic();
          data = r.data;
        } catch (e) {
          const status = e?.response?.status;
          if (status === 404 && authUser?.role === "admin") {
            const r2 = await tryAdmin();
            data = r2.data;
          } else {
            throw e;
          }
        }

        if (!alive) return;
        setPost(data);

        try {
          await updatePostReactions();
        } catch {}
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load post");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [post_id, authUser?.id, authUser?.role]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tryPublic = async () => api.get(`/posts/${post_id}/comments`);
        const tryAdmin = async () =>
          api.get(`/admin/posts/${post_id}/comments`, {
            params: { status: "all" },
          });

        let data;
        try {
          const r = await tryPublic();
          data = r.data;
        } catch (e) {
          const status = e?.response?.status;
          if (status === 404 && authUser?.role === "admin") {
            const r2 = await tryAdmin();
            data = r2.data;
          } else {
            throw e;
          }
        }

        if (!alive) return;
        setComments(data || []);
      } catch (e) {}
    })();
    return () => {
      alive = false;
    };
  }, [post_id, authUser?.id, authUser?.role]);

const visibleComments = useMemo(() => {
  const uid = Number(authUser?.id ?? 0);
  const role = authUser?.role;
  const postOwnerId = Number(post?.author_id ?? 0);

  return comments.filter((c) => {
    if (c.is_active) return true;

    if (role === "admin") return true;

    const isCommentOwner = uid && uid === Number(c.author_id ?? 0);
    return isCommentOwner;
  });
}, [comments, authUser?.id, authUser?.role, post?.author_id]);

  const commentTree = useMemo(() => {
    const byId = new Map();
    const roots = [];
    for (const c of visibleComments) {
      const node = { ...c, children: [] };
      byId.set(c.id, node);
    }
    for (const c of visibleComments) {
      const node = byId.get(c.id);
      const pid = c.parent_id ?? null;
      if (pid && byId.has(pid)) {
        byId.get(pid).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [visibleComments]);

  const react = async (type) => {
    if (!authUser) return navigate("/login");
    try {
      if (myReaction === type) {
        await api.delete(`/posts/${post_id}/like`);
        setMyReaction(null);
      } else {
        await api.post(`/posts/${post_id}/like`, { type });
        setMyReaction(type);
      }
      await updatePostReactions();
    } catch (e) {}
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!authUser) return navigate("/login");
    if (!newComment.trim()) return;
    const { data } = await api.post(`/posts/${post_id}/comments`, {
      content: newComment.trim(),
    });
    setComments((prev) => [...prev, data]);
    setNewComment("");
  };

  const submitReply = useCallback(async () => {
    if (!authUser) return navigate("/login");
    if (!replyToId || !replyText.trim()) return;
    if (!canComment) return;
    try {
      const { data } = await api.post(`/posts/${post_id}/comments`, {
        content: replyText.trim(),
        parent_id: replyToId,
      });
      setComments((prev) => [...prev, data]);
      setReplyText("");
      setReplyToId(null);
    } catch (e) {
    }
  }, [authUser, replyToId, replyText, canComment, navigate, post_id]);

  const togglePostActive = async (checked) => {
    try {
      setUpdatingStatus(true);
      const { data } = await api.patch(`/posts/${post_id}`, {
        is_active: !!checked,
      });
      setPost((prev) => ({ ...(prev || {}), is_active: !!data.is_active }));
    } catch (e) {
      console.warn("Failed to toggle post status", e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const canEditContent = !!authUser && authUser.id === post?.author_id;

  const openPostMenu = () => {
    const btn = postMenuBtnRef.current;
    if (!btn) {
      setPostMenuOpen((v) => !v);
      return;
    }
    const r = btn.getBoundingClientRect();
    const width = 220;
    setPostMenuPos({
      top: r.bottom + 6,
      left: Math.max(8, r.right - width),
    });
    setPostMenuOpen(true);
  };

  const setSubtreeActive = useCallback((rootId, nextActive) => {
    setComments(prev => {
      const byParent = new Map();
      for (const c of prev) {
        const pid = c.parent_id ?? null;
        if (!byParent.has(pid)) byParent.set(pid, []);
        byParent.get(pid).push(c.id);
      }
      const toUpdate = new Set([rootId]);
      const stack = [rootId];
      while (stack.length) {
        const cur = stack.pop();
        const kids = byParent.get(cur) || [];
        for (const k of kids) {
          if (!toUpdate.has(k)) {
            toUpdate.add(k);
            stack.push(k);
          }
        }
      }
      return prev.map(c => toUpdate.has(c.id) ? { ...c, is_active: nextActive } : c);
    });
  }, []);

const removeSubtree = useCallback((rootId) => {
  setComments(prev => {
    const byParent = new Map();
    for (const c of prev) {
      const pid = c.parent_id ?? null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(c.id);
    }
    const toDelete = new Set([rootId]);
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop();
      const kids = byParent.get(cur) || [];
      for (const k of kids) {
        if (!toDelete.has(k)) {
          toDelete.add(k);
          stack.push(k);
        }
      }
    }
    return prev.filter(c => !toDelete.has(c.id));
  });
}, []);


  return (
    <div className="postpage">
      {loading ? (
        <div className="postpage__hint">Loading…</div>
      ) : err ? (
        <div className="postpage__err">{err}</div>
      ) : (
        post && (
          <article className="postview-wrap">
            <section className="postbox">
              <header className="postbox__head">
                <img
                  className="postbox__avatar"
                  src={resolve(post.author?.avatar)}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = "/avatar_def.png";
                  }}
                />
                <div className="postbox__meta">
                  <div className="postbox__author">
                    <Link to={`/profile/${post.author?.id}`} className="link-unstyled">
                      {post.author?.login}
                    </Link>
                    <span
                      className={`post-status-badge ${post.is_active ? "is-active" : "is-inactive"}`}
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 999,
                        border: "1px solid #2a3242",
                        color: post.is_active ? "#86efac" : "#fca5a5",
                      }}
                    >
                      <img
    src={post.is_active ? "/lock-open.png" : "/lock-closed.png"}
    alt={post.is_active ? "Unlocked" : "Locked"}
    style={{ width: 12, height: 12, display: "inline-block", transform: "translateY(2px)", marginRight: 4 }}
  />
                      {post.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <time className="postbox__time">{formatDateTime(post.published_at)}</time>
                </div>

                <div className="postbox__actions">
                  <button
                    className={`react-btn ${myReaction === "like" ? "is-active" : ""}`}
                    onClick={() => react("like")}
                    disabled={!post.is_active}
                    title={!post.is_active ? "Likes disabled for inactive post" : ""}
                  >
                    <img src="/like.png" alt="like" />
                  </button>
                  <span className="count">{likes}</span>

                  <button
                    className={`react-btn ${myReaction === "dislike" ? "is-active" : ""}`}
                    onClick={() => react("dislike")}
                    disabled={!post.is_active}
                    title={!post.is_active ? "Likes disabled for inactive post" : ""}
                  >
                    <img src="/dislike.png" alt="dislike" />
                  </button>
                  <span className="count">{dislikes}</span>

                  {(canEditPost || canTogglePost) && (
                    <div className="menu-wrap" style={{ position: "relative" }}>
                      <button
                        ref={postMenuBtnRef}
                        className="dots-btn"
                        onClick={openPostMenu}
                        aria-haspopup="menu"
                        aria-expanded={postMenuOpen ? "true" : "false"}
                      >
                        <img src="/dots.png" alt="menu" />
                      </button>
                      <PortalPopover
                        open={postMenuOpen}
                        pos={postMenuPos}
                        onClose={() => setPostMenuOpen(false)}
                      >
                        {canEditPost && (
                          <>
                            <button
                              className="q-popover__item"
                              onClick={() => {
                                setPostMenuOpen(false);
                                setEditPostOpen(true);
                              }}
                            >
                              <img src="/edit.png" alt="" style={{ width: 18, height: 18 }} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="q-popover__item q-popover__danger"
                              onClick={async () => {
                                setPostMenuOpen(false);
                                await api.delete(`/posts/${post.id}`);
                                navigate("/");
                              }}
                            >
                              <img src="/trash.png" alt="" style={{ width: 18, height: 18 }} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {canTogglePost && (
                          <>
                            <div className="q-popover__divider" />
                            <div className="q-popover__group">
                              <div className="switch-row">
                                <span className="switch-label">
                                  {post.is_active ? "Active" : "Inactive"}
                                </span>
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={!!post.is_active}
                                    onChange={(e) => togglePostActive(e.target.checked)}
                                    disabled={updatingStatus}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                          </>
                        )}
                      </PortalPopover>
                    </div>
                  )}
                </div>
              </header>

              <h1 className="postbox__title">{post.title}</h1>
              <div className="postbox__content">{post.content}</div>

              {post.categories?.length > 0 && (
                <div className="postbox__cats">
                  {post.categories.map((cat) => (
                    <span key={cat.id} className="postbox__cat">
                      {cat.title}
                    </span>
                  ))}
                </div>
              )}

              {post.images?.length > 0 && (
                <div className="postbox__media">
                  <div className="postbox__carousel-wrap">
                    {post.images.length > 1 && (
                      <button
                        className="car-btn car-btn--prev"
                        type="button"
                        onClick={() => {
                          const el = document.querySelector(".postbox__carousel");
                          if (el)
                            el.scrollBy({
                              left: -el.clientWidth,
                              behavior: "smooth",
                            });
                        }}
                        aria-label="Prev"
                      >
                        ‹
                      </button>
                    )}

                    <div
                      className={`postbox__carousel ${post.images.length === 1 ? "is-single" : ""}`}
                    >
                      {post.images.map((img) => (
                        <img
                          key={img.id}
                          className="car-slide"
                          src={resolve(img.filepath)}
                          alt={img.alt_text || ""}
                          loading="lazy"
                        />
                      ))}
                    </div>

                    {post.images.length > 1 && (
                      <button
                        className="car-btn car-btn--next"
                        type="button"
                        onClick={() => {
                          const el = document.querySelector(".postbox__carousel");
                          if (el)
                            el.scrollBy({
                              left: el.clientWidth,
                              behavior: "smooth",
                            });
                        }}
                        aria-label="Next"
                      >
                        ›
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            <hr className="pv-sep" />

            <section className="commentsbox">
              <h2 className="commentsbox__title">Comments</h2>

              <form className="comment-form" onSubmit={submitComment}>
                <img
                  className="cmt-avatar"
                  src={resolve(authUser?.profile_pic)}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = "/avatar_def.png";
                  }}
                />
                <textarea
                  placeholder={
                    canComment ? "Write a comment…" : "Comments are disabled for inactive post"
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={1}
                  disabled={!canComment}
                />
                <button
                  className="send-icon"
                  type="submit"
                  aria-label="Send"
                  disabled={!canComment}
                  title={!canComment ? "Comments disabled" : ""}
                >
                  <img src="/comments.png" alt="" />
                </button>
              </form>

              <section className="comments">
                {commentTree.map((node) => (
                  <CommentNode
                    key={node.id}
                    node={node}
                    post={post}
                    authUser={authUser}
                    canComment={canComment}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSubmitReply={submitReply}
                    onDeleted={(id) => {
                      setComments((prev) => prev.filter((x) => x.id !== id));
                    }}
                    openThreads={openThreads} 
                    setOpenThreads={setOpenThreads}
                    onToggleSubtree={setSubtreeActive}
                    onDeleteSubtree={removeSubtree}
                  />
                ))}
              </section>
            </section>

            <EditPostModal
              open={editPostOpen}
              onClose={(updated) => {
                setEditPostOpen(false);
                if (updated) setPost(updated);
              }}
              post={post}
              canEditContent={canEditContent}
            />
          </article>
        )
      )}
    </div>
  );
}

function CommentNode({
  node,
  post,
  authUser,
  canComment,
  replyToId,
  setReplyToId,
  replyText,
  setReplyText,
  onSubmitReply,
  onDeleted,
  openThreads, 
  setOpenThreads,
  onToggleSubtree,
  onDeleteSubtree,
}) {
  const perItemCanSeeInactive =
    authUser?.role === "admin" || Number(authUser?.id ?? 0) === Number(node.author_id ?? 0);

  const isOpen = openThreads.has(node.id);
  const toggleOpen = () => {
    setOpenThreads(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  return (
    <>
      <CommentItem
        c={node}
        post={post}
        canSeeInactive={perItemCanSeeInactive}
        onDeleted={onDeleted}
        onOpenReply={() => {
          if (!canComment || !node.is_active) return;
          setReplyToId((cur) => (cur === node.id ? null : node.id));
          setReplyText("");
        }}
        onToggleSubtree={onToggleSubtree}
        onDeleteSubtree={onDeleteSubtree}
      />

      {replyToId === node.id && (
        <form
          className="comment-form comment-form--nested"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitReply();
          }}
          style={{ marginLeft: 50 }}
        >
          <img
            className="cmt-avatar"
            src={resolve(authUser?.profile_pic)}
            alt=""
            onError={(e) => {
              e.currentTarget.src = "/avatar_def.png";
            }}
          />
          <textarea
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={1}
            disabled={!canComment || !node.is_active}
            autoFocus
          />
          <button
            className="send-icon"
            type="submit"
            aria-label="Send"
            disabled={!canComment || !node.is_active || !replyText.trim()}
            title={!node.is_active ? "Replies disabled for inactive comment" : ""}
          >
            <img src="/comments.png" alt="" />
          </button>
        </form>
      )}

      {node.children?.length > 0 && (
        <>
          <button
            type="button"
            className={`replies-toggle ${isOpen ? "is-open" : ""}`}
            onClick={toggleOpen}
            aria-expanded={isOpen ? "true" : "false"}
          >
            <span className="replies-toggle__arrow" aria-hidden="true" />
            {isOpen ? "Hide answers" : `View ${node.children.length} replies`}
          </button>

          {isOpen && (
            <div className="comment-children">
              {node.children.map((child) => (
                <CommentNode
                  key={child.id}
                  node={child}
                  post={post}
                  authUser={authUser}
                  canComment={canComment}
                  replyToId={replyToId}
                  setReplyToId={setReplyToId}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onSubmitReply={onSubmitReply}
                  onDeleted={onDeleted}
                  openThreads={openThreads}
                  setOpenThreads={setOpenThreads}
                  onToggleSubtree={onToggleSubtree}
                  onDeleteSubtree={onDeleteSubtree}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function CommentItem({ c, post, canSeeInactive = false, onDeleted, onOpenReply, onToggleSubtree, onDeleteSubtree }) {
  const { user: authUser } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const canEdit = !!authUser && authUser.id === c.author_id;
  const canToggle =
    !!authUser &&
    (authUser.role === "admin" || authUser.id === c.author_id || authUser.id === post.author_id);

  const canDelete =
  !!authUser && (authUser.role === "admin" || authUser.id === c.author_id);


  const [myReaction, setMyReaction] = useState(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isActive, setIsActive] = useState(!!c.is_active);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const [commentText, setCommentText] = useState(c.content);

  const updateCommentReactions = async () => {
    const { data } = await api.get(`/comments/${c.id}/like`);
    if (Array.isArray(data)) {
      setLikes(data.filter((x) => x.type === "like").length);
      setDislikes(data.filter((x) => x.type === "dislike").length);
    } else {
      setLikes(Number(data?.likes || 0));
      setDislikes(Number(data?.dislikes || 0));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await updateCommentReactions();
      } catch {}
    })();
  }, [c.id]);

  useEffect(() => {
    setIsActive(!!c.is_active);
  }, [c.is_active]);

  const react = async (type) => {
    if (!authUser) return navigate("/login");
    try {
      if (myReaction === type) {
        await api.delete(`/comments/${c.id}/like`);
        setMyReaction(null);
      } else {
        await api.post(`/comments/${c.id}/like`, { type });
        setMyReaction(type);
      }
      await updateCommentReactions();
    } catch {}
  };

  const toggleActive = async (checked) => {
    onToggleSubtree?.(c.id, checked);
    try {
      await api.patch(`/comments/${c.id}`, { is_active: checked });
    } catch {
      onToggleSubtree?.(c.id, !checked);
    }
  };

  if (!isActive && !canSeeInactive) return null;

  const openMenu = () => {
    const el = btnRef.current;
    if (!el) {
      setMenuOpen((v) => !v);
      return;
    }
    const r = el.getBoundingClientRect();
    const width = 220;
    setMenuPos({
      top: r.bottom + 6,
      left: Math.max(8, r.right - width),
    });
    setMenuOpen(true);
  };

  const onContainerClick = (e) => {
    const target = e.target;
    const interactive = target.closest("button, [data-q-popover], .menu-wrap, .dots-btn, .react-btn, input, textarea, a");
    if (interactive) return;
    onOpenReply?.();
  };

  return (
    <div className={`comment ${isActive ? "" : "is-muted"}`} onClick={onContainerClick}>
      <img
        className="cmt-avatar"
        src={resolve(c.author_avatar)}
        alt=""
        onError={(e) => {
          e.currentTarget.src = "/avatar_def.png";
        }}
      />
      <div className="comment__main">
        <div className="comment__row">
          <div className="comment__who">
            <div className="c-author">
<Link to={`/profile/${c.author_id}`} className="link-unstyled">
  {c.author_login}
</Link>
</div>
            <div className="c-time">{formatDateTime(c.published_at)}</div>
          </div>

          <div className="c-actions">
            <button
              className={`react-btn ${myReaction === "like" ? "is-active" : ""}`}
              onClick={() => react("like")}
              type="button"
            >
              <img src="/like.png" alt="like" />
            </button>
            <span className="count">{likes}</span>

            <button
              className={`react-btn ${myReaction === "dislike" ? "is-active" : ""}`}
              onClick={() => react("dislike")}
              type="button"
            >
              <img src="/dislike.png" alt="dislike" />
            </button>
            <span className="count">{dislikes}</span>

            {(canEdit || canToggle) && (
              <div className="menu-wrap" style={{ position: "relative" }}>
                <button
                  ref={btnRef}
                  className="dots-btn"
                  onClick={openMenu}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen ? "true" : "false"}
                  type="button"
                >
                  <img src="/dots.png" alt="menu" />
                </button>

                <PortalPopover open={menuOpen} pos={menuPos} onClose={() => setMenuOpen(false)}>
                  <div className="q-popover__group">
                    {canEdit && (
                      <button
                        className="q-popover__item"
                        onClick={() => {
                          setMenuOpen(false);
                          setEditOpen(true);
                        }}
                      >
                        <img src="/edit.png" alt="" style={{ width: 18, height: 18 }} />
                        <span>Edit</span>
                      </button>
                    )}
                    {canDelete && (
  <button
    className="q-popover__item q-popover__danger"
    onClick={async () => {
      setMenuOpen(false);
      await api.delete(`/comments/${c.id}`);
      onDeleteSubtree?.(c.id);
    }}
  >
    <img src="/trash.png" alt="" style={{ width: 18, height: 18 }} />
    <span>Delete</span>
  </button>
)}

                  </div>

                  {canToggle && (
                    <>
                      <div className="q-popover__divider" />
                      <div className="q-popover__group">
                        <div className="switch-row">
                          <span className="switch-label">{isActive ? "Active" : "Inactive"}</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => toggleActive(e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </PortalPopover>
              </div>
            )}
          </div>
        </div>

        <div className="comment__content">{commentText}</div>
      </div>

      <EditCommentModal
        open={editOpen}
        onClose={(updated) => {
          setEditOpen(false);
          if (updated?.content !== undefined) setCommentText(updated.content);
        }}
        comment={{ ...c, content: commentText }}
      />
    </div>
  );
}
