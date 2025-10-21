// frontend/src/features/posts/postsReducer.js
import { POSTS_LOADING, POSTS_ERROR, POSTS_SUCCESS, POSTS_SETPARAMS, POSTS_CLEAR } from "./postsActions";

const initial = {
  loading: false,
  error: null,
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  params: { page: 1, limit: 10, sort: "likes", order: "desc", status: "active" },
};

export const postsReducer = (state = initial, action) => {
  switch (action.type) {
    case POSTS_LOADING:
      return { ...state, loading: action.payload };
    case POSTS_ERROR:
      return { ...state, error: action.payload };
    case POSTS_SETPARAMS:
      return { ...state, params: action.payload };
    case POSTS_SUCCESS:
      return {
        ...state,
        items: action.payload?.items || [],
        page: action.payload?.page ?? state.params.page ?? 1,
        limit: action.payload?.limit ?? state.params.limit ?? 10,
        total: action.payload?.total ?? 0,
      };
      case POSTS_CLEAR:
    return { ...initial, params: state.params };
    default:
      return state;
  }
};
