//frontend/src/components/EditProfileModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "./Modal";
import { api } from "../shared/api/axios";
import { setUser, logout } from "../features/auth/authActions";
import { setAuth, getToken, clearAuth } from "../shared/utils/storage";
import "./EditProfileModal.css";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const resolveAvatar = (raw) => {
  if (!raw || raw === "null" || raw === "undefined") return "/avatar_def.png";
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_ORIGIN}${normalized}`;
};

export default function EditProfileModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [login, setLogin] = useState(user?.login || "");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const fileRef = useRef(null);

  const avatarSrc = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    const base = resolveAvatar(user?.profile_pic);
    return user?.profile_pic
      ? `${base}?v=${encodeURIComponent(user?.updated_at || user?.id || Date.now())}`
      : "/avatar_def.png";
  }, [avatarFile, user]);

  useEffect(() => {
    if (open) {
      setLogin(user?.login || "");
      setFullName(user?.full_name || "");
      setAvatarFile(null);
      setErr("");
      setOk("");
    }
  }, [open, user]);

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile) return null;
    const fd = new FormData();
    fd.set("avatar", avatarFile);
    const { data } = await api.patch("/users/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; 
  };

  const patchProfile = async () => {
    const payload = { login, full_name: fullName };
    const { data } = await api.patch(`/users/${user.id}`, payload);
    return data;
  };

  const onSave = async () => {
    setLoading(true); setErr(""); setOk("");
    try {
      let updated = user;
      if (avatarFile) {
        const u = await uploadAvatarIfNeeded();
        updated = u || updated;
      }
      if (login !== user?.login || fullName !== user?.full_name) {
        updated = await patchProfile();
      }
      dispatch(setUser(updated));
      const token = getToken();
      if (token) setAuth(token, updated);

      setOk("Saved");
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to save";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete account permanently?")) return;
    if (!window.confirm("This action cannot be undone. Continue?")) return;

    setLoading(true); setErr(""); setOk("");
    try {
      await api.delete(`/users/${user.id}`);
      clearAuth();
      await dispatch(logout());
      setOk("Account deleted");
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to delete account";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="ep-modal">
        <h2 className="ep-title">Edit profile</h2>

        <div className="ep-body">
          <div className="ep-avatar-row">
            <img
              src={avatarSrc}
              alt="avatar"
              className="ep-avatar"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar_def.png"; }}
            />
            <div className="ep-avatar-actions">
              <button
                type="button"
                className="ep-btn"
                onClick={() => fileRef.current?.click()}
              >
                <img alt="" className="ep-avatar-upload-icon" src="/upload_2.png" />
                Upload avatar
              </button>
              {avatarFile && (
                <button
                  type="button"
                  className="ep-btn ep-btn--ghost"
                  onClick={() => setAvatarFile(null)}
                >
                  Cancel avatar
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <label className="ep-field">
            <span>Login</span>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Your login"
            />
          </label>

          <label className="ep-field">
            <span>Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </label>

          {err && <div className="ep-msg ep-msg--err">{err}</div>}
          {ok && <div className="ep-msg ep-msg--ok">{ok}</div>}
        </div>

        <div className="ep-footer">
          <button className="ep-btn ep-btn--danger-left" onClick={onDelete} disabled={loading}>
            Delete account
          </button>
          <div className="ep-actions-right">
            <button className="ep-btn ep-btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="ep-btn ep-btn--primary" onClick={onSave} disabled={loading}>
              {loading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
