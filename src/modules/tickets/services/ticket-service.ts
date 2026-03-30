import {
  TicketDocument,
  HelpdeskStageDocument,
  UserDocument,
  TaskDocument,
} from "@mongodb-types";
import {
  BaseService,
  InnerFile,
  isValidFileUpload,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { ticketModel } from "../models/ticket.model";
import mongoose from "mongoose";
import { TicketDTO, UpdateTicketDTO } from "../models/ticket.dto";
import { HelpdeskStageService } from "../../helpdesk-stages/services/helpdesk-stage-service";
import { TicketRuleService } from "./ticket-rule-service";
import dayjs from "dayjs";

type Priority = "low" | "medium" | "high" | "urgent";

type NotificationEventType =
  | "ticket_created"
  | "stage_changed"
  | "priority_changed"
  | "assigned_changed"
  | "resolved"
  | "closed"
  | "reopened"
  | "follower_added"
  | "follower_removed";

interface ActivityEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: mongoose.Types.ObjectId | undefined;
}

interface NotificationEntry {
  recipientId: mongoose.Types.ObjectId;
  eventType: NotificationEventType;
  message: string;
  readBy: mongoose.Types.ObjectId[];
  isRead: boolean;
}

const HIGH_URGENCY_KEYWORDS = [
  "critical", "urgent", "crash", "down", "broken", "blocker", "emergency",
];
const HIGH_KEYWORDS = [
  "error", "fail", "bug", "issue", "not working", "problem",
];

function inferPriorityFromKeywords(name: string, description?: string): Priority {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  if (HIGH_URGENCY_KEYWORDS.some((kw) => text.includes(kw))) return "urgent";
  if (HIGH_KEYWORDS.some((kw) => text.includes(kw))) return "high";
  return "medium";
}

function calculateSlaDates(priority?: string): {
  slaResponseDeadline: Date;
  slaResolutionDeadline: Date;
} {
  const responseDays = priority === "urgent" ? 0.125 : priority === "high" ? 0.5 : 1;
  const resolutionDays =
    priority === "urgent" ? 1 : priority === "high" ? 2 : 3;
  return {
    slaResponseDeadline: dayjs().add(responseDays, "day").toDate(),
    slaResolutionDeadline: dayjs().add(resolutionDays, "day").toDate(),
  };
}

function toObjectId(value: unknown): mongoose.Types.ObjectId | null {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value as string);
  }
  return null;
}

function buildNotifications(
  followerIds: mongoose.Types.ObjectId[],
  eventType: NotificationEventType,
  message: string,
): NotificationEntry[] {
  return followerIds.map((recipientId) => ({
    recipientId,
    eventType,
    message,
    readBy: [],
    isRead: false,
  }));
}

function getDocumentIdString(value: unknown): string {
  if (!value) return "";
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as mongoose.Document)._id;
    return id instanceof mongoose.Types.ObjectId ? id.toString() : String(id ?? "");
  }
  return String(value);
}

function arrayIdsToStrings(arr: unknown[]): string[] {
  return arr.map(getDocumentIdString);
}

export class TicketService extends BaseService<TicketDocument> {
  private helpdeskStageService = new HelpdeskStageService();
  private ticketRuleService = new TicketRuleService();

