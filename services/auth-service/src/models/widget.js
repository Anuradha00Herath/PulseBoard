import { pool } from "../db.js";

export async function createWidget({ dashboardId, type, metricQuery, position }) {
  const { rows } = await pool.query(
    `INSERT INTO widgets (dashboard_id, type, metric_query, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id, dashboard_id, type, metric_query, position`,
    [dashboardId, type, metricQuery, position]
  );
  return rows[0];
}

export async function listWidgetsByDashboard(dashboardId) {
  const { rows } = await pool.query(
    `SELECT id, dashboard_id, type, metric_query, position
     FROM widgets WHERE dashboard_id = $1 ORDER BY id`,
    [dashboardId]
  );
  return rows;
}

export async function findWidgetById(id) {
  const { rows } = await pool.query(
    `SELECT id, dashboard_id, type, metric_query, position FROM widgets WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateWidget(id, { type, metricQuery, position }) {
  const { rows } = await pool.query(
    `UPDATE widgets SET type = $2, metric_query = $3, position = $4
     WHERE id = $1
     RETURNING id, dashboard_id, type, metric_query, position`,
    [id, type, metricQuery, position]
  );
  return rows[0] ?? null;
}

export async function deleteWidget(id) {
  const { rowCount } = await pool.query(`DELETE FROM widgets WHERE id = $1`, [id]);
  return rowCount > 0;
}
