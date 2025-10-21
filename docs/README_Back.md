# Usof backend (QAnswers)

### Platform for questions and answers in relation to any topics.

## Stack
- Node.js
- Express.js 
- MySQL 
- JWT
- bcrypt 
- multer 
- dotenv 
- nodemailer
- cors

## Installation & Start

1. Installation of dependencies
 ```bash
    npm install
 ```
2. Raise the database
 ```bash
    mysql -u root -p usof < schema.sql
 ```
3. Start
 ```bash
    npm start
 ```
4. Health check:
    
- GET `http://localhost:3000/health` → `{ ok: true }`

## ENDPOINTS

## Authentication module

`POST /api/auth/register`,
 ```
    curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"login":"...","email":"...","password":"...","password_confirmation":"...","full_name":"..."}'
 ```
 `POST /api/auth/email/request`,
  ```
   curl -X POST http://localhost:3000/api/auth/email/request -H "Content-Type: application/json" -d '{"email":"..."}'

 ```
`POST /api/auth/login`,
 ```
    curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"loginOrEmail":"...","password":"..."}'
 ```
`POST /api/auth/logout`,
 ```
   curl -X POST http://localhost:3000/api/auth/logout -H "Authorization: Bearer ..."
 ```
`POST /api/auth/password-reset`,
 ```
   curl -X POST http://localhost:3000/api/auth/password-reset -H "Content-Type: application/json" -d '{"email":"..."}'
 ```
`POST /api/auth/password-reset/:confirm_token`,
 ```
  curl -X POST http://localhost:3000/api/auth/password-reset/... -H "Content-Type: application/json" -d '{"new_password":"..."}'
 ```
- User module

`GET /api/users` (ADMIN),
 ```
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=ali"
 ```
`GET /api/users/:user_id` (ADMIN),
 ```
curl -X GET http://localhost:3000/api/users/1
 ```
`POST /api/users` (ADMIN),
 ```
curl -X POST http://localhost:3000/api/users -H "Authorization: Bearer ..." -H "Content-Type: application/json" -d '{"login":"...","password":"...","password_confirmation":"...","email":"...","full_name":"...","role":"user/admin"}'
 ```
`PATCH /api/users/:user_id`,
 ```
curl -X PATCH http://localhost:3000/api/users/9 -H "Authorization: Bearer ..." -H "Content-Type: application/json" -d '{"full_name":"..."}'
 ```
`PATCH /api/users/avatar`,
 ```
curl -X PATCH http://localhost:3000/api/users/avatar -H "Authorization: Bearer ..." -F "avatar=@/Users/.../Downloads/1.png"
 ```
`DELETE /api/users/:user_id`
```
curl -X DELETE http://localhost:3000/api/users/3 -H "Authorization: Bearer ..."
```
## Post module:

`GET /api/posts`,
```
curl -X GET "http://localhost:3000/api/posts?page=1&limit=10&status=active&sort=likes&order=desc"
```
`GET /api/posts/:post_id`,
```
curl -X GET http://localhost:3000/api/posts/1
```
`GET /api/posts/:post_id/comments`,
```
curl -X GET http://localhost:3000/api/posts/1/comments
```
`POST /api/posts/:post_id/comments`,
```
curl -X POST http://localhost:3000/api/posts/6/comments \
-H "Authorization: Bearer ..." \
-H "Content-Type: application/json" \
-d '{"content":"..."}'
```
`GET /api/posts/:post_id/categories`,
```
  curl -X GET http://localhost:3000/api/posts/1/categories
```
`GET /api/posts/:post_id/like`,
```
   curl -X GET http://localhost:3000/api/posts/1/like
```
`POST /api/posts`,
```
   curl -X POST http://localhost:3000/api/posts -H "Authorization: Bearer ..." -H "Content-Type: application/json" -d'{"title":"...","content":"...","categories":[1,4]}'
```
`POST /api/posts/:post_id/like`,
```
   curl -X POST http://localhost:3000/api/posts/14/like \
-H "Authorization: Bearer ..." \
-H "Content-Type: application/json" \
-d '{"type":"like"}'
```
`PATCH /api/posts/:post_id`,
```
   curl -X PATCH http://localhost:3000/api/posts/6\
-H "Authorization: Bearer ..." \
-H "Content-Type: application/json" \
-d '{"title":"...","categories":[1,5]}'
```
`DELETE /api/posts/:post_id`,
```
   curl -X DELETE http://localhost:3000/api/posts/2 \
-H "Authorization: Bearer..."
```
`DELETE /api/posts/:post_id/like`,
```
curl -X DELETE http://localhost:3000/api/posts/1/like \
-H "Authorization: Bearer ..."
```
`POST /api/posts` (Additional),
```
curl -X POST http://localhost:3000/api/posts \
-H "Authorization: Bearer ..." \
-F "title=..." \
-F "content=Some text" \
-F "categories=1" \
-F "categories=2" \
-F "images=@/Users/..../Downloads/1.png" \
-F "images=@/Users/.../Downloads/1.png"
```
## Categories module

