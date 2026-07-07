import { router } from "../index"
import { activityRouter } from "./activity"
import { alertRouter } from "./alert"
import { appsRouter } from "./apps"
import { autonomyRouter } from "./autonomy"
import { mentionRouter } from "./mention"
import { overviewRouter } from "./overview"
import { pipelineRouter } from "./pipeline"
import { signalRouter } from "./signal"
import { signalCommentRouter } from "./signal-comment"
import { waitlistRouter } from "./waitlist"
import { workspaceRouter } from "./workspace"

export const appRouter = router({
  waitlist: waitlistRouter,
  workspace: workspaceRouter,
  apps: appsRouter,
  signal: signalRouter,
  signalComment: signalCommentRouter,
  alert: alertRouter,
  pipeline: pipelineRouter,
  autonomy: autonomyRouter,
  activity: activityRouter,
  mention: mentionRouter,
  overview: overviewRouter,
})

export type AppRouter = typeof appRouter
