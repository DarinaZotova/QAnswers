// frontend/src/pages/AdminPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../shared/api/axios";
import Modal from "../components/Modal";
import SpotlightCard from "../components/SpotlightCard";
import { createPortal } from "react-dom";


import "./AdminPage.css";

const USERS_API = {
  list:   "/users",
  create: "/users",
  patch:  (id) => `/users/${id}`,
  remove: (id) => `/users/${id}`,
};

const POSTS_API = {
  list: "/admin/posts",
};

const CATS_API = {
  list: "/categories",
  create: "/categories",
  patch: (id) => `/categories/${id}`,
  remove: (id) => `/categories/${id}`,
};

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
const resolveAvatar = (raw) =>
  !raw || raw === "null" || raw === "undefined"
    ? "/avatar_def.png"
    : /^https?:\/\//i.test(raw)
    ? raw
    : `${API_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;

function usePopover() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  const toggle = () => {
    const el = btnRef.current;
    if (!el) return setOpen((v) => !v);
    const r = el.getBoundingClientRect();
    const width = 220;
    setPos({ top: r.bottom + 6, left: Math.max(8, r.right - width) });
    setOpen((v) => !v);
  };
  return { open, setOpen, pos, btnRef, toggle };
}

function PortalPopover({ open, pos, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const t = e.target;
      if (!(t.closest && t.closest("[data-q-popover]"))) onClose?.();
    };
    const esc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
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

function UserModal({ open, onClose, initial, mode="create" }) {
  const isEdit = mode === "edit";
  const [login, setLogin] = useState(initial?.login || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role || "user");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  useEffect(() => {
    if (open) {
      setLogin(initial?.login || "");
      setEmail(initial?.email || "");
      setFullName(initial?.full_name || "");
      setPassword("");
      setRole(initial?.role || "user");
      setErr("");
      setConfirmPwd("");
    }
  }, [open, initial]);

  const submit = async () => {
    try {
      setSaving(true); setErr("");
      if (isEdit) {
        const payload = {};
        if (fullName !== initial?.full_name) payload.full_name = fullName;
        if (role !== initial?.role) payload.role = role;
        if (!Object.keys(payload).length) return onClose?.(null);
        const { data } = await api.patch(USERS_API.patch(initial.id), payload);
        onClose?.(data);
      } else {
        if (password !== confirmPwd) {
          setErr("Passwords do not match");
          setSaving(false);
          return;
        }
        const body = { login, email, full_name: fullName, password, password_confirmation: confirmPwd, role };
        const { data } = await api.post(USERS_API.create, body);
        onClose?.(data);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={()=>onClose?.(null)}>
    <div className="ep-modal adm-modal"> 
      <h3 className="ep-title">{isEdit ? "Edit user" : "Create user"}</h3>


           {!isEdit && (
          <>
         <label className="ep-field">
              <span>Login *</span>
              <input value={login} onChange={e=>setLogin(e.target.value)} placeholder="login" />
            </label>
          <label className="ep-field">
              <span>Email *</span>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" />
            </label>
             <label className="ep-field">
              <span>Password *</span>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" />
            </label>
   <label className="ep-field">
              <span>Confirm password *</span>
              <input
                type="password"
                value={confirmPwd}
                onChange={e=>setConfirmPwd(e.target.value)}
                placeholder="••••••"
              />
            </label>
          </>
        )}
 
 <label className="ep-field">
          <span>Full name *</span>
          <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Full name" />
        </label>
<div className="ep-field">
  <span>Role *</span>
  <div className="segmented">
    <button
      type="button"
      className={`segmented__btn ${role === "user" ? "is-active" : ""}`}
      onClick={()=>setRole("user")}
    >
      user
    </button>
    <button
      type="button"
      className={`segmented__btn ${role === "admin" ? "is-active" : ""}`}
      onClick={()=>setRole("admin")}
    >
      admin
    </button>
  </div>
</div>

      {err && <div className="ep-msg ep-msg--err" style={{marginTop:8}}>{err}</div>}

      <div className="ep-footer">
        <div className="ep-actions-right">
          <button className="ep-btn ep-btn--ghost" onClick={()=>onClose?.(null)}>Cancel</button>
           <button className="ep-btn ep-btn--primary" disabled={saving} onClick={submit}>
              {saving ? "Saving..." : "Save"}
            </button>
        </div>
     </div>
      </div>
    </Modal>
  );

}

function CategoryModal({ open, onClose, initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setErr("");
    }
  }, [open, initial]);

  const submit = async () => {
    try {
      setSaving(true); setErr("");
      if (isEdit) {
        const { data } = await api.patch(CATS_API.patch(initial.id), { title, description });
        onClose?.(data);
      } else {
        const { data } = await api.post(CATS_API.create, { title, description });
        onClose?.(data);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={()=>onClose?.(null)}>
   <div className="ep-modal adm-modal">
     <h3 className="ep-title">{isEdit ? "Edit category" : "Create category"}</h3>
     <label className="ep-field">
          <span>Title *</span>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Category title" />
        </label>
      <label className="ep-field">
          <span>Description *</span>
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" />
        </label>
        {err && <div className="ep-msg ep-msg--err" style={{marginTop:8}}>{err}</div>}
      <div className="ep-footer">
        <div className="ep-actions-right">
         <button className="ep-btn ep-btn--ghost" onClick={()=>onClose?.(null)}>Cancel</button>
         <button className="ep-btn ep-btn--primary" disabled={saving} onClick={submit}>
            {saving ? "Saving..." : "Save"}
         </button>
       </div>
       </div>
      </div>
    </Modal>
  );

}
function UsersTab() {
  const { user: me } = useSelector((s)=>s.auth);
  const [allRows, setAllRows] = useState([]);              
  const [rows, setRows] = useState([]);                   
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchLogin, setSearchLogin] = useState("");     
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(()=>{
    let alive = true;
    (async()=>{
      try {
        setLoading(true); setErr("");
        const { data } = await api.get(USERS_API.list);
        if (!alive) return;
        const list = Array.isArray(data) ? data : (data.items || []);
        setAllRows(list);                                   
        setRows(list);                                      
      } catch(e){
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load users");
      } finally { if (alive) setLoading(false); }
    })();
    return ()=>{ alive = false; };
  },[]);

  useEffect(() => {
    const term = searchLogin.trim().toLowerCase();
    if (!term) return setRows(allRows);
    setRows(allRows.filter(u => (u.login || "").toLowerCase().includes(term)));
  }, [searchLogin, allRows]);

  const onDelete = async (u) => {
    if (!window.confirm(`Delete user #${u.id} (${u.login})?`)) return;
    await api.delete(USERS_API.remove(u.id));
    setAllRows(prev => prev.filter(x=>x.id!==u.id));       
    setRows(prev => prev.filter(x=>x.id!==u.id));
  };

  return (
    <div className="adm-tab">
      <div className="adm-tab__bar">
        <h2>Users</h2>
        <div className="adm-bar-right">                     
          <input
            className="adm-search"                          
            placeholder="Search by login…"
            value={searchLogin}
            onChange={(e)=>setSearchLogin(e.target.value)}
          />
          <button className="q-btn q-btn--primary" onClick={()=>setCreateOpen(true)}>+ Create</button>
        </div>
      </div>

      {loading ? (
        <div className="postpage__hint">Loading…</div>
      ) : err ? (
        <div className="postpage__err">{err}</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Email</th>
                <th>Full name</th>
                <th>Role</th>
                <th>Rating</th>
                <th>Created</th>
                <th style={{width:40}} />
              </tr>
            </thead>
            <tbody>
              {rows.map(u=>{
                return <UserRow key={u.id} u={u} me={me} onEdit={setEditUser} onDelete={onDelete} />;
              })}
            </tbody>
          </table>
          {rows.length===0 && <div className="postpage__hint" style={{marginTop:12}}>No users</div>}
        </div>
      )}

      <UserModal
        open={createOpen}
        onClose={(created)=>{
          setCreateOpen(false);
          if (created) {
            setAllRows(prev=>[created, ...prev]); 
            setRows(prev=>[created, ...prev]);
          }
        }}
        mode="create"
      />

      <UserModal
        open={!!editUser}
        onClose={(updated)=>{
          setEditUser(null);
          if (updated) {
            setAllRows(prev=>prev.map(x=>x.id===updated.id? updated : x));
            setRows(prev=>prev.map(x=>x.id===updated.id? updated : x));
          }
        }}
        initial={editUser || undefined}
        mode="edit"
      />
    </div>
  );
}

