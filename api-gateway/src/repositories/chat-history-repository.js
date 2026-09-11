import { prisma } from "../config/database.js";

const findOrCreateSession = async (sessionId, userId, initialTitle = null) => {
  try {
    let session = await prisma.chatSession.findUnique({
      where: { session_id: sessionId },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          session_id: sessionId,
          user_id: userId,
          title: initialTitle || `Sesi Percakapan`,
        },
      });
    }

    return session;
  } catch (error) {
    console.error("Error in findOrCreateSession:", error);
    throw new Error("Gagal memproses sesi chat");
  }
};

const getMessagesBySessionId = async (sessionId, limit = 50) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { session_id: sessionId },
    });

    if (!session) {
      return [];
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chat_session_id: session.id },
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
      take: limit,
    });

    // Ensure exact chronological order by autoincrement id ASC
    return messages.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error("Error in getMessagesBySessionId:", error);
    throw new Error("Gagal mengambil histori pesan chat");
  }
};

const createMessages = async (sessionId, userId, messages) => {
  try {
    if (!messages || messages.length === 0) return [];

    let session = await prisma.chatSession.findUnique({
      where: { session_id: sessionId },
    });

    // Derive title from first user message if needed
    const firstUserMsg = messages.find((m) => m.sender === "user");
    let derivedTitle = null;
    if (firstUserMsg && firstUserMsg.text) {
      const words = firstUserMsg.text.trim().split(/\s+/);
      derivedTitle = words.slice(0, 5).join(" ");
      if (words.length > 5) derivedTitle += "...";
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          session_id: sessionId,
          user_id: userId,
          title: derivedTitle || `Sesi Percakapan Baru`,
        },
      });
    } else if (derivedTitle) {
      const existingMessageCount = await prisma.chatMessage.count({
        where: { chat_session_id: session.id },
      });

      const isDefaultTitle =
        !session.title ||
        session.title === "Sesi Percakapan" ||
        session.title === "Sesi Percakapan Baru" ||
        session.title.startsWith("Sesi Percakapan");

      if (existingMessageCount === 0 || isDefaultTitle) {
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { title: derivedTitle },
        });
      }
    }

    // Insert sequentially to ensure autoincrement ID reflects exact message order
    for (const msg of messages) {
      await prisma.chatMessage.create({
        data: {
          chat_session_id: session.id,
          sender: msg.sender,
          text: msg.text,
        },
      });
    }

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updated_at: new Date() },
    });

    return await getMessagesBySessionId(sessionId, 50);
  } catch (error) {
    console.error("Error in createMessages:", error);
    throw new Error("Gagal menyimpan pesan chat");
  }
};

const getSessionsByUserId = async (userId, limit = 20, skip = 0) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: "desc" },
      skip: skip,
      take: limit,
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    const total = await prisma.chatSession.count({
      where: { user_id: userId },
    });

    return { sessions, total };
  } catch (error) {
    console.error("Error in getSessionsByUserId:", error);
    throw new Error("Gagal mengambil daftar sesi chat");
  }
};

const createSession = async (sessionId, userId, title = null) => {
  try {
    const existing = await prisma.chatSession.findUnique({
      where: { session_id: sessionId },
    });
    if (existing) return existing;

    return await prisma.chatSession.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        title: title || "Sesi Percakapan Baru",
      },
    });
  } catch (error) {
    console.error("Error in createSession:", error);
    throw new Error("Gagal membuat sesi chat baru");
  }
};

const deleteSession = async (sessionId, userId) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        session_id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error("Sesi chat tidak ditemukan");
    }

    await prisma.chatSession.delete({
      where: { id: session.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in deleteSession:", error);
    throw new Error("Gagal menghapus sesi chat");
  }
};

export {
  findOrCreateSession,
  getMessagesBySessionId,
  createMessages,
  getSessionsByUserId,
  createSession,
  deleteSession,
};
