// frontend/src/components/EditPostModal.jsx
import { useEffect, useState } from "react";
import { api } from "../shared/api/axios";
import Modal from "./Modal";

 export default function EditPostModal({ open, onClose, post, canEditContent=false }) {
   const [cats, setCats] = useState([]);
   const [content, setContent] = useState(post?.content || "");
   const [selected, setSelected] = useState(post?.categories?.map(c=>c.id) || []);
   const [saving, setSaving] = useState(false);
   const [err, setErr] = useState("");

   useEffect(() => {
     if (!open) return;
     (async () => {
       try {
         const { data } = await api.get("/categories");
         setCats(data || []);
       } catch {}
     })();
   }, [open]);

   useEffect(() => {
     setContent(post?.content || "");
     setSelected(post?.categories?.map(c=>c.id) || []);
   }, [post]);

   const toggleCat = (id) => {
     setSelected((prev) => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
   };

   const onSave = async () => {
     try {
       setSaving(true); setErr("");
       const patch = { categories: selected };
       if (canEditContent) patch.content = content;
       const { data } = await api.patch(`/posts/${post.id}`, patch);
       onClose?.(data);
     } catch (e) {
       setErr(e?.response?.data?.message || "Failed to update post");
     } finally {
       setSaving(false);
     }
   };

    if (!open) return null;
 return (
   <Modal open={open} onClose={() => onClose?.()}>
     <div className="q-modal-card">
       <div className="q-modal__head">
         <h3 className="q-modal__title">Edit post</h3>
         <button className="q-modal__close" onClick={()=>onClose?.()}>×</button>
       </div>

       <div className="q-form">
         <div className="q-field">
           <label>Categories (multi)</label>
           <div className="q-chips">
             {cats.map(c => (
               <button
                 key={c.id}
                type="button"
                className={`q-chip ${selected.includes(c.id) ? "is-on":""}`}
                onClick={()=>toggleCat(c.id)}
              >
                 {c.title}
               </button>
             ))}
            {cats.length===0 && <span className="q-hint">No categories</span>}
           </div>
         </div>

         {canEditContent && (
           <div className="q-field">
             <label>Content</label>
             <textarea rows={8} value={content} onChange={(e)=>setContent(e.target.value)} />
           </div>
         )}

         {err && <div className="q-error">{err}</div>}

         <div className="q-actions">
           <button className="q-btn q-btn--ghost" onClick={()=>onClose?.()}>Cancel</button>
           <button className="q-btn q-btn--primary" disabled={saving} onClick={onSave}>
             {saving ? "Saving..." : "Save"}
           </button>
         </div>
       </div>
     </div>
   </Modal>
  );
 }
