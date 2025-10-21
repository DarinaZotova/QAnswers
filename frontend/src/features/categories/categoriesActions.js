// src/features/categories/categoriesActions.js
import { api } from "../../shared/api/axios";
import { ENDPOINTS } from "../../shared/api/endpoints";

export const CATS_LOADING = "CATS_LOADING";
export const CATS_ERROR   = "CATS_ERROR";
export const CATS_SUCCESS = "CATS_SUCCESS";

const setLoading = (v) => ({ type: CATS_LOADING, payload: v });
const setError   = (e) => ({ type: CATS_ERROR, payload: e });
const setCats    = (data) => ({ type: CATS_SUCCESS, payload: data });

export const fetchCategories = () => async (dispatch) => {
  dispatch(setLoading(true)); dispatch(setError(null));
  try {
    const { data } = await api.get(ENDPOINTS.categories);
    dispatch(setCats(data || []));
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to load categories";
    dispatch(setError(msg));
  } finally {
    dispatch(setLoading(false));
  }
};
