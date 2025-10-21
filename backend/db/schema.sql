-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  login         VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  profile_pic   VARCHAR(255),
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  rating        INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB;

-- POSTS 
CREATE TABLE IF NOT EXISTS posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  author_id    INT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  content      MEDIUMTEXT NOT NULL,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_posts_author
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- POST_CATEGORIES
CREATE TABLE IF NOT EXISTS post_categories (
  post_id     INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (post_id, category_id),
  CONSTRAINT fk_pc_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  post_id      INT NOT NULL,
  author_id    INT NOT NULL,
  content      MEDIUMTEXT NOT NULL,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
-- Self-referential foreign key for nested comments
ALTER TABLE comments
  ADD COLUMN parent_id INT NULL AFTER post_id,
  ADD CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX idx_comments_post_parent ON comments (post_id, parent_id);

-- POST_IMAGES 
CREATE TABLE IF NOT EXISTS post_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  filepath   VARCHAR(255) NOT NULL,
  alt_text   VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_post_images_post
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- LIKES 
CREATE TABLE IF NOT EXISTS likes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  author_id    INT NOT NULL,
  post_id      INT NULL,
  comment_id   INT NULL,
  type         ENUM('like','dislike') NOT NULL,
  CONSTRAINT fk_likes_author  FOREIGN KEY (author_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_post    FOREIGN KEY (post_id)    REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_like_post    (author_id, post_id),    
  UNIQUE KEY uniq_like_comment (author_id, comment_id), 
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL     AND comment_id IS NOT NULL)
  )
) ENGINE=InnoDB;

-- EMAIL_VERIFICATIONS
CREATE TABLE IF NOT EXISTS email_verifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(100) NOT NULL UNIQUE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PASSWORD_RESET_TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
