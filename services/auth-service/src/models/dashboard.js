import { pool } from "../db.js";

export async function createDashboard({ ownerId, layoutJson }) {
  const { rows } = await pool.query(
    `INSERT INTO dashboards (owner_id, layout_json)
     VALUES ($1, $2)
     RETURNING id, owner_id, layout_json, created_at`,
    [ownerId, layoutJson]
  );
  return rows[0];
}

export async function listDashboardsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT d.id, d.owner_id, d.layout_json, d.created_at
     FROM dashboards d
     LEFT JOIN dashboard_collaborators c ON c.dashboard_id = d.id
     WHERE d.owner_id = $1 OR c.user_id = $1
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function listAllDashboards() {
  const { rows } = await pool.query(
    `SELECT id, owner_id, layout_json, created_at FROM dashboards ORDER BY created_at DESC`
  );
  return rows;
}

export async function findDashboardById(id) {
  const { rows } = await pool.query(
    `SELECT id, owner_id, layout_json, created_at FROM dashboards WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateDashboardLayout(id, layoutJson) {
  const { rows } = await pool.query(
    `UPDATE dashboards SET layout_json = $2 WHERE id = $1
     RETURNING id, owner_id, layout_json, created_at`,
    [id, layoutJson]
  );
  return rows[0] ?? null;
}

export async function deleteDashboard(id) {
  const { rowCount } = await pool.query(`DELETE FROM dashboards WHERE id = $1`, [id]);
  return rowCount > 0;
}
