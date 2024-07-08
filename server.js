const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); 
const port = 4000;
const dbPath = path.join(__dirname, 'database.db');
let db = null;

const initializeDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.run(`
      CREATE TABLE IF NOT EXISTS post (
        id TEXT PRIMARY KEY,
        name TEXT,
        image TEXT,
        category TEXT,
        caption TEXT,
        isLiked BOOLEAN
      )
    `);

    const rows = await db.get('SELECT COUNT(*) AS count FROM post');
    if (rows.count === 0) {
      await db.run(`
        INSERT INTO post (id, name, image, category, caption, isLiked) VALUES
        ('1c5ndhwinfdfs', 'Likhitha', 'https://i0.wp.com/picjumbo.com/wp-content/uploads/magical-spring-forest-scenery-during-morning-breeze-free-photo.jpg?w=600&quality=80', 'nature', 'looking beautiful', true),
        ('2jduangjek', 'Upender', 'https://media.istockphoto.com/id/1794808883/photo/smiling-multi-generation-family-petting-their-dog-on-a-sofa.webp?b=1&s=170667a&w=0&k=20&c=O8H_eMCF9npXRth8-6Ds9B5PKeJd5W3DRjAY8FT_DoE=', 'pets', 'Dogs are friends', false),
        ('5hdchtks', 'Sathish', 'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=600&quality=80', 'nature', 'love the nature', false),
        ('1c5ndhgs', 'Srujan', 'https://t4.ftcdn.net/jpg/01/70/84/43/240_F_170844396_QsRKu3cYBN3R8q66FTjnpn6QDqWEAoGR.jpg', 'pets', 'good companions', true)
      `);
    }
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    throw error; 
  }
};

initializeDatabase()
  .then(() => {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
    });
  })
  .catch(error => {
    console.error(`Error initializing database or starting server: ${error.message}`);
    process.exit(1); 
  });

app.get('/', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const posts = await db.all('SELECT * FROM post');
    res.json(posts);
  } catch (error) {
    console.error(`Error fetching posts: ${error.message}`);
    res.status(500).send(`Error fetching posts: ${error.message}`);
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const { id } = req.params;
    const post = await db.get('SELECT * FROM post WHERE id = ?', [id]);
    if (post) {
      res.json(post);
    } else {
      res.status(404).send('Post not found');
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.post('/add-post', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const { id, name, image, category, caption, isLiked } = req.body;
    await db.run(`
      INSERT INTO post (id, name, image, category, caption, isLiked)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name, image, category, caption, isLiked]);

    res.status(201).send('Post created');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.put('/edit-post/:id', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const { id } = req.params;
    const { name, image, category, caption, isLiked } = req.body;

    await db.run(`
      UPDATE post
      SET name = ?, image = ?, category = ?, caption = ?, isLiked = ?
      WHERE id = ?
    `, [name, image, category, caption, isLiked, id]);

    res.send('Post updated');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});


app.delete('/posts/:id', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const { id } = req.params;
    await db.run('DELETE FROM post WHERE id = ?', [id]);
    res.send('Post deleted');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});