`GET /api/categories`,
```
curl -X GET "http://localhost:3000/api/categories"
```

`GET /api/categories/:category_id`,
```
curl -X GET "http://localhost:3000/api/categories/1"
```

`GET /api/categories/:category_id/posts`,
```
curl -X GET "http://localhost:3000/api/categories/1/posts"
```

`POST /api/categories` (ADMIN),
```
curl -X POST "http://localhost:3000/api/categories" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"title":"...","description":"..."}'
```

`PATCH /api/categories/:category_id` (ADMIN), 
```
curl -X PATCH "http://localhost:3000/api/categories/8" \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"title":"...","description":"..."}'
```

`DELETE /api/categories/:category_id` (ADMIN)
```
curl -X DELETE "http://localhost:3000/api/categories/1" \
  -H "Authorization: Bearer ..."
```

## Comments module

`GET /api/comments/:comment_id`,
```
curl -X GET http://localhost:3000/api/comments/1
```

`GET /api/comments/:comment_id/like`,
```
curl -X GET http://localhost:3000/api/comments/1/like
```

`POST /api/comments/:comment_id/like`,
```
curl -X POST http://localhost:3000/api/comments/3/like \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"type":"like"}'
```

`PATCH /api/comments/:comment_id`,
```
curl -X PATCH http://localhost:3000/api/comments/4 \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

`DELETE /api/comments/:comment_id`,
```
curl -X DELETE http://localhost:3000/api/comments/5 \
  -H "Authorization: Bearer ..."
```

`DELETE /api/comments/:comment_id/like`
```
curl -X DELETE http://localhost:3000/api/comments/5/like \
  -H "Authorization: Bearer ..."
```
## Additional

Get a post by ID (inactive) Admin sees both his own and others.

`GET "/api/admin/posts/1"`
```
curl -X GET "http://localhost:3000/api/admin/posts/1" \
  -H "Authorization: Bearer ..."
```
Admin sees all posts including inactive ones.

`GET "/api/admin/posts`
```
curl -X GET "http://localhost:3000/api/admin/posts?page=1&limit=10" \
  -H "Authorization: Bearer ..."
```
An inactive comment under an active post is visible to the admin.

`GET "/api/admin/posts/5/comments?status=inactive"`
```
curl -X GET "http://localhost:3000/api/admin/posts/1/comments?status=inactive" \
  -H "Authorization: Bearer ..."
```
The user can see all of their posts, including inactive ones.

`GET "/api/me/posts?page=1&limit=10"`
```
curl -X GET "http://localhost:3000/api/me/posts?page=1&limit=10" \
  -H "Authorization: Bearer ..."
```
The user sees all of their comments under posts, even inactive comments.

`GET "/api/me/comments?page=1&limit=10"`
```
curl -X GET "http://localhost:3000/api/me/comments?page=1&limit=10" \
  -H "Authorization: Bearer ..."
```
