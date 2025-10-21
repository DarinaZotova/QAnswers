// frontend/src/components/Sidebar.jsx
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import SignInToPostModal from "./SignInToPostModal";
import CreatePostModal from "./CreatePostModal";

const HEADER_H = 72;

export default function Sidebar() {
  const { user } = useSelector((s) => s.auth);
  const [askSignInOpen, setAskSignInOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreatePost = () => {
    if (!user) setAskSignInOpen(true);
    else setCreateOpen(true);
  };

  return (
    <>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 90,
          height: "100vh",
          borderRight: "1px solid #1f2430",
          zIndex: 99
        }}
      >
        <div
          style={{
            marginTop: HEADER_H,
            height: `calc(100vh - ${HEADER_H}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32
          }}
        >
          <Link to="/" title="Home">
            <img src="/home.png" alt="Home" style={{ width: 28, height: 28 }} />
          </Link>

          <button
            onClick={handleCreatePost}
            title="Create Post"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img src="/post.png" alt="Create" style={{ width: 50, height: 50 }} />
          </button>

          <Link to="/categories" title="Categories">
            <img src="/category.png" alt="Categories" style={{ width: 28, height: 28 }} />
          </Link>
        </div>
      </aside>

      <SignInToPostModal open={askSignInOpen} onClose={() => setAskSignInOpen(false)} />
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
