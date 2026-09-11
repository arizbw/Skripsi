import { useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import {
  sendChatMessage,
  fetchSessions as apiFetchSessions,
  fetchHistory as apiFetchHistory,
  deleteSession as apiDeleteSession,
  saveMessages,
  fetchDeliveryOrders,
  runOptimization,
} from '../services/chatApi';

const GREETING_MESSAGE = { sender: 'ai', text: 'Halo! Ada yang bisa saya bantu?' };

/**
 * Custom hook yang mengelola seluruh state dan business logic chatbox AI.
 * @param {Function} navigate - Dari useNavigate (React Router)
 * @returns {Object} state dan action handlers
 */
export function useChat(navigate) {
  const [messages, setMessages] = useState([GREETING_MESSAGE]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [showSessionsPanel, setShowSessionsPanel] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Dekode JWT dan ambil user info */
  const getUserInfoFromToken = () => {
    const token = sessionStorage.getItem('token');
    let userId = 'default_user';
    let userRoleName = null;
    let userDcId = null;
    let userDcName = null;

    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.id || decoded.sub || decoded.user_id || 'user';
        userRoleName = decoded.role?.name;
        userDcId = decoded.role?.dc_id || decoded.dc_id;
        userDcName = userDcId ? (decoded.role?.dc_name || null) : null;
      } catch (e) {
        // token invalid — fallback ke default
      }
    }

    return { token, userId, userRoleName, userDcId, userDcName };
  };

  /** Buat base URL AI service dari env */
  const getAiBaseUrl = () => {
    return process.env.REACT_APP_AI_URL;
  };

  // ─── Load sessions & initial history ─────────────────────────────────────

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await apiFetchSessions();
      setSessions(data);
    } catch (error) {
      console.error('Gagal mengambil daftar sesi chat:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadHistory = async (sessionId) => {
    if (!sessionId) return;
    setIsLoadingHistory(true);
    try {
      const fetchedMessages = await apiFetchHistory(sessionId);
      if (fetchedMessages.length > 0) {
        setMessages(
          fetchedMessages.map((m) => ({ sender: m.sender, text: m.text }))
        );
      } else {
        setMessages([GREETING_MESSAGE]);
      }
    } catch (error) {
      console.error('Gagal mengambil histori chat:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      const { userId } = getUserInfoFromToken();

      let currentSessionId = sessionStorage.getItem('session_id');
      if (!currentSessionId) {
        currentSessionId = `user_${userId}_${Date.now()}`;
        sessionStorage.setItem('session_id', currentSessionId);
      }
      setActiveSessionId(currentSessionId);

      await loadSessions();
      await loadHistory(currentSessionId);
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Session handlers ─────────────────────────────────────────────────────

  const handleSelectSession = async (session) => {
    const selectedId = session.session_id;
    setActiveSessionId(selectedId);
    sessionStorage.setItem('session_id', selectedId);
    await loadHistory(selectedId);
  };

  const handleNewChat = () => {
    const { userId } = getUserInfoFromToken();
    const newSessionId = `user_${userId}_${Date.now()}`;
    sessionStorage.setItem('session_id', newSessionId);
    setActiveSessionId(newSessionId);
    setMessages([GREETING_MESSAGE]);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e?.stopPropagation?.();
    try {
      await apiDeleteSession(sessionId);
      await loadSessions();
      if (sessionId === activeSessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Gagal menghapus sesi:', error);
    }
  };

  // ─── Command routing map ──────────────────────────────────────────────────

  const ROUTE_MAP = {
    shipments_list: '/pengiriman',
    add_shipment: '/shipment/tambah',
    edit_shipment: '/shipment/edit',
    trucks_list: '/truk',
    add_truck: '/truk/buat',
    bulk_add_truck: '/truk/bulk-buat',
    edit_truck: '/truk/update',
    bulk_edit_truck: '/truk/bulk-ubah',
    delivery_orders_list: '/delivery-order',
    add_delivery_order: '/delivery-orders/create',
    edit_delivery_order: '/delivery-orders/edit',
    locations_list: '/lokasi',
    add_location: '/lokasi/buat',
    edit_location: '/lokasi/update',
    dashboard: '/dashboard',
    products_line_list: '/product-line',
    add_product_line: '/product-line/tambah',
    edit_product_line: '/product-line/edit',
    products_list: '/product',
    add_product: '/product/tambah',
    edit_product: '/product/edit',
    customers_list: '/customer',
    add_customer: '/customer/tambah',
    edit_customer: '/customer/edit',
    users_list: '/user',
    add_user: '/user/tambah',
    edit_user: '/user/edit',
    roles_list: '/role',
    add_role: '/role/tambah',
    edit_role: '/role/edit',
    detail_location: '/lokasi',
    detail_customer: '/customer',
    detail_delivery_order: '/delivery-order',
    detail_shipment: '/pengiriman',
  };

  /** Handle command `automate_shipment` — fetch DO, run optimization, navigate */
  const handleAutomateShipment = async (commandData, sessionId, userText) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: 'Memproses optimisasi rute di background, mohon tunggu beberapa saat...',
      },
    ]);

    const {
      start_date,
      end_date,
      optimization_type,
      customer_id,
      kabupaten_kota,
      so_origin,
      delivery_order_num,
      delivery_order_ids,
    } = commandData || {};

    // Normalize optimization type
    let optType = optimization_type || 'distance';
    if (optType === 'route') optType = 'distance';
    else if (optType === 'volume') optType = 'load';
    else if (optType === 'distance_volume') optType = 'balance';

    // Resolve delivery order IDs
    let doIds;
    if (delivery_order_ids && Array.isArray(delivery_order_ids) && delivery_order_ids.length > 0) {
      doIds = delivery_order_ids;
    } else {
      const deliveryOrders = await fetchDeliveryOrders({
        start_date,
        end_date,
        customer_id,
        kabupaten_kota,
        so_origin,
        delivery_order_num,
      });

      if (deliveryOrders.length === 0) {
        const errMsg =
          'Maaf, tidak ada Delivery Order yang berstatus READY pada kriteria filter tersebut untuk DC Anda.';
        setMessages((prev) => [...prev, { sender: 'ai', text: errMsg }]);
        await saveMessages(sessionId, userText, errMsg);
        alert(errMsg);
        return;
      }
      doIds = deliveryOrders.map((item) => item.id);
    }

    const { token, userRoleName } = getUserInfoFromToken();
    let dcId = '';
    if (token) {
      try {
        const decoded = jwtDecode(token);
        dcId = decoded.dc_id || decoded.role?.dc_id || '';
      } catch (e) { }
    }

    const optData = await runOptimization(doIds, optType, dcId);
    const shipmentsResult = optData?.data?.shipments || [];

    if (shipmentsResult.length === 0) {
      const errMsg =
        'Maaf, algoritma tidak dapat membentuk pengiriman (mungkin karena kapasitas truk tidak mencukupi, tidak ada truk tersedia, atau lokasi tidak terjangkau).';
      setMessages((prev) => [...prev, { sender: 'ai', text: errMsg }]);
      await saveMessages(sessionId, userText, errMsg);
      alert(errMsg);
      return;
    }

    const successMsg =
      'Pratinjau pengiriman berhasil dibuat! Mengalihkan ke halaman tinjauan pengiriman...';
    setMessages((prev) => [...prev, { sender: 'ai', text: successMsg }]);
    await saveMessages(sessionId, userText, successMsg);

    setTimeout(() => {
      const basePath = userRoleName === 'Super' ? '/administrator' : '';
      sessionStorage.setItem('automate_shipment_data', JSON.stringify(optData));
      navigate(`${basePath}/pengiriman/otomatisasi`, {
        state: { optResponse: optData },
      });
    }, 2500);
  };

  /** Handle command navigasi ke route tertentu */
  const handleRouteCommand = (target, commandData) => {
    if (!ROUTE_MAP[target]) return;

    try {
      const { userRoleName } = getUserInfoFromToken();
      const basePath = userRoleName === 'Super' ? '/administrator' : '';
      let finalRoute = `${basePath}${ROUTE_MAP[target]}`;

      let payload = commandData;
      if (payload) {
        if (payload.id !== undefined && payload.Id === undefined) {
          payload.Id = payload.id;
        } else if (payload.Id !== undefined && payload.id === undefined) {
          payload.id = payload.Id;
        }
      }

      const detailTargets = [
        'detail_location',
        'detail_customer',
        'detail_delivery_order',
        'edit_delivery_order',
        'detail_shipment',
      ];
      if (detailTargets.includes(target) && payload?.id) {
        finalRoute = `${finalRoute}/${payload.id}`;
      }

      navigate(finalRoute, { state: payload });
    } catch (error) {
      console.error('Error saat decode token untuk navigasi', error);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText;
    const sessionId =
      activeSessionId || sessionStorage.getItem('session_id') || 'default_session';

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputText('');
    setIsLoading(true);

    try {
      const { userRoleName, userDcId, userDcName, token } = getUserInfoFromToken();
      const aiBaseUrl = getAiBaseUrl();

      const data = await sendChatMessage(aiBaseUrl, {
        query: userText,
        session_id: sessionId,
        history: messages.filter(
          (msg, index) =>
            !(index === 0 && msg.text === 'Halo! Ada yang bisa saya bantu?')
        ),
        user_context: {
          role: userRoleName,
          dc_id: userDcId,
          dc_name: userDcName,
          token,
        },
      });

      const rawReply = data.reply || 'Respons tidak tersedia.';
      const aiReply = typeof rawReply === 'string' ? rawReply : JSON.stringify(rawReply);

      if (data.command) {
        const { target } = data.command;

        if (target === 'automate_shipment') {
          try {
            await handleAutomateShipment(data.command.data, sessionId, userText);
          } catch (error) {
            console.error('Gagal membuat pengiriman otomatis:', error);
            const errMsg =
              'Terjadi kesalahan saat memproses optimisasi rute atau server terlalu sibuk.';
            setMessages((prev) => [...prev, { sender: 'ai', text: errMsg }]);
            await saveMessages(sessionId, userText, errMsg);
            alert(errMsg);
          } finally {
            setIsLoading(false);
          }
          return;
        }

        handleRouteCommand(target, data.command.data);
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
      await saveMessages(sessionId, userText, aiReply);
      // Refresh session list untuk update judul/preview
      loadSessions();
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Maaf, gagal terhubung ke agen AI atau terjadi kesalahan server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // State
    messages,
    sessions,
    activeSessionId,
    showSessionsPanel,
    inputText,
    isLoading,
    isLoadingHistory,
    isLoadingSessions,
    // Setters
    setInputText,
    setShowSessionsPanel,
    // Handlers
    handleSend,
    handleKeyDown,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
  };
}
