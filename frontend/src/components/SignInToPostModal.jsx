// frontend/src/components/SignInToPostModal.jsx
import { Link } from "react-router-dom";
import Modal from "./Modal";

export default function SignInToPostModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <img src="/modal.png" alt="" style={{ width:48, height:48 }} />

        <h2 className="modal-title">Sign up to post</h2>
        <p className="modal-sub">
          Join <b>QAnswers</b> to share ideas, ask any questions,<br /> post random thoughts and more.
        </p>

        <Link
          to="/login"
          onClick={onClose}
          className="cta-login-btn"
        >
          <img src="/log_in.png" alt="" style={{ width:24, height:24 }} />
          <span>Continue to login</span>
          <span className="chev">›</span>
        </Link>
      </div>
    </Modal>
  );
}