function UserRow({ u, me, onEdit, onDelete }) {
  const { open, setOpen, pos, btnRef, toggle } = usePopover();
  return (
    <tr>
      <td>{u.id}</td>
      <td>
        <div className="adm-user">
          <img className="adm-user__avatar" src={resolveAvatar(u.profile_pic)} alt="" onError={e=>{e.currentTarget.src="/avatar_def.png"}} />
          <div>
            <div className="adm-user__login">{u.login}</div>
          </div>
        </div>
      </td>
      <td>{u.email}</td>
      <td>{u.full_name}</td>
      <td><span className={`badge ${u.role==="admin"?"is-admin":""}`}>{u.role}</span></td>
      <td>{u.rating ?? 0}</td>
      <td>{new Date(u.created_at).toLocaleString()}</td>
      <td className="ta-right">
        <button ref={btnRef} className="dots-btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open?"true":"false"}>
          <img src="/dots.png" alt="menu" />
        </button>
        <PortalPopover open={open} pos={pos} onClose={()=>setOpen(false)}>
          <div className="q-popover__group">
            <button className="q-popover__item" onClick={()=>{ setOpen(false); onEdit?.(u); }}>
              <img src="/edit.png" alt="" style={{width:18,height:18}} /><span>Edit</span>
            </button>
            {me?.id !== u.id && (
              <button className="q-popover__item q-popover__danger" onClick={()=>{ setOpen(false); onDelete?.(u); }}>
                <img src="/trash.png" alt="" style={{width:18,height:18}} /><span>Delete</span>
              </button>
            )}
          </div>
        </PortalPopover>
      </td>
    </tr>
  );
}

