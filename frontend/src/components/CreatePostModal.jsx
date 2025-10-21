// frontend/src/components/CreatePostModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "./Modal";
import { fetchCategories } from "../features/categories/categoriesActions";
import { fetchPosts, setParams } from "../features/posts/postsActions";
import { api } from "../shared/api/axios";
import "./CreatePostModal.css";

export default function CreatePostModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { items: cats = [], loading: catsLoading } = useSelector(s => s.categories);
  const { params } = useSelector(s => s.posts);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [uploadMsg, setUploadMsg] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null); 

  useEffect(() => {
    if (open && !cats.length) dispatch(fetchCategories());
  }, [open, cats.length, dispatch]);

  const updateFileMessages = (list) => {
    if (list.length === 0) {
      setUploadMsg("");
      setFileError("");
    } else {
      setUploadMsg(list.length === 1 ? "1 file selected" : `${list.length} files selected`);
      setFileError("");
    }
  };

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setSelectedCats([]);
      setFiles([]);
      setError("");
      setSubmitting(false);
      setUploadMsg("");
      setFileError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      content.trim().length > 0 &&
      selectedCats.length > 0 &&
      !submitting &&
      !fileError,
    [title, content, selectedCats, submitting, fileError]
  );

  const toggleCat = (id) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const onPickFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) {
      setFiles([]);
      setUploadMsg("");
      setFileError("");
      return;
    }

    setFiles(prev => {
      const merged = [...prev, ...chosen];

      const seen = new Set();
      const uniq = [];
      for (const f of merged) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!seen.has(key)) { seen.add(key); uniq.push(f); }
      }

      const limited = uniq.slice(0, 5);
      const tooMany = uniq.length > 5;

      if (limited.length === 0) {
        setUploadMsg("");
        setFileError("");
      } else {
        setUploadMsg(limited.length === 1 ? "1 file selected" : `${limited.length} files selected`);
        setFileError(tooMany ? "Maximum 5 images allowed" : "");
      }

      return limited;
    });
    e.target.value = "";
  };

  const removeFileAt = (idx) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      updateFileMessages(next);
      if (next.length === 0 && fileInputRef.current) fileInputRef.current.value = "";
      return next;
    });
  };

  const submit = async () => {
    if (!canSubmit) {
      setError("Please fill Title, Description and choose at least 1 category.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", content.trim());
      selectedCats.forEach(id => fd.append("categories[]", String(id)));
      files.forEach(f => fd.append("images", f));

      await api.post("/posts", fd, { headers: { "Content-Type": "multipart/form-data" } });

      const next = { ...(params || {}), page: 1 };
      dispatch(setParams(next));
      dispatch(fetchPosts(next));
      onClose?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to create post";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="cp-modal">
        <h2 className="cp-title">Create Post</h2>

        <div className="cp-field">
          <label className="cp-label">Title *</label>
          <input
            className="cp-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Post title"
          />
        </div>

        <div className="cp-field">
          <label className="cp-label">Description *</label>
          <textarea
            className="cp-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post…"
            rows={6}
          />
        </div>

        <div className="cp-field">
          <div className="cp-label-row">
            <label className="cp-label">Categories *</label>
            <button type="button" className="cp-link" onClick={() => setSelectedCats([])}>Clear</button>
          </div>

          <div className="cp-cats">
            {catsLoading && <div className="cp-hint">Loading categories…</div>}
            {!catsLoading && cats.length === 0 && <div className="cp-hint">No categories</div>}
            {cats.map(c => (
              <label key={c.id} className={`cp-chip ${selectedCats.includes(c.id) ? "cp-chip--on" : ""}`}>
                <input
                  type="checkbox"
                  checked={selectedCats.includes(c.id)}
                  onChange={() => toggleCat(c.id)}
                />
                <span>{c.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="cp-field">
          <input
            id="images"
            ref={fileInputRef}       
            className="cp-file-input-hidden"
            type="file"
            multiple
            accept="image/*"
            onChange={onPickFiles}
          />
          <label htmlFor="images" className="cp-file-btn">
            <img src="/upload.png" alt="" className="cp-file-btn__icon" />
            <span>Choose files</span>
          </label>

          {uploadMsg && <div className="cp-upload-ok">{uploadMsg}</div>}
          {fileError && <div className="cp-error" style={{ marginTop: 6 }}>{fileError}</div>}

          {files.length > 0 && (
            <ul className="cp-files">
              {files.map((f, i) => (
                <li key={`${f.name}-${f.size}-${f.lastModified}`} className="cp-file-row">
                  <span className="cp-file-name">
                    {f.name} <span className="cp-file-size">({Math.round(f.size / 1024)} KB)</span>
                  </span>
                  <button
                    type="button"
                    className="cp-file-del"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeFileAt(i)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="cp-error">{error}</div>}

        <div className="cp-actions">
          <button type="button" className="cp-btn cp-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="cp-btn" onClick={submit} disabled={!canSubmit}>
            Post
          </button>
        </div>
      </div>
    </Modal>
  );
}
