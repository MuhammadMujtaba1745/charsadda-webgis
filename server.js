const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.static('public'));

const pool = new Pool({
  user: 'mac',
  host: 'localhost',
  database: 'charsadda_gis',
  password: '',          // put your password here if you set one
  port: 5432
});

app.get('/api/facilities', async (req, res) => {
  try {
    const sql = `
      SELECT id, name, category, sport, description,
             ST_AsGeoJSON(geom)::json AS geometry
      FROM sports_facilities;`;
    const result = await pool.query(sql);

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(r => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: {
          id: r.id,
          name: r.name,
          category: r.category,
          sport: r.sport,
          description: r.description
        }
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));