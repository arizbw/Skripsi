import {
  getMessagesBySessionId,
  createMessages,
  getSessionsByUserId,
  createSession,
  deleteSession,
} from "../repositories/chat-history-repository.js";

const getChatHistoryService = async (sessionId) => {
  return await getMessagesBySessionId(sessionId, 50);
};

const saveChatMessagesService = async (sessionId, userId, messages) => {
  return await createMessages(sessionId, userId, messages);
};

const getChatSessionsService = async (userId, skip = 0, limit = 20) => {
  return await getSessionsByUserId(userId, limit, skip);
};

const createChatSessionService = async (sessionId, userId, title) => {
  return await createSession(sessionId, userId, title);
};

const deleteChatSessionService = async (sessionId, userId) => {
  return await deleteSession(sessionId, userId);
};

export {
  getChatHistoryService,
  saveChatMessagesService,
  getChatSessionsService,
  createChatSessionService,
  deleteChatSessionService,
};
