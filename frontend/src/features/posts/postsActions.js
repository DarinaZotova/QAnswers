// frontend/src/features/posts/postsActions.js
import { api } from "../../shared/api/axios";

export const POSTS_LOADING   = "POSTS_LOADING";
export const POSTS_ERROR     = "POSTS_ERROR";
export const POSTS_SUCCESS   = "POSTS_SUCCESS";
export const POSTS_SETPARAMS = "POSTS_SETPARAMS";
export const POSTS_CLEAR     = "POSTS_CLEAR";

const setLoading = (v) => ({ type: POSTS_LOADING, payload: v });
const setError   = (e) => ({ type: POSTS_ERROR, payload: e });
const setPosts   = (data) => ({ type: POSTS_SUCCESS, payload: data });
export const setParams = (params) => ({ type: POSTS_SETPARAMS, payload: params });
export const clearPosts = () => ({ type: POSTS_CLEAR });

export const fetchPosts = (params = {}) => async (dispatch, getState) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const state = getState();
    const user  = state?.auth?.user;

    let merged = {
      page: 1,
      limit: 10,
      sort: "date",
      order: "desc",
      status: "active",
      ...state?.posts?.params,
      ...params,
    };

    if (!user && merged.status === "inactive") {
      merged = { ...merged, status: "active" };
    }

    const q = new URLSearchParams();
    q.set("page",   merged.page);
    q.set("limit",  merged.limit);
    q.set("sort",   merged.sort);
    q.set("order",  merged.order);
    if (Array.isArray(merged.category) && merged.category.length) {
  q.set("category", merged.category.join(",")); 
} else if (typeof merged.category === "string" && merged.category.trim()) {
  q.set("category", merged.category.trim());
}
    if (merged.from)     q.set("from", merged.from);
    if (merged.to)       q.set("to", merged.to);
    if (merged.q && merged.q.trim()) q.set("q", merged.q.trim()); 

    let url = "";

    const role = (user?.role || "").toLowerCase();
     if (role === "admin") {
      q.set("status", merged.status); 
      url = `/admin/posts?${q.toString()}`;

    } else if (user) {
      if (merged.status === "inactive") {

        q.set("status", "inactive");
        url = `/me/posts?${q.toString()}`;
      } else {

        q.set("status", "active");
        url = `/posts?${q.toString()}`;
      }
    } else {

      q.set("status", "active");
      url = `/posts?${q.toString()}`;
    }

    const { data } = await api.get(url);

    dispatch(setPosts(data));
    dispatch(setParams(merged));
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to load posts";
    dispatch(setError(msg));
  } finally {
    dispatch(setLoading(false));
  }
};
