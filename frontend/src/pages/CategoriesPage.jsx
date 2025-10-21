// frontend/src/pages/CategoriesPage.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../features/categories/categoriesActions";
import { fetchPosts, setParams } from "../features/posts/postsActions";
import { useNavigate } from "react-router-dom";
import SpotlightCard from "../components/SpotlightCard";
import "./CategoriesPage.css";

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories = [], loading, error } = useSelector((s) => s.categories);
  const { params: postParams } = useSelector((s) => s.posts);

  useEffect(() => {
    if (!categories.length) dispatch(fetchCategories());
  }, [dispatch]);

  const applyCategory = (catIdOrEmpty) => {
    const next = {
      ...(postParams || {}),
      page: 1,
      q: "",
      category: catIdOrEmpty || "",
    };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="cats-container">
      <h2 style={{ margin: "0 0 16px 0" }}>Categories</h2>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => applyCategory("")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #2a3242",
            background: "transparent",
            color: "#e9efff",
            cursor: "pointer",
          }}
          title="Show posts from all categories"
        >
          All categories
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "tomato" }}>{error}</p>}

      <div className="cats-grid">
        {categories.map((c) => (
          <SpotlightCard
            key={c.id}
            className="cat-card"
            spotlightColor="rgba(191,165,255,0.25)"
            onClick={() => applyCategory(String(c.id))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && applyCategory(String(c.id))}
          >
            <h3 className="cat-card__title">{c.title}</h3>
            <p className="cat-card__desc">{c.description || "—"}</p>
          </SpotlightCard>
        ))}
      </div>

      {!loading && !error && categories.length === 0 && <p>No categories yet.</p>}
    </div>
  );
}
