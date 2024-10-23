import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { paginateData } from '../../utils/paginate-data.js';
import {
  generateBardText,
  generateOpenAiText,
} from '../../utils/ai/ai-helper.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function editAndSaveHistoryContent(req, res, next) {
  try {
    const { promptHistoryId } = req.params;
    const { content } = req.body;

    const promptHistory =
      await models.promptHistoryModel.findById(promptHistoryId);
    if (!promptHistory) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Prompt history not found'
      );
    }
    promptHistory.response = content;
    await promptHistory.save();

    const generatedIdea = await models.toolGeneratedIdeas.findOne({
      savedPromptHistory: promptHistoryId,
    });
    if (generatedIdea) {
      generatedIdea.response = content;
      await generatedIdea.save();
    } else {
      const savedEmail = await models.toolSavedEmailModel.findOne({
        savedPromptHistory: promptHistoryId,
      });
      if (savedEmail) {
        savedEmail.response = content;
        await savedEmail.save();
      }
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Content is edited successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function renameHistoryName(req, res, next) {
  try {
    const { name } = req.body;
    const { historyId } = req.params;

    const history = await models.promptHistoryModel.findById(historyId);
    if (!history) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found'
      );
    }

    history.name = name;
    await history.save();

    const generatedIdea = await models.toolGeneratedIdeas.findOne({
      savedPromptHistory: historyId,
    });
    if (generatedIdea) {
      generatedIdea.name = name;
      await generatedIdea.save();
    } else {
      const savedEmail = await models.toolSavedEmailModel.findOne({
        savedPromptHistory: historyId,
      });
      if (savedEmail) {
        savedEmail.name = name;
        await savedEmail.save();
      }
    }

    return responseHelper(res, httpStatus.OK, false, 'Renamed successfully');
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function removeHistory(req, res, next) {
  try {
    const { historyId } = req.params;
    const history =
      await models.promptHistoryModel.findByIdAndDelete(historyId);
    if (!history) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'History not found'
      );
    }
    if (history.isSaved) {
      const generatedIdea = await models.toolGeneratedIdeas.findOne({
        savedPromptHistory: historyId,
      });
      if (generatedIdea) {
        await models.toolGeneratedIdeas.deleteOne({
          savedPromptHistory: historyId,
        });
      } else {
        const savedEmail = await models.toolSavedEmailModel.findOne({
          savedPromptHistory: historyId,
        });
        if (savedEmail) {
          await models.toolSavedEmailModel.deleteOne({
            savedPromptHistory: historyId,
          });
        }
      }
    }
    // Delete all child histories with parentId as historyId
    await models.promptHistoryModel.deleteMany({ parentId: historyId });
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Idea is deleted successfully'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}
export async function listAllResponseHistory(req, res, next) {
  try {
    const userId = req.user.userId;
    let { search, period, page = 1, pageLimit = defaultPageLimit } = req.query;

    const filter = {};
    const currentDate = new Date();

    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    filter.createdAt = {
      $gte: threeMonthsAgo,
      $lte: currentDate,
    };
    // Search by name and key
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { key: { $regex: new RegExp(search, 'i') } },
      ];
    }

    // Filter by time period
    if (period) {
      switch (period) {
        case 'thisMonth':
          filter.createdAt = {
            $gte: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            ),
            $lte: currentDate,
          };
          break;
        case 'thisWeek':
          const firstDayOfWeek = new Date(currentDate);
          firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const lastDayOfWeek = new Date(currentDate);
          lastDayOfWeek.setDate(
            currentDate.getDate() - currentDate.getDay() + 6
          );
          filter.createdAt = {
            $gte: firstDayOfWeek,
            $lte: lastDayOfWeek,
          };
          break;
        default:
          break;
      }
    }

    const histories = await models.promptHistoryModel
      .find({
        userId,
        key: { $exists: true },
        ...filter,
      })
      .sort({ createdAt: -1 });

    if (!histories || histories.length === 0) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No content found matching the criteria'
      );
    }

    const formattedHistories = histories.map((history) => ({
      _id: history._id,
      title: history.name,
      key: history.key,
      createdDate: history.createdAt.toISOString().split('T')[0],
      parentId: history.parentId,
    }));
    page = parseInt(page);
    pageLimit = parseInt(pageLimit);
    const paginatedData = paginateData(formattedHistories, page, pageLimit);
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'List of response histories',
      {
        histories: paginatedData.data,
        pagination: paginatedData.pagination,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function individualHistoryContentViewIcon(req, res, next) {
  try {
    const { id } = req.params;

    const history = await models.promptHistoryModel.findById(id);

    if (!history) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'History not found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'response history', {
      _id: history._id,
      title: history.name,
      response: history.response,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getParentChildHistoryResponse(req, res, next) {
  try {
    const { parentId } = req.params;

    let toolResponses = await models.promptHistoryModel
      .find({ parentId })
      .sort({ createdDate: -1 });

    if (!toolResponses || toolResponses.length === 0) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No generated responses found'
      );
    }

    const formattedToolResponses = await Promise.all(
      toolResponses.map(async (res) => {
        let parsedInput;
        parsedInput = JSON.parse(res.input);

        const project = await models.projectModel
          .findById(parsedInput.project)
          .select('_id name');
        const toneOfVoice = await models.toneOfVoiceModel
          .findById(parsedInput.toneOfVoice)
          .select('_id toneOfVoice');
        const ideas = [
          {
            historyId: res._id,
            title: res.name,
            key: res.key,
            createdDate: res.createdAt.toISOString().split('T')[0],
            content: res.response,
          },
        ];
        return {
          project,
          toneOfVoice,
          platform: parsedInput.platform || 'N/A',
          tool: parsedInput.tool || 'N/A',
          prompt: parsedInput.prompt || 'N/A',
          language: parsedInput.language || 'N/A',
          subject: parsedInput.subject || 'N/A',
          keyPoints: parsedInput.keyPoints || 'N/A',
          targetAudience: parsedInput.targetAudience || 'N/A',
          approximateWords: parsedInput.approximateWords || 'N/A',
          hashTag: parsedInput.hashTag || 'N/A',
          collections: ideas,
        };
      })
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Histories with parent and child contents',
      {
        contents: formattedToolResponses,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function renameSavedContentTitle(req, res, next) {
  try {
    const { historyId } = req.params;
    const { name } = req.body;
    let updatedContent;

    const generatedIdea = await models.toolGeneratedIdeas.findOne({
      savedPromptHistory: historyId,
    });
    if (generatedIdea) {
      updatedContent = await models.toolGeneratedIdeas.findOneAndUpdate(
        { savedPromptHistory: historyId },
        { name: name },
        { new: true }
      );
      await models.promptHistoryModel.findByIdAndUpdate(
        { _id: historyId },
        { name: name },
        { new: true }
      );
    } else {
      const savedEmail = await models.toolSavedEmailModel.findOne({
        savedPromptHistory: historyId,
      });
      if (savedEmail) {
        updatedContent = await models.toolSavedEmailModel.findOneAndUpdate(
          { savedPromptHistory: historyId },
          { name: name },
          { new: true }
        );
        await models.promptHistoryModel.findByIdAndUpdate(
          { _id: historyId },
          { name: name },
          { new: true }
        );
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Content not found'
        );
      }
    }
    await updatedContent.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Title is renamed successfully',
      {
        content: updatedContent,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}
export async function editSavedContent(req, res, next) {
  try {
    const { historyId } = req.params;
    const { content } = req.body;
    let updatedContent;

    const generatedIdea = await models.toolGeneratedIdeas.findOne({
      savedPromptHistory: historyId,
    });
    if (generatedIdea) {
      generatedIdea.response = content;
      updatedContent = await generatedIdea.save();
      const prompt = await models.promptHistoryModel.findById(historyId);
      prompt.response = content;
      await prompt.save();
    } else {
      const savedEmail = await models.toolSavedEmailModel.findOne({
        savedPromptHistory: historyId,
      });
      if (savedEmail) {
        savedEmail.response = content;
        updatedContent = await savedEmail.save();
        const prompt = await models.promptHistoryModel.findById(historyId);
        prompt.response = content;
        await prompt.save();
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Content not found'
        );
      }
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'content is edited successfully',
      {
        content: updatedContent,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function deleteSavedContent(req, res, next) {
  try {
    const { id } = req.params;
    let savedPromptHistoryId;

    // Check in toolGeneratedIdeas
    const generatedIdea = await models.toolGeneratedIdeas.findById(id);
    if (generatedIdea) {
      savedPromptHistoryId = generatedIdea.savedPromptHistory;
      await models.toolGeneratedIdeas.findByIdAndDelete(id);
    } else {
      // Check in toolSavedEmailModel
      const savedEmail = await models.toolSavedEmailModel.findById(id);
      if (savedEmail) {
        savedPromptHistoryId = savedEmail.savedPromptHistory;
        await models.toolSavedEmailModel.findByIdAndDelete(id);
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'saved idea not found'
        );
      }
    }

    // Delete all child histories
    if (savedPromptHistoryId) {
      await models.promptHistoryModel.deleteMany({
        parentId: savedPromptHistoryId,
      });
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'idea is deleted successfully'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function individualSavedContentViewIcon(req, res, next) {
  try {
    const { id } = req.params;
    let data;
    const generatedIdea = await models.toolGeneratedIdeas.findById(id);
    if (generatedIdea) {
      data = {
        title: generatedIdea.name ? generatedIdea.name : '',
        response: generatedIdea.response,
        _id: generatedIdea._id,
        historyId: generatedIdea.savedPromptHistory,
      };
    } else {
      const savedEmail = await models.toolSavedEmailModel.findById(id);
      if (savedEmail) {
        data = {
          title: savedEmail.name ? savedEmail.name : '',
          response: savedEmail.response,
          _id: savedEmail._id,
          historyId: savedEmail.savedPromptHistory,
        };
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Content not found'
        );
      }
    }

    return responseHelper(res, httpStatus.OK, false, 'Saved data', {
      content: data,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}
