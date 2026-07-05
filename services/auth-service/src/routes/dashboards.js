import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { findUserByEmail } from "../models/user.js";
import {
  createDashboard,
  listDashboardsForUser,
  listAllDashboards,
  findDashboardById,
  updateDashboardLayout,
  deleteDashboard,
} from "../models/dashboard.js";
import {
  createWidget,
  listWidgetsByDashboard,
  findWidgetById,
  updateWidget,
  deleteWidget,
} from "../models/widget.js";
import {
  upsertCollaborator,
  listCollaborators,
  findCollaborator,
  removeCollaborator,
} from "../models/collaborator.js";

export const WIDGET_TYPES = ["line_chart", "counter", "bar_chart", "table"];
export const COLLABORATOR_ROLES = ["viewer", "editor"];

// Access levels, from least to most privileged. "admin" is the global
// users.role value (system-level admin, manages all dashboards); "owner" and
// "editor"/"viewer" are per-dashboard, sourced from dashboards.owner_id and
// dashboard_collaborators respectively.
const ACCESS_RANK = { viewer: 1, editor: 2, owner: 3, admin: 3 };

export function meetsAccessLevel(access, minAccess) {
  return Boolean(access) && ACCESS_RANK[access] >= ACCESS_RANK[minAccess];
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDashboardInput({ layout_json } = {}) {
  const errors = [];
  if (layout_json !== undefined && !isPlainObject(layout_json)) {
    errors.push("layout_json must be an object.");
  }
  return { errors, layoutJson: layout_json ?? {} };
}

export function validateWidgetInput({ type, metric_query, position } = {}) {
  const errors = [];
  if (!WIDGET_TYPES.includes(type)) {
    errors.push(`type must be one of: ${WIDGET_TYPES.join(", ")}.`);
  }
  if (typeof metric_query !== "string" || metric_query.trim().length === 0) {
    errors.push("metric_query is required.");
  }
  if (position !== undefined && !isPlainObject(position)) {
    errors.push("position must be an object.");
  }
  return { errors, position: position ?? {} };
}

export function validateCollaboratorInput({ email, role } = {}) {
  const errors = [];
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : email;
  if (!normalizedEmail) {
    errors.push("email is required.");
  }
  if (!COLLABORATOR_ROLES.includes(role)) {
    errors.push(`role must be one of: ${COLLABORATOR_ROLES.join(", ")}.`);
  }
  return { errors, email: normalizedEmail };
}

function toPublicDashboard(dashboard, access) {
  return {
    id: dashboard.id,
    ownerId: dashboard.owner_id,
    layoutJson: dashboard.layout_json,
    createdAt: dashboard.created_at,
    ...(access ? { access } : {}),
  };
}

function toPublicWidget(widget) {
  return {
    id: widget.id,
    dashboardId: widget.dashboard_id,
    type: widget.type,
    metricQuery: widget.metric_query,
    position: widget.position,
  };
}

function toPublicCollaborator(collaborator) {
  return { userId: collaborator.user_id, email: collaborator.email, role: collaborator.role };
}

export const dashboardsRouter = Router();

dashboardsRouter.use(requireAuth);

async function getDashboardAccess(dashboard, user) {
  if (user.role === "admin") return "admin";
  if (dashboard.owner_id === user.sub) return "owner";
  const collaborator = await findCollaborator(dashboard.id, user.sub);
  return collaborator?.role ?? null;
}

// Dashboards/widgets the requester has no access to are reported as 404
// rather than 403, so their existence can't be enumerated. Once a requester
// is known to have *some* access, insufficient privilege (e.g. a viewer
// trying to edit) is reported as 403 since that leaks nothing new.
async function loadAccessibleDashboard(req, res, { minAccess = "viewer" } = {}) {
  const dashboard = await findDashboardById(req.params.id);
  if (!dashboard) {
    res.status(404).json({ errors: ["Dashboard not found."] });
    return null;
  }

  const access = await getDashboardAccess(dashboard, req.user);
  if (!access) {
    res.status(404).json({ errors: ["Dashboard not found."] });
    return null;
  }
  if (!meetsAccessLevel(access, minAccess)) {
    res.status(403).json({ errors: ["You do not have permission to perform this action."] });
    return null;
  }

  return { dashboard, access };
}

async function loadAccessibleWidget(req, res, { minAccess = "viewer" } = {}) {
  const widget = await findWidgetById(req.params.id);
  if (!widget) {
    res.status(404).json({ errors: ["Widget not found."] });
    return null;
  }

  const dashboard = await findDashboardById(widget.dashboard_id);
  const access = dashboard ? await getDashboardAccess(dashboard, req.user) : null;
  if (!access) {
    res.status(404).json({ errors: ["Widget not found."] });
    return null;
  }
  if (!meetsAccessLevel(access, minAccess)) {
    res.status(403).json({ errors: ["You do not have permission to perform this action."] });
    return null;
  }

  return { widget, dashboard, access };
}

dashboardsRouter.post("/dashboards", async (req, res, next) => {
  try {
    const { errors, layoutJson } = validateDashboardInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const dashboard = await createDashboard({ ownerId: req.user.sub, layoutJson });
    res.status(201).json({ dashboard: toPublicDashboard(dashboard, "owner") });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.get("/dashboards", async (req, res, next) => {
  try {
    const dashboards =
      req.user.role === "admin"
        ? await listAllDashboards()
        : await listDashboardsForUser(req.user.sub);
    res.json({ dashboards: dashboards.map((d) => toPublicDashboard(d)) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.get("/dashboards/:id", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res);
    if (!loaded) return;

    res.json({ dashboard: toPublicDashboard(loaded.dashboard, loaded.access) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.put("/dashboards/:id", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "editor" });
    if (!loaded) return;

    const { errors, layoutJson } = validateDashboardInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await updateDashboardLayout(loaded.dashboard.id, layoutJson);
    res.json({ dashboard: toPublicDashboard(updated, loaded.access) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.delete("/dashboards/:id", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "owner" });
    if (!loaded) return;

    await deleteDashboard(loaded.dashboard.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.post("/dashboards/:id/widgets", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "editor" });
    if (!loaded) return;

    const { errors, position } = validateWidgetInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const widget = await createWidget({
      dashboardId: loaded.dashboard.id,
      type: req.body.type,
      metricQuery: req.body.metric_query,
      position,
    });
    res.status(201).json({ widget: toPublicWidget(widget) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.get("/dashboards/:id/widgets", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res);
    if (!loaded) return;

    const widgets = await listWidgetsByDashboard(loaded.dashboard.id);
    res.json({ widgets: widgets.map(toPublicWidget) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.put("/widgets/:id", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleWidget(req, res, { minAccess: "editor" });
    if (!loaded) return;

    const { errors, position } = validateWidgetInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await updateWidget(loaded.widget.id, {
      type: req.body.type,
      metricQuery: req.body.metric_query,
      position,
    });
    res.json({ widget: toPublicWidget(updated) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.delete("/widgets/:id", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleWidget(req, res, { minAccess: "editor" });
    if (!loaded) return;

    await deleteWidget(loaded.widget.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.get("/dashboards/:id/collaborators", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res);
    if (!loaded) return;

    const collaborators = await listCollaborators(loaded.dashboard.id);
    res.json({ collaborators: collaborators.map(toPublicCollaborator) });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.post("/dashboards/:id/collaborators", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "owner" });
    if (!loaded) return;

    const { errors, email } = validateCollaboratorInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const collaboratorUser = await findUserByEmail(email);
    if (!collaboratorUser) {
      return res.status(404).json({ errors: ["No user found with that email."] });
    }
    if (collaboratorUser.id === loaded.dashboard.owner_id) {
      return res.status(400).json({ errors: ["The dashboard owner cannot be added as a collaborator."] });
    }

    const collaborator = await upsertCollaborator({
      dashboardId: loaded.dashboard.id,
      userId: collaboratorUser.id,
      role: req.body.role,
    });
    res.status(201).json({
      collaborator: toPublicCollaborator({ ...collaborator, email: collaboratorUser.email }),
    });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.put("/dashboards/:id/collaborators/:userId", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "owner" });
    if (!loaded) return;

    const role = req.body?.role;
    if (!COLLABORATOR_ROLES.includes(role)) {
      return res.status(400).json({ errors: [`role must be one of: ${COLLABORATOR_ROLES.join(", ")}.`] });
    }

    const existing = await findCollaborator(loaded.dashboard.id, req.params.userId);
    if (!existing) {
      return res.status(404).json({ errors: ["Collaborator not found."] });
    }

    const updated = await upsertCollaborator({
      dashboardId: loaded.dashboard.id,
      userId: req.params.userId,
      role,
    });
    res.json({ collaborator: { userId: updated.user_id, role: updated.role } });
  } catch (err) {
    next(err);
  }
});

dashboardsRouter.delete("/dashboards/:id/collaborators/:userId", async (req, res, next) => {
  try {
    const loaded = await loadAccessibleDashboard(req, res, { minAccess: "owner" });
    if (!loaded) return;

    const removed = await removeCollaborator(loaded.dashboard.id, req.params.userId);
    if (!removed) {
      return res.status(404).json({ errors: ["Collaborator not found."] });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
