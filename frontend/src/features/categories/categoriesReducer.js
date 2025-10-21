// src/features/categories/categoriesReducer.js
import { CATS_LOADING, CATS_ERROR, CATS_SUCCESS } from "./categoriesActions";

const initial = {
  loading: false,
  error: null,
  items: [],
};

export const categoriesReducer = (state = initial, action) => {
  switch (action.type) {
    case CATS_LOADING:
      return { ...state, loading: action.payload };
    case CATS_ERROR:
      return { ...state, error: action.payload };
    case CATS_SUCCESS:
      return { ...state, items: action.payload };
    default:
      return state;
  }
};
