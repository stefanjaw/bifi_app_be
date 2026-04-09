import {
  ContactDocument,
  ProjectDocument,
  ProjectStageDocument,
  UserDocument,
} from "@mongodb-types";
import {
  BaseService,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { projectModel } from "../models/project.model";
import mongoose from "mongoose";
import { ProjectDTO } from "../models/project.dto";
import { SequenceService } from "../../sequences/services/sequence-service";
import dayjs from "dayjs";

const sequenceService = new SequenceService();

export class ProjectService extends BaseService<ProjectDocument> {
  constructor() {
    super({
      model: projectModel,
      refFields: [
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "stage",
          getModel: () =>
            this.connectionManager.getModel<ProjectStageDocument>(
              "ProjectStage",
            ),
          isArray: false,
        },
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "parentId",
          getModel: () =>
            this.connectionManager.getModel<ProjectDocument>("Project"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new project document.
   * The document is created with the user who made the request as the createdBy user.
   * A sequence number is generated automatically using a sequence with prefix "PRJ-".
   * @param data - The project data to create.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the created project document.
   */
  override async create(
    data: ProjectDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<ProjectDocument> {
    return await runTransaction<ProjectDocument>(
      session,
      async (newSession) => {
        const number = await sequenceService.getNextNumberOrCreate(
          "Projects",
          "PRJ-",
          5,
          1,
        );

        if (dayjs(data.dateEnd).isBefore(dayjs(data.dateStart))) {
          throw new ValidationException("Start date must be before end date");
        }

        return await super.create(
          {
            ...data,
            createdBy: userStorage.getStore()?.user?._id,
            number,
          } as any,
          newSession,
        );
      },
    );
  }
}