function PostsTab() {
  const nav = useNavigate();
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);            
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");

  useEffect(()=>{
    let alive = true;
    (async()=>{
      try{
        setLoading(true); setErr("");
        const { data } = await api.get(POSTS_API.list, { params: { page:1, limit:100 } });
        if (!alive) return;
        const list = data?.items || [];
        setAllRows(list);                             
        setRows(list);                               
      } catch(e){
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load posts");
      } finally { if (alive) setLoading(false); }
    })();
    return ()=>{ alive=false; };
  },[]);

  useEffect(() => {
    const term = searchTitle.trim().toLowerCase();
    if (!term) return setRows(allRows);
    setRows(allRows.filter(p => (p.title || "").toLowerCase().includes(term)));
  }, [searchTitle, allRows]);

  return (
    <div className="adm-tab">
      <div className="adm-tab__bar">
        <h2>Posts</h2>
        <div className="adm-bar-right">
          <input
            className="adm-search"
            placeholder="Search by title…"
            value={searchTitle}
            onChange={(e)=>setSearchTitle(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="postpage__hint">Loading…</div>
      ) : err ? (
        <div className="postpage__err">{err}</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--clickable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Content</th>
                <th>Author</th>
                <th>Status</th>
                <th>Score</th>
                <th>Published</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p=>(
                <tr key={p.id} onClick={()=>nav(`/posts/${p.id}`)} title="Open post">
                  <td>{p.id}</td>
                  <td className="cut">{p.title}</td>
                  <td className="cut cut--2lines">{p.content}</td>
                  <td className="cut">{p.author?.login || p.author_login || p.author_id}</td>
                  <td>
                    <span className={`badge ${p.is_active?"is-active":"is-inactive"}`}>{p.is_active?"active":"inactive"}</span>
                  </td>
                  <td>{p.score ?? 0}</td>
                  <td>{new Date(p.published_at).toLocaleString()}</td>
                  <td>{p.updated_at ? new Date(p.updated_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length===0 && <div className="postpage__hint" style={{marginTop:12}}>No posts</div>}
        </div>
      )}
    </div>
  );
}


function CategoriesTab() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEdit, setCatEdit] = useState(null);

  const load = async () => {
    try{
      setLoading(true); setErr("");
      const { data } = await api.get(CATS_API.list);
      setRows(data || []);
    } catch(e){
      setErr(e?.response?.data?.message || "Failed to load categories");
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const onDelete = async (c) => {
    if (!window.confirm(`Delete category #${c.id} "${c.title}"?`)) return;
    await api.delete(CATS_API.remove(c.id));
    setRows(prev => prev.filter(x=>x.id!==c.id));
  };

  return (
    <div className="adm-tab">
      <div className="adm-tab__bar">
        <h2>Categories</h2>
      </div>

      {loading ? (
        <div className="postpage__hint">Loading…</div>
      ) : err ? (
        <div className="postpage__err">{err}</div>
      ) : (
        <div className="adm-grid">
          <button className="cat-card cat-card--create" onClick={()=>{ setCatEdit(null); setCatModalOpen(true); }}>
            <div className="plus">+</div>
            <div className="plus">Create</div>
          </button>

          {rows.map(c=>(
            <CategoryCard key={c.id} c={c} onEdit={(x)=>{ setCatEdit(x); setCatModalOpen(true); }} onDelete={onDelete} />
          ))}
        </div>
      )}

      <CategoryModal
        open={catModalOpen}
        initial={catEdit || undefined}
        onClose={(saved)=>{
          setCatModalOpen(false);
          if (!saved) return;
          if (catEdit) setRows(prev=>prev.map(x=>x.id===saved.id ? saved : x));
          else setRows(prev=>[saved, ...prev]);
        }}
      />
    </div>
  );
}

function CategoryCard({ c, onEdit, onDelete }) {
  const { open, setOpen, pos, btnRef, toggle } = usePopover();
  return (
    <SpotlightCard className="cat-card">
      <div className="cat-card__head">
        <div className="cat-card__title cut">{c.title}</div>
        <button ref={btnRef} className="dots-btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open?"true":"false"}>
          <img src="/dots.png" alt="menu" />
        </button>
        <PortalPopover open={open} pos={pos} onClose={()=>setOpen(false)}>
          <div className="q-popover__group">
            <button className="q-popover__item" onClick={()=>{ setOpen(false); onEdit?.(c); }}>
              <img src="/edit.png" alt="" style={{width:18,height:18}} /><span>Edit</span>
            </button>
            <button className="q-popover__item q-popover__danger" onClick={()=>{ setOpen(false); onDelete?.(c); }}>
              <img src="/trash.png" alt="" style={{width:18,height:18}} /><span>Delete</span>
            </button>
          </div>
        </PortalPopover>
      </div>
      <div className="cat-card__desc">{c.description || <i>No description</i>}</div>
    </SpotlightCard>
  );
}

export default function AdminPage() {
  const { user } = useSelector((s)=>s.auth);
  const [tab, setTab] = useState("users");

  if (!user || user.role !== "admin") {
    return <div className="postpage__err" style={{margin:16}}>Admins only</div>;
  }

  return (
    <div className="adminpage" >
      <div className="adm-top">
        <div className="adm-tabs">
          <button className={`adm-tabbtn ${tab==="users"?"is-on":""}`} onClick={()=>setTab("users")}>Users</button>
          <button className={`adm-tabbtn ${tab==="posts"?"is-on":""}`} onClick={()=>setTab("posts")}>Posts</button>
          <button className={`adm-tabbtn ${tab==="categories"?"is-on":""}`} onClick={()=>setTab("categories")}>Categories</button>
        </div>
      </div>

      <div className="adm-content">
        {tab === "users" && <UsersTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "categories" && <CategoriesTab />}
      </div>
    </div>
  );
}
