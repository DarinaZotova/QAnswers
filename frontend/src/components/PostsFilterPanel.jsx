// src/components/PostsFilterPanel.jsx
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../features/categories/categoriesActions";
import { fetchPosts, setParams } from "../features/posts/postsActions";
import "./PostsFilterPanel.css";

export default function PostsFilterPanel() {
  const dispatch = useDispatch();
  const { items: cats = [] } = useSelector((s) => s.categories);
  const { params } = useSelector((s) => s.posts);
  const { user } = useSelector((s) => s.auth);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  const [form, setForm] = useState({
    sort: params.sort || "likes",
    order: params.order || "desc",
    status: params.status || "active",
    categories: Array.isArray(params.category)
      ? params.category
      : (typeof params.category === "string" && params.category
          ? params.category.split(",").map(Number).filter(Boolean)
          : []),
    from: params.from || "",
    to: params.to || "",
  });

  useEffect(() => {
    if (!cats.length) dispatch(fetchCategories());
    setForm((f) => ({
      ...f,
      sort: params.sort || "likes",
      order: params.order || "desc",
      status: params.status || "active",
      categories: Array.isArray(params.category)
        ? params.category
        : (typeof params.category === "string" && params.category
            ? params.category.split(",").map(Number).filter(Boolean)
            : []),
      from: params.from || "",
      to: params.to || "",
    }));
  }, [dispatch, cats.length, params]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const toggleCategory = (id) => {
    setForm((f) => {
      const has = f.categories.includes(id);
      return { ...f, categories: has ? f.categories.filter((x) => x !== id) : [...f.categories, id] };
    });
  };
  const clearCategories = () => setForm((f) => ({ ...f, categories: [] }));

  const apply = () => {
    const safeStatus = !user && form.status === "inactive" ? "active" : form.status;
    const next = {
      page: 1,
      sort: form.sort,
      order: form.order,
      status: isAdmin ? form.status : safeStatus,
      category: form.categories,
      ...(form.from ? { from: form.from } : {}),
      ...(form.to ? { to: form.to } : {}),
    };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
    setOpen(false);
  };

  const reset = () => {
    const next = { page: 1, sort: "likes", order: "desc", status: "active", category: [], from: "", to: "" };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
    setOpen(false);
  };

  return (
    <div className="pfp-root">
      <button
        className="pfp-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Filters & Sort"
      >
        <img src="/filter.png" alt="" aria-hidden="true" />
        <span>Filters</span>
      </button>

      {open && (
        <div className="pfp-popover" ref={popoverRef} role="dialog" aria-label="Filters and sorting">
          <div className="pfp-row">
            <div className="pfp-label">Sort by</div>
            <div className="segmented">
              <button
                className={`segmented__btn ${form.sort === "date" ? "is-active" : ""}`}
                onClick={() => setField("sort", "date")}
              >
                Date
              </button>
              <button
                className={`segmented__btn ${form.sort === "likes" ? "is-active" : ""}`}
                onClick={() => setField("sort", "likes")}
              >
                Likes
              </button>
            </div>
          </div>

          <div className="pfp-row">
            <div className="pfp-label">Order</div>
            <div className="segmented">
              <button
                className={`segmented__btn ${form.order === "desc" ? "is-active" : ""}`}
                onClick={() => setField("order", "desc")}
              >
                Desc
              </button>
              <button
                className={`segmented__btn ${form.order === "asc" ? "is-active" : ""}`}
                onClick={() => setField("order", "asc")}
              >
                Asc
              </button>
            </div>
          </div>

          <div className="pfp-row">
            <div className="pfp-label">Status</div>
            <div className="segmented segmented--wrap">
              <button
                className={`segmented__btn ${form.status === "active" ? "is-active" : ""}`}
                onClick={() => setField("status", "active")}
              >
                Active
              </button>

              <button
                className={`segmented__btn ${form.status === "inactive" ? "is-active" : ""}`}
                onClick={() => setField("status", "inactive")}
                disabled={!user}
                title={!user ? "Log in to view your inactive posts" : undefined}
              >
                Inactive {isAdmin ? "(all)" : "(mine)"}
              </button>

              {isAdmin && (
                <button
                  className={`segmented__btn ${form.status === "all" ? "is-active" : ""}`}
                  onClick={() => setField("status", "all")}
                >
                  All
                </button>
              )}
            </div>
          </div>

          <div className="pfp-row">
            <div className="pfp-label with-action">
              <span>Categories</span>
              <button className="link-btn" onClick={clearCategories}>Clear</button>
            </div>
            <div className="chips">
              {cats.length === 0 && <div className="muted">No categories</div>}
              {cats.map((c) => {
                const active = form.categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className={`chip ${active ? "chip--active" : ""}`}
                    onClick={() => toggleCategory(c.id)}
                    title={c.title}
                  >
                    <span className="chip__dot" />
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pfp-row">
            <div className="pfp-label">Date range</div>
            <div className="dates">
              <label className="date-field">
                <span>From</span>
                <input
                  type="date"
                  value={form.from}
                  onChange={(e) => setField("from", e.target.value)}
                />
              </label>
              <label className="date-field">
                <span>To</span>
                <input
                  type="date"
                  value={form.to}
                  onChange={(e) => setField("to", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="pfp-actions">
            <button className="btn btn--ghost" onClick={reset}>Reset</button>
            <button className="btn btn--primary" onClick={apply}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
