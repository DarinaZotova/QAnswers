// backend/db/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const conn = await mysql.createConnection({
    host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME
  });

  try {
    const password = 'P@ssw0rd!';
    const hash = await bcrypt.hash(password, 10);

    const users = [
      ['admin', 'admin@usof.local', hash, 'Admin User', 'admin'],
      ['alice', 'alice@usof.local', hash, 'Alice Johnson', 'user'],
      ['bob',   'bob@usof.local',   hash, 'Bob Robertson', 'user'],
      ['cara',  'cara@usof.local',  hash, 'Cara Milo',     'user'],
      ['dave',  'dave@usof.local',  hash, 'Dave Lee',      'user']
    ];

    const cats = [
  ['Books & Writing', 'Literature, storytelling, blogging, and sharing writing tips or favorite books.'],
  ['Gaming & Esports', 'Video games, esports events, gaming strategies, and recommendations.'],
  ['Music & Entertainment', 'Music creation, favorite tracks, movies, series, and everything related...'],
  ['Art & Creativity', 'Design, drawing, painting, photography, and creative projects.'],
  ['Health & Lifestyle', 'Fitness, nutrition, mental health, and practical life advice.'],
  ['Finance & Business', 'Personal finance, investments, startups, business growth, and...'],
  ['Travel & Culture', 'Tips for traveling, exploring new places, learning about cultures, and sharing experiences.'],
  ['Tech & Cybersecurity', 'Gadgets, new technologies, online safety, and discussions about digital privacy.'],
  ['Education & Career', 'Study tips, university life, career growth, interviews, and professional...'],
  ['Science & Math', 'Logic, mathematics, physics, engineering, and problem-solving across scientific...'],
  ['Web & Mobile Development', 'Frontend, backend, mobile apps, frameworks, and everything related...'],
  ['Programming & IT', 'Questions about coding, software development, debugging, and best...'],
  ['Celebrities & Influencers', 'Questions and discussions about famous people, influencers, public figures...']
];

    await conn.beginTransaction();
    await conn.query(
      'INSERT IGNORE INTO users (login, email, password_hash, full_name, role) VALUES ?',
      [users]
    );
    await conn.query(
      'INSERT IGNORE INTO categories (title, description) VALUES ?',
      [cats]
    );
    await conn.commit();

    console.log('Seed completed. Default password for all users:', password);
    console.log('   Admin login: admin /', password);
  } catch (e) {
    await conn.rollback();
    console.error('Seed failed:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