  constructor() {
    super({
      model: ticketModel,
      refFields: [
        {
          path: "stage",
          getModel: () =>
            this.connectionManager.getModel<HelpdeskStageDocument>("HelpdeskStage"),
          isArray: false,
        },
        {
          path: "assigned",
          getModel: () =>
            this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "senderUser",
          getModel: () =>
            this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "followers",
          getModel: () =>
            this.connectionManager.getModel<UserDocument>("User"),
          isArray: true,
        },
        {
          path: "taskIds",
          getModel: () =>
            this.connectionManager.getModel<TaskDocument>("Task"),
          isArray: true,
        },
        {
          path: "createdBy",
          getModel: () =>
            this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () =>
            this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: TicketDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<TicketDocument> {
    return await runTransaction<TicketDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      if (isValidFileUpload(data.attachments) && Array.isArray(data.attachments)) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await bucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          })),
        );
      }

      if (!data.stage) {
        const stages = await this.helpdeskStageService.get(
          { isDefault: true },
          undefined,
          undefined,
          undefined,
          newSession,
        );

        if (!stages || stages.length === 0)
          throw new ValidationException(
            "No default helpdesk stage found, please create one",
          );

        data.stage = stages[0]._id.toString();
      }

      const ruleResults = await this.ticketRuleService.evaluateRules(
        data as unknown as Record<string, unknown>,
      );

      if (!data.assigned) {
        if (ruleResults.assigned) {
          data.assigned = ruleResults.assigned;
        } else {
          const defaultAssigned = process.env.HELPDESK_DEFAULT_ASSIGNED_USER_ID;
          if (defaultAssigned) {
            data.assigned = defaultAssigned;
          }
        }
      }

      if (!data.priority) {
        data.priority = (ruleResults.priority as Priority | undefined)
          ?? inferPriorityFromKeywords(data.name, data.description);
      }

      const slaDates = calculateSlaDates(data.priority);
      if (!data.slaResponseDeadline) {
        data.slaResponseDeadline = slaDates.slaResponseDeadline;
      }
      if (!data.slaResolutionDeadline) {
        data.slaResolutionDeadline = slaDates.slaResolutionDeadline;
      }

      const ticket = await super.create({
        ...data,
        createdBy: userStorage.getStore()?.user?._id,
      }, newSession);

      const followerIds: mongoose.Types.ObjectId[] = (data.followers ?? [])
        .map(toObjectId)
        .filter((id): id is mongoose.Types.ObjectId => id !== null);

      if (followerIds.length > 0) {
        const notifications = buildNotifications(
          followerIds,
          "ticket_created",
          `Ticket "${data.name}" has been created`,
        );
        const model = this.connectionManager.bindModelToDb(this.model);
        await model.findByIdAndUpdate(
          ticket._id,
          { $push: { notifications: { $each: notifications } } },
          { session: newSession },
        );
      }

      return ticket;
    });
  }

  override async update(
    data: UpdateTicketDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<TicketDocument> {
    return await runTransaction<TicketDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      if (isValidFileUpload(data.attachments) && Array.isArray(data.attachments)) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await bucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          })),
        );
      }

      const existing = await this.getById(data._id, undefined);
      const changedBy = userStorage.getStore()?.user?._id as
        | mongoose.Types.ObjectId
        | undefined;

      const activityEntries: ActivityEntry[] = [];
      const notificationsToAdd: NotificationEntry[] = [];

      const existingFollowerIds: mongoose.Types.ObjectId[] = (
        (existing?.followers as unknown as (mongoose.Types.ObjectId | UserDocument)[]) ?? []
      ).map((item): mongoose.Types.ObjectId =>
        item instanceof mongoose.Types.ObjectId
          ? item
          : new mongoose.Types.ObjectId((item as UserDocument)._id.toString()),
      );

      const scalarFields: Array<keyof UpdateTicketDTO> = [
        "name",
        "description",
        "internalNotes",
        "priority",
        "type",
        "stage",
        "assigned",
        "senderUser",
        "category",
        "appModule",
        "active",
        "slaResponseDeadline",
        "slaResolutionDeadline",
      ];

      for (const field of scalarFields) {
        if (data[field] === undefined) continue;
        const rawOld = existing?.[field as keyof TicketDocument];
        const oldVal = getDocumentIdString(rawOld) || String(rawOld ?? "");
        const newVal = String(data[field] ?? "");
        if (oldVal !== newVal) {
          activityEntries.push({ field, oldValue: oldVal, newValue: newVal, changedBy });
        }
      }

      const existingFollowers = existingFollowerIds.map((id) => id.toString());
      const incomingFollowers: string[] = (data.followers ?? []).map(String);

      if (data.followers !== undefined) {
        const addedIds = incomingFollowers
          .filter((f) => !existingFollowers.includes(f))
          .map(toObjectId)
          .filter((id): id is mongoose.Types.ObjectId => id !== null);

        const removedIds = existingFollowers
          .filter((f) => !incomingFollowers.includes(f))
          .map(toObjectId)
          .filter((id): id is mongoose.Types.ObjectId => id !== null);

        if (addedIds.length > 0 || removedIds.length > 0) {
          activityEntries.push({
            field: "followers",
            oldValue: existingFollowers,
            newValue: incomingFollowers,
            changedBy,
          });

          notificationsToAdd.push(
            ...buildNotifications(addedIds, "follower_added", "You have been added as a follower"),
            ...buildNotifications(removedIds, "follower_removed", "You have been removed as a follower"),
          );
        }
      }

      if (data.tags !== undefined) {
        const existingTags: string[] = (existing?.tags as unknown as string[]) ?? [];
        if (
          JSON.stringify([...existingTags].sort()) !==
          JSON.stringify([...(data.tags ?? [])].sort())
        ) {
          activityEntries.push({
            field: "tags",
            oldValue: existingTags,
            newValue: data.tags,
            changedBy,
          });
        }
      }

      if (data.taskIds !== undefined) {
        const existingTaskIds = arrayIdsToStrings(
          (existing?.taskIds as unknown as unknown[]) ?? [],
        );
        const incomingTaskIds = data.taskIds.map(String);
        if (
          JSON.stringify([...existingTaskIds].sort()) !==
          JSON.stringify([...incomingTaskIds].sort())
        ) {
          activityEntries.push({
            field: "taskIds",
            oldValue: existingTaskIds,
            newValue: incomingTaskIds,
            changedBy,
          });
        }
      }

      if (data.attachments !== undefined && Array.isArray(data.attachments)) {
        const existingAttachments = (
          (existing?.attachments as unknown as { fileId: mongoose.Types.ObjectId }[]) ?? []
        ).map((a) => a.fileId?.toString() ?? "");
        const incomingAttachments = (
          data.attachments as unknown as { fileId?: mongoose.Types.ObjectId }[]
        ).map((a) => a.fileId?.toString() ?? "");
        if (
          JSON.stringify([...existingAttachments].sort()) !==
          JSON.stringify([...incomingAttachments].sort())
        ) {
          activityEntries.push({
            field: "attachments",
            oldValue: existingAttachments,
            newValue: incomingAttachments,
            changedBy,
          });
        }
      }

      const model = this.connectionManager.bindModelToDb(this.model);
      const sideEffects: Record<string, unknown> = {};

      if (data.stage !== undefined && data.stage !== getDocumentIdString(existing?.stage)) {
        const stages = await this.helpdeskStageService.get(
          { _id: data.stage },
          undefined,
          undefined,
          undefined,
          newSession,
        );
        const stageName = stages?.[0]?.name?.toLowerCase() ?? "";

        let stageEventType: NotificationEventType = "stage_changed";
        if (stageName.includes("resolved")) {
          stageEventType = "resolved";
          if (!existing?.resolvedAt) sideEffects["resolvedAt"] = new Date();
        } else if (stageName.includes("closed")) {
          stageEventType = "closed";
          if (!existing?.resolvedAt) sideEffects["resolvedAt"] = new Date();
          if (!existing?.closedAt) sideEffects["closedAt"] = new Date();
        } else if (stageName.includes("reopened")) {
          stageEventType = "reopened";
          sideEffects["resolvedAt"] = null;
          sideEffects["closedAt"] = null;
        }

        notificationsToAdd.push(
          ...buildNotifications(
            existingFollowerIds,
            stageEventType,
            `Ticket stage changed to "${stages?.[0]?.name ?? data.stage}"`,
          ),
        );

        const recalcPriority = data.priority ?? (existing?.priority as string | undefined);
        const recalcSlaDates = calculateSlaDates(recalcPriority);
        if (data.slaResponseDeadline === undefined) {
          sideEffects["slaResponseDeadline"] = recalcSlaDates.slaResponseDeadline;
        }
        if (data.slaResolutionDeadline === undefined) {
          const isClosed =
            stageName.includes("closed") || stageName.includes("resolved");
          sideEffects["slaResolutionDeadline"] = isClosed
            ? new Date()
            : recalcSlaDates.slaResolutionDeadline;
        }
      }

      if (
        data.priority !== undefined &&
        data.priority !== (existing?.priority as string | undefined)
      ) {
        notificationsToAdd.push(
          ...buildNotifications(
            existingFollowerIds,
            "priority_changed",
            `Ticket priority changed to "${data.priority}"`,
          ),
        );

        if (data.slaResponseDeadline === undefined && data.stage === undefined) {
          const newSla = calculateSlaDates(data.priority);
          sideEffects["slaResponseDeadline"] = newSla.slaResponseDeadline;
          sideEffects["slaResolutionDeadline"] = newSla.slaResolutionDeadline;
        }
      }

      if (
        data.assigned !== undefined &&
        data.assigned !== getDocumentIdString(existing?.assigned)
      ) {
        notificationsToAdd.push(
          ...buildNotifications(
            existingFollowerIds,
            "assigned_changed",
            "Ticket assigned user has changed",
          ),
        );
        const newAssignedId = toObjectId(data.assigned);
        if (newAssignedId) {
          notificationsToAdd.push({
            recipientId: newAssignedId,
            eventType: "assigned_changed",
            message: "A ticket has been assigned to you",
            readBy: [],
            isRead: false,
          });
        }
      }

      const hasSideEffects =
        activityEntries.length > 0 ||
        notificationsToAdd.length > 0 ||
        Object.keys(sideEffects).length > 0;

      if (hasSideEffects) {
        const pushOps: Record<string, unknown> = {};
        if (activityEntries.length > 0) {
          pushOps["activityHistory"] = { $each: activityEntries };
        }
        if (notificationsToAdd.length > 0) {
          pushOps["notifications"] = { $each: notificationsToAdd };
        }
        await model.findByIdAndUpdate(
          data._id,
          {
            ...(Object.keys(sideEffects).length > 0 ? { $set: sideEffects } : {}),
            ...(Object.keys(pushOps).length > 0 ? { $push: pushOps } : {}),
          },
          { session: newSession },
        );
      }

      return await super.update({
        ...data,
        updatedBy: changedBy,
      }, newSession);
    });
  }

  async generateReport(): Promise<{
    byStage: { stage: string; count: number }[];
    resolutionTimeSpan: {
      avgMinutes: number | null;
      minMinutes: number | null;
      maxMinutes: number | null;
      buckets: { label: string; count: number }[];
    };
    byAssigned: {
      assigned: string;
      count: number;
      avgResolutionMinutes: number | null;
    }[];
  }> {
    const model = this.connectionManager.bindModelToDb(this.model);

    const byStageRaw = await model.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]) as { _id: mongoose.Types.ObjectId | null; count: number }[];

    const byStage = byStageRaw.map((r) => ({
      stage: r._id?.toString() ?? "unassigned",
      count: r.count,
    }));

    const resolutionRaw = await model.aggregate([
      {
        $match: {
          active: true,
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          resolutionMs: { $subtract: ["$resolvedAt", "$createdAt"] },
          assigned: 1,
        },
      },
    ]) as { resolutionMs: number; assigned: mongoose.Types.ObjectId | null }[];

    const resolutionMinutes = resolutionRaw.map((r) =>
      Math.round(r.resolutionMs / 1000 / 60),
    );

    const avgResolutionMinutes =
      resolutionMinutes.length > 0
        ? Math.round(
            resolutionMinutes.reduce((s, t) => s + t, 0) / resolutionMinutes.length,
          )
        : null;
    const minResolutionMinutes =
      resolutionMinutes.length > 0 ? Math.min(...resolutionMinutes) : null;
    const maxResolutionMinutes =
      resolutionMinutes.length > 0 ? Math.max(...resolutionMinutes) : null;

    const buckets = [
      { label: "< 1h", min: 0, max: 60, count: 0 },
      { label: "1h – 4h", min: 60, max: 240, count: 0 },
      { label: "4h – 24h", min: 240, max: 1440, count: 0 },
      { label: "1d – 3d", min: 1440, max: 4320, count: 0 },
      { label: "> 3d", min: 4320, max: Infinity, count: 0 },
    ];

    for (const minutes of resolutionMinutes) {
      for (const bucket of buckets) {
        if (minutes >= bucket.min && minutes < bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    const byAssignedRaw = await model.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: "$assigned",
          count: { $sum: 1 },
          resolvedTimes: {
            $push: {
              $cond: [
                { $ifNull: ["$resolvedAt", false] },
                { $subtract: ["$resolvedAt", "$createdAt"] },
                null,
              ],
            },
          },
        },
      },
    ]) as {
      _id: mongoose.Types.ObjectId | null;
      count: number;
      resolvedTimes: (number | null)[];
    }[];

    const byAssigned = byAssignedRaw.map((r) => {
      const times = r.resolvedTimes.filter((t): t is number => t !== null);
      const avg =
        times.length > 0
          ? Math.round(
              times.reduce((s, t) => s + t, 0) / times.length / 1000 / 60,
            )
          : null;
      return {
        assigned: r._id?.toString() ?? "unassigned",
        count: r.count,
        avgResolutionMinutes: avg,
      };
    });

    return {
      byStage,
      resolutionTimeSpan: {
        avgMinutes: avgResolutionMinutes,
        minMinutes: minResolutionMinutes,
        maxMinutes: maxResolutionMinutes,
        buckets: buckets.map(({ label, count }) => ({ label, count })),
      },
      byAssigned,
    };
  }
}
