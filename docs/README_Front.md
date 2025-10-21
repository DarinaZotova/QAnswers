# Usof frontend (QAnswers)

### Platform for questions and answers in relation to any topics.

> The backend (Node.js + Express + MySQL) is documented separately. The base API address is specified by the environment variable `VITE_API_ORIGIN`.

## Stack
- axios
- ogl
- react
- react-dom
- react-redux
- react-router-dom
- redux
- redux-thunk

## Key features
- Authentication: registration (email confirmation), login, password reset.
- Post feed + sorting/filters/posting + clickable login that leads to the user profile.
- Search for posts by title.
- View posts.
- Comments with nesting, blocking, and more.
- Category page + sorting by categories.
- Create a post + edit + delete (it's possible to upload a photo to the post).
- User profile + edit + log out.
- Ability to like both posts and comments under the post.
- Ability to make your comment inactive/active + edit, and you can also block a comment under your post. Deleting a comment.
- Admin panel: CRUD by users/categories/posts/comments/likes, status changes, etc.

## Installation & Start

1. Installation of dependencies
 ```bash
    npm i
 ```
2. Start
 ```bash
   npm run dev
 ```

# Tree
```text
  |index.html
  |node_modules
  |vite.config.js
  |README.md
  |public
    category.png
    dislike.png
    post.png
    comments.png
    upload_2.png
    home.png
    dots.png
    like.png
    search.png
    log_in.png
    lock-open.png
    logo.png
    upload.png
    lock-closed.png
    filter.png
    profile.png
    log.png
    edit.png
    star.png
    trash.png
    admin.png
    avatar_def.png
    modal.png
    Q.png
  |.gitignore
  |package-lock.json
  |package.json
  |eslint.config.js
  |src
    |app
      store.js
    |features
      posts
      auth
      categories
    |shared
      utils
      api
    |styles
      auth.css
      index.css
      ui.css
      Popovers.css
    |components
      PostsFilterPanel.jsx
      Header.jsx
      PrismaticBurst.jsx
      CreatePostModal.jsx
      ElectricBorder.css
      SpotlightCard.jsx
      EditProfileModal.jsx
      Modal.jsx
      AuthGuard.jsx
      Sidebar.jsx
      PostCard.css
      SpotlightCard.css
      ElectricBorder.jsx
      SplashScreen.jsx
      EditPostModal.jsx
      PostCard.jsx
      Pagination.jsx
      EditProfileModal.css
      PrismaticBurst.css
      EditCommentModal.jsx
      Header.css
      PostsFilterPanel.css
      SignInToPostModal.jsx
      CreatePostModal.css
    |layouts
      AuthLayout.jsx
      MainLayout.jsx
    |main.jsx
    |App.jsx
    |pages
      ProfilePage.css
      PostsFeed.css
      auth
      HomePage.jsx
      AdminPage.css
      CategoriesPage.css
      PostPage.jsx
      CategoriesPage.jsx
      AdminPage.jsx
      PostPage.css
      ProfilePage.jsx
```