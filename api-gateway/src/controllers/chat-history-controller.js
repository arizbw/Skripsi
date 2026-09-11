import { HTTPResponse } from "../utils/response.js";
import {
  getChatHistoryService,
  saveChatMessagesService,
  getChatSessionsService,
  createChatSessionService,
  deleteChatSessionService,
} from "../services/chat-history-service.js";

const getChatHistoryController = async (request, response, next) => {
  try {
    const { session_id } = request.query;
    if (!session_id) {
      return response
        .status(400)
        .json(HTTPResponse(false, 400, null, null, "session_id parameter is required"));
    }

    const messages = await getChatHistoryService(session_id);
    return response
      .status(200)
      .json(HTTPResponse(true, 200, "Success get chat history", messages, null));
  } catch (error) {
    next(error);
  }
};

const saveChatMessagesController = async (request, response, next) => {
  try {
    const userId = request.decodedToken.id || request.decodedToken.sub || request.decodedToken.user_id;
    const { session_id, messages } = request.body;

    if (!session_id || !messages || !Array.isArray(messages)) {
      return response
        .status(400)
        .json(HTTPResponse(false, 400, null, null, "session_id and messages array are required"));
    }

    const result = await saveChatMessagesService(session_id, userId, messages);
    return response
      .status(200)
      .json(HTTPResponse(true, 200, "Chat messages saved successfully", result, null));
  } catch (error) {
    next(error);
  }
};

const getChatSessionsController = async (request, response, next) => {
  try {
    const userId = request.decodedToken.id || request.decodedToken.sub || request.decodedToken.user_id;
    const limit = parseInt(request.query.limit) || 20;
    const skip = parseInt(request.query.skip) || 0;

    const result = await getChatSessionsService(userId, skip, limit);
    return response
      .status(200)
      .json(HTTPResponse(true, 200, "Success get chat sessions", result, null));
  } catch (error) {
    next(error);
  }
};

const createChatSessionController = async (request, response, next) => {
  try {
    const userId = request.decodedToken.id || request.decodedToken.sub || request.decodedToken.user_id;
    const { session_id, title } = request.body;

    if (!session_id) {
      return response
        .status(400)
        .json(HTTPResponse(false, 400, null, null, "session_id is required"));
    }

    const result = await createChatSessionService(session_id, userId, title);
    return response
      .status(201)
      .json(HTTPResponse(true, 201, "Chat session created", result, null));
  } catch (error) {
    next(error);
  }
};

const deleteChatSessionController = async (request, response, next) => {
  try {
    const userId = request.decodedToken.id || request.decodedToken.sub || request.decodedToken.user_id;
    const { sessionId } = request.params;

    const result = await deleteChatSessionService(sessionId, userId);
    return response
      .status(200)
      .json(HTTPResponse(true, 200, "Chat session deleted successfully", result, null));
  } catch (error) {
    next(error);
  }
};

export {
  getChatHistoryController,
  saveChatMessagesController,
  getChatSessionsController,
  createChatSessionController,
  deleteChatSessionController,
};
