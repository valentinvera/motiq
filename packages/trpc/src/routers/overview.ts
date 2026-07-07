import { db } from "@motiq/db"
import { activityLog } from "@motiq/db/schema/activity-log"
import { agentAction } from "@motiq/db/schema/agent-actions"
import { alert } from "@motiq/db/schema/alerts"
import { app } from "@motiq/db/schema/apps"
import { customer } from "@motiq/db/schema/customers"
import { pipelineRun } from "@motiq/db/schema/pipeline-runs"
import { signal } from "@motiq/db/schema/signals"
import { and, count, desc, eq, gte, sql } from "drizzle-orm"
import { z } from "zod"
import { orgProcedure, router } from "../index"
import { ensureDefaultAutonomyRules } from "../lib/autonomy-defaults"

const daysSchema = z.union([
  z.literal(1),
  z.literal(7),
  z.literal(14),
  z.literal(30),
  z.literal(90),
])

export const overviewRouter = router({
  getOverview: orgProcedure
    .input(z.object({ days: daysSchema }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = ctx.organizationId
      await ensureDefaultAutonomyRules(orgId)
      const days = input?.days ?? 7
      const now = new Date()
      const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [
        totalSignals,
        recentSignals,
        signalsByType,
        signalsByPriority,
        unacknowledgedAlerts,
        activePipelines,
        completedPipelines,
        totalApps,
        pendingActions,
        recentActivity,
        latestSignals,
        latestAlerts,
        signalsPerDay,
        topRiskCustomer,
        lastAppSync,
      ] = await Promise.all([
        db
          .select({ count: count() })
          .from(signal)
          .where(eq(signal.organizationId, orgId)),
        db
          .select({ count: count() })
          .from(signal)
          .where(
            and(
              eq(signal.organizationId, orgId),
              gte(signal.createdAt, rangeStart)
            )
          ),
        db
          .select({ type: signal.type, count: count() })
          .from(signal)
          .where(eq(signal.organizationId, orgId))
          .groupBy(signal.type),
        db
          .select({ priority: signal.priority, count: count() })
          .from(signal)
          .where(eq(signal.organizationId, orgId))
          .groupBy(signal.priority),
        db
          .select({ count: count() })
          .from(alert)
          .where(
            and(eq(alert.organizationId, orgId), eq(alert.acknowledged, false))
          ),
        db
          .select({ count: count() })
          .from(pipelineRun)
          .where(
            and(
              eq(pipelineRun.organizationId, orgId),
              eq(pipelineRun.status, "running")
            )
          ),
        db
          .select({ count: count() })
          .from(pipelineRun)
          .where(
            and(
              eq(pipelineRun.organizationId, orgId),
              eq(pipelineRun.status, "completed"),
              gte(pipelineRun.createdAt, rangeStart)
            )
          ),
        db
          .select({ count: count() })
          .from(app)
          .where(and(eq(app.organizationId, orgId), eq(app.status, "active"))),
        db
          .select({ count: count() })
          .from(agentAction)
          .where(
            and(
              eq(agentAction.organizationId, orgId),
              eq(agentAction.status, "proposed")
            )
          ),
        db
          .select()
          .from(activityLog)
          .where(
            and(
              eq(activityLog.organizationId, orgId),
              gte(activityLog.createdAt, twentyFourHoursAgo)
            )
          )
          .orderBy(desc(activityLog.createdAt))
          .limit(8),
        db
          .select({
            id: signal.id,
            title: signal.title,
            type: signal.type,
            priority: signal.priority,
            status: signal.status,
            source: signal.source,
            customerName: signal.customerName,
            createdAt: signal.createdAt,
          })
          .from(signal)
          .where(eq(signal.organizationId, orgId))
          .orderBy(desc(signal.createdAt))
          .limit(5),
        db
          .select()
          .from(alert)
          .where(
            and(eq(alert.organizationId, orgId), eq(alert.acknowledged, false))
          )
          .orderBy(desc(alert.createdAt))
          .limit(5),
        db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${signal.createdAt}), 'YYYY-MM-DD')`,
            count: count(),
          })
          .from(signal)
          .where(
            and(
              eq(signal.organizationId, orgId),
              gte(signal.createdAt, rangeStart)
            )
          )
          .groupBy(sql`date_trunc('day', ${signal.createdAt})`)
          .orderBy(sql`date_trunc('day', ${signal.createdAt})`),
        db
          .select({
            id: customer.id,
            name: customer.name,
            company: customer.company,
            email: customer.email,
            tier: customer.tier,
            riskScore: customer.riskScore,
            signalCount: customer.signalCount,
          })
          .from(customer)
          .where(eq(customer.organizationId, orgId))
          .orderBy(desc(customer.riskScore))
          .limit(1),
        db
          .select({ lastSyncAt: app.lastSyncAt })
          .from(app)
          .where(and(eq(app.organizationId, orgId), eq(app.status, "active")))
          .orderBy(desc(app.lastSyncAt))
          .limit(1),
      ])

      const byType: Record<string, number> = {}
      for (const row of signalsByType) {
        byType[row.type ?? "unclassified"] = row.count
      }

      const byPriority: Record<string, number> = {}
      for (const row of signalsByPriority) {
        byPriority[row.priority ?? "unclassified"] = row.count
      }

      return {
        rangeDays: days,
        signals: {
          total: totalSignals[0]?.count ?? 0,
          inRange: recentSignals[0]?.count ?? 0,
          byType,
          byPriority,
        },
        alerts: {
          unacknowledged: unacknowledgedAlerts[0]?.count ?? 0,
          items: latestAlerts,
        },
        pipelines: {
          running: activePipelines[0]?.count ?? 0,
          completed: completedPipelines[0]?.count ?? 0,
        },
        apps: {
          active: totalApps[0]?.count ?? 0,
          lastSyncAt: lastAppSync[0]?.lastSyncAt ?? null,
        },
        autonomy: {
          pendingActions: pendingActions[0]?.count ?? 0,
        },
        recentActivity,
        latestSignals,
        signalsPerDay,
        topRiskCustomer: topRiskCustomer[0] ?? null,
      }
    }),
})
