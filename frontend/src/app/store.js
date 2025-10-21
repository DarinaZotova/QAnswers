// frontend/src/app/store.js
import { legacy_createStore as createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from '../features/auth/authReducer';
import { postsReducer } from "../features/posts/postsReducer";
import { categoriesReducer } from "../features/categories/categoriesReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  categories: categoriesReducer,
});

const composeEnhancers =
  (import.meta.env.DEV && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)));
