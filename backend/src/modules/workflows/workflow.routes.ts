import { z } from "zod";
import { Workflow, WORKFLOW_TRIGGERS } from "./workflow.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ApiError } from "../../utils/ApiError.js";
import { runWorkflowsForSchool, runSingleWorkflow } from "./workflow.service.js";
import type { HydratedDocument } from "mongoose";
import type { WorkflowAttrs } from "./workflow.model.js";

const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  trigger: z.enum(WORKFLOW_TRIGGERS),
  enabled: z.boolean().default(true),
  threshold: z.coerce.number<number>().default(75),
});

export default createCrudRouter({
  model: Workflow,
  createSchema: workflowSchema,
  searchFields: ["name", "trigger"],
  filterFields: ["trigger"],
  // Mounted before the generic `/:id` routes so `/run-all` isn't swallowed by
  // the `GET /:id` handler. `extend` runs after `router.use(requireAuth)`.
  extend: (router) => {
    // Evaluate every enabled rule now (manual, non-deduped) and report back.
    router.post("/run-all", async (req, res, next) => {
      try {
        const summary = await runWorkflowsForSchool(req.user!.schoolId, { auto: false });
        res.json({ data: summary });
      } catch (err) {
        next(err);
      }
    });

    // Run a single rule immediately.
    router.post("/:id/run", async (req, res, next) => {
      try {
        const rule = await Workflow.findOne({
          _id: req.params.id,
          schoolId: req.user!.schoolId,
        });
        if (!rule) throw ApiError.notFound("Workflow not found.");
        const result = await runSingleWorkflow(rule as HydratedDocument<WorkflowAttrs>);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    });
  },
});
