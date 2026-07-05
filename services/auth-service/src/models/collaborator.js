import { pool } from "../db.js";

export async function upsertCollaborator({ dashboardId, userId, role }) {
  const { rows } = await pool.query(
    `INSERT INTO dashboard_collaborators (dashboard_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (dashboard_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING dashboard_id, user_id, role`,
    [dashboardId, userId, role]
  );
  return rows[0];
}

export async function listCollaborators(dashboardId) {
  const { rows } = await pool.query(
    `SELECT c.dashboard_id, c.user_id, c.role, u.email
     FROM dashboard_collaborators c
     JOIN users u ON u.id = c.user_id
     WHERE c.dashboard_id = $1
     ORDER BY u.email`,
    [dashboardId]
  );
  return rows;
}

export async function findCollaborator(dashboardId, userId) {
  const { rows } = await pool.query(
    `SELECT dashboard_id, user_id, role FROM dashboard_collaborators
     WHERE dashboard_id = $1 AND user_id = $2`,
    [dashboardId, userId]
  );
  return rows[0] ?? null;
}

export async function removeCollaborator(dashboardId, userId) {
  const { rowCount } = await pool.query(
    `DELETE FROM dashboard_collaborators WHERE dashboard_id = $1 AND user_id = $2`,
    [dashboardId, userId]
  );
  return rowCount > 0;
}
