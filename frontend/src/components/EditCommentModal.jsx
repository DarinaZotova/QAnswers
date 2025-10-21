// frontend/src/components/EditCommentModal.jsx
import { useState, useEffect } from "react";
import { api } from "../shared/api/axios";
import Modal from "./Modal";

 export default function EditCommentModal({ open, onClose, comment }) {
   const [content, setContent] = useState(comment?.content || "");
   const [saving, setSaving] = useState(false);
   const [err, setErr] = useState("");

   useEffect(() => {
     setContent(comment?.content || "");
   }, [comment]);

   const onSave = async () => {
     try {
       setSaving(true); setErr("");
       const { data } = await api.patch(`/comments/${comment.id}`, { content });
       onClose?.(data);
     } catch (e) {
       setErr(e?.response?.data?.message || "Failed to update comment");
     } finally {
       setSaving(false);
     }
   };

 if (!open) return null;

return (
   <Modal open={open} onClose={() => onClose?.()}>
     <div className="q-modal-card">
       <div className="q-modal__head">
         <h3 className="q-modal__title">Edit comment</h3>
         <button className="q-modal__close" onClick={() => onClose?.()}>×</button>
       </div>
       
      <div className="q-form">
         <div className="q-field">
           <label>Content</label>
           <textarea rows={6} value={content} onChange={(e)=>setContent(e.target.value)} />
         </div>

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
