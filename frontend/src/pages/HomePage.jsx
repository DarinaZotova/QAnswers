// frontend/src/pages/HomePage.jsx
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPosts, setParams } from "../features/posts/postsActions";
import PostCard from "../components/PostCard";
import PostsFilterPanel from "../components/PostsFilterPanel";
import "./PostsFeed.css";

import Pagination from "../components/Pagination";


export default function HomePage() {
  const dispatch = useDispatch();
  const { items, loading, error, page, total, limit, params } = useSelector(s => s.posts);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    if (!items || items.length === 0) {
      const init = { page: 1, limit: 10, sort: "likes", order: "desc", status: "active" };
      dispatch(setParams(init));
      dispatch(fetchPosts(init));
    }
  }, [dispatch]);

  useEffect(() => {
   const next = params && Object.keys(params).length
    ? { ...params, page: 1 }              
    : { page: 1, limit: 10, sort: "likes", order: "desc", status: "active" };
   dispatch(setParams(next));
  dispatch(fetchPosts(next));
   }, [dispatch, user?.id, user?.role]); 

  const effectiveTotal = typeof total === "number" && total >= 0 ? total : (items?.length || 0);
  const effectiveLimit = limit || 10;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(effectiveTotal / effectiveLimit)),
    [effectiveTotal, effectiveLimit]
  );

  const goToPage = (p) => {
    const safe = Math.min(Math.max(1, p), totalPages);
    const next = { ...params, page: safe, limit: effectiveLimit };
    dispatch(setParams(next));
    dispatch(fetchPosts(next));
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
        <h2 style={{ margin:0 }}>Posts</h2>
        <PostsFilterPanel />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && items?.length === 0 && <p>No posts found.</p>}

      <div className="feed">
  {items?.map((p) => (
    <PostCard key={p.id} post={p} />
  ))}
</div>
      <Pagination
  page={page || 1}
  limit={effectiveLimit}
  total={effectiveTotal}
  onChange={goToPage}
/>

    </div>
  );
}
