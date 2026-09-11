import axiosAuthInstance from '../utils/axios-auth-instance';

/**
 * Mengirim pesan chat ke AI Service.
 * @param {string} aiBaseUrl - Base URL AI service (e.g. "http://localhost:8000")
 * @param {Object} payload - Body request: { query, session_id, history, user_context }
 * @returns {Promise<Object>} - Response JSON dari AI service
 */
export async function sendChatMessage(aiBaseUrl, payload) {
  const cleanBase = (aiBaseUrl || '').replace(/\/$/, '');
  const response = await fetch(`${cleanBase}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Jaringan bermasalah atau API error');
  }

  return response.json();
}

/**
 * Mengambil daftar sesi chat milik user.
 * @param {number} limit
 * @param {number} skip
 * @returns {Promise<Array>} - Array sesi chat
 */
export async function fetchSessions(limit = 20, skip = 0) {
  const response = await axiosAuthInstance.get(
    `/chat-sessions?limit=${limit}&skip=${skip}`
  );
  return response.data?.data?.sessions || [];
}

/**
 * Mengambil histori pesan untuk satu sesi.
 * @param {string} sessionId
 * @returns {Promise<Array>} - Array pesan { sender, text }
 */
export async function fetchHistory(sessionId) {
  if (!sessionId) return [];
  const response = await axiosAuthInstance.get(
    `/chat-history?session_id=${sessionId}`
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Menghapus satu sesi chat berdasarkan sessionId.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
  await axiosAuthInstance.delete(`/chat-sessions/${sessionId}`);
}

/**
 * Menyimpan pasangan pesan user + AI ke database.
 * @param {string} sessionId
 * @param {string} userText
 * @param {string} aiReplyText
 * @returns {Promise<void>}
 */
export async function saveMessages(sessionId, userText, aiReplyText) {
  await axiosAuthInstance.post('/chat-messages', {
    session_id: sessionId,
    messages: [
      { sender: 'user', text: userText },
      { sender: 'ai', text: aiReplyText },
    ],
  });
}

/**
 * Mengambil delivery orders dengan filter tertentu.
 * @param {Object} filters - { start_date, end_date, customer_id, kabupaten_kota, so_origin, delivery_order_num }
 * @returns {Promise<Array>} - Array delivery orders
 */
export async function fetchDeliveryOrders(filters = {}) {
  let url = `/delivery-orders?skip=0&limit=1000&status=READY`;
  const {
    start_date,
    end_date,
    customer_id,
    kabupaten_kota,
    so_origin,
    delivery_order_num,
  } = filters;

  if (start_date && end_date) {
    const formattedStartDate = new Date(start_date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedEndDate = new Date(end_date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    url += `&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
  }
  if (customer_id) url += `&customer_id=${customer_id}`;
  if (kabupaten_kota) url += `&kabupaten_kota=${encodeURIComponent(kabupaten_kota)}`;
  if (so_origin) url += `&so_origin=${encodeURIComponent(so_origin)}`;
  if (delivery_order_num)
    url += `&delivery_order_num=${encodeURIComponent(delivery_order_num)}`;

  const response = await axiosAuthInstance.get(url);
  return response.data?.data?.deliveryOrders || [];
}

/**
 * Memanggil endpoint optimisasi rute (priority-opt) dengan preview mode.
 * @param {Array<string>} deliveryOrderIds
 * @param {string} optType - 'distance' | 'load' | 'balance'
 * @param {string} dcId
 * @returns {Promise<Object>} - Data response optimisasi
 */
export async function runOptimization(deliveryOrderIds, optType, dcId) {
  const response = await axiosAuthInstance.post(
    `priority-opt?preview=true`,
    { delivery_orders_id: deliveryOrderIds, priority: optType },
    { headers: { dc_id: dcId }, timeout: 600000 }
  );
  return response.data;
}
