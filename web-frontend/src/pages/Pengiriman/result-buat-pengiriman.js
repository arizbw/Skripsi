import React, { useState, useEffect } from "react";
import ListHasilPengiriman from "./list-card-pengiriman";
import PengirimanDetail from "./detail-pengiriman";
import { Modal } from "../../components/Modal";
import { BaseTablePagination } from '../../components/BaseTablePagination';
import { Loading } from '../../components/Loading';
import { FiCheckSquare } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosAuthInstance from '../../utils/axios-auth-instance';
import jwtDecode from 'jwt-decode';
function ResultBuatPengiriman() {
  const [selectedPengiriman, setSelectedPengiriman] = useState(null);
  const [activeTab, setActiveTab] = useState('berhasil');
  const [modalKonfirmasi, setModalKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pengirimanList, setPengirimanList] = useState([]);
  const [failedDeliveryOrders, setFailedDeliveryOrders] = useState([]);
  const [isOpenSuccess, setIsOpenSuccess] = useState(false);
  const [isOpenInfo, setIsOpenInfo] = useState(false);
  const [isOpenError, setIsOpenError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedData = sessionStorage.getItem('automate_shipment_data') || localStorage.getItem('responseData');
    if (storedData) {
      const response = JSON.parse(storedData);
      if (response.success) {
        console.log('=== RESPONSE DATA DEBUG ===');
        console.log('Full response:', response);
        console.log('Shipments array:', response.data.shipments);
        console.log('Number of shipments:', response.data.shipments.length);

        // Check each shipment for all_coords
        response.data.shipments.forEach((shipment, index) => {
          console.log(`Shipment ${index}:`, shipment);
          console.log(`  - has all_coords?`, 'all_coords' in shipment);
          console.log(`  - all_coords type:`, typeof shipment.all_coords);
          console.log(`  - all_coords value:`, shipment.all_coords);
        });
        console.log('==========================');

        setPengirimanList(response.data.shipments);
        setFailedDeliveryOrders(response.data.failed_delivery_orders || []);
      }
    }
  }, []);
  console.log('Current pengirimanList:', pengirimanList)
  console.log('Current failedDeliveryOrders:', failedDeliveryOrders)

  const navigateToPengiriman = () => {
    let userRole = '';
    const token = sessionStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      userRole = decodedToken.role?.name;
    }
    const basePath = userRole === 'Super' ? '/administrator' : '';
    navigate(`${basePath}/pengiriman`);
  };

  const handleSimpanPengiriman = async () => {
    try {
      setLoading(true);
      // Filter only shipments that haven't been saved yet
      const unsavedShipments = pengirimanList.filter(p => p.status !== 'saved');
      if (unsavedShipments.length > 0) {
        await axiosAuthInstance.post('/priority-opt/bulk-save', { shipments: unsavedShipments });
        setIsOpenSuccess(true);
      } else {
        setIsOpenInfo(true);
      }
      setModalKonfirmasi(false);
      
    } catch (error) {
      console.error('Gagal menyimpan pengiriman:', error);
      setIsOpenError(true);
    } finally {
      setLoading(false);
    }
  };

  const columns = React.useMemo(() => [
    { Header: 'Nomor DO', accessor: 'delivery_order_num' },
    { Header: 'Target ETA', accessor: 'eta_target' },
    { Header: 'Alamat Asal', accessor: 'loc_ori.address' },
    { Header: 'Alamat Tujuan', accessor: 'loc_dest.address' },
    { Header: 'Volume', accessor: 'volume' },
    { Header: 'Status', accessor: 'status' },
  ], []);

  const updatePengirimanList = (shipmentNum, newStatus) => {
    setPengirimanList(prevList =>
      prevList.map(pengiriman =>
        pengiriman.shipment_num === shipmentNum
          ? { ...pengiriman, status: newStatus }
          : pengiriman
      )
    );
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      <div className="flex flex-col w-full">
        <div className="px-[50px] pt-6">
          <div className="flex items-center justify-between">
            <button className="text-primary mr-2">← Kembali</button>
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
              onClick={() => setModalKonfirmasi(true)} // Show modal on click
            >
              <FiCheckSquare size={16} />
              Selesai
            </button>
          </div>
        </div>

        <div className="px-[50px] pt-6 flex flex-col">
          <div className="bg-primary-border rounded-t-lg pt-4 pl-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab('berhasil')}
                className={`px-4 py-2 ${activeTab === 'berhasil' ? 'bg-white border-primary-hover font-medium rounded-t-lg' : 'bg-primary-surface text-gray-600 rounded-t-lg'}`}
              >
                Berhasil ({pengirimanList.length} Pengiriman)
              </button>
              <button
                onClick={() => setActiveTab('gagal')}
                className={`px-4 py-2 border-primary-hover ${activeTab === 'gagal' ? 'bg-white border-primary-hover font-medium rounded-t-lg' : 'bg-primary-surface text-gray-600 rounded-t-lg'}`}
              >
                Gagal ({failedDeliveryOrders.length} DO)
              </button>
            </div>
          </div>

          {activeTab === 'berhasil' ? (
            <div className="bg-white rounded-b-lg flex gap-4">
              <ListHasilPengiriman
                onSelect={setSelectedPengiriman}
                activeTab={activeTab}
                pengirimanList={pengirimanList}
              />
              <PengirimanDetail
                pengiriman={selectedPengiriman}
                activeTab={activeTab}
                updatePengirimanList={updatePengirimanList}
              />
            </div>
          ) : (
            <div className="bg-white rounded-b-lg p-4">
              <Loading visibility={loading} />
              <BaseTablePagination
                columns={columns}
                data={failedDeliveryOrders}
                judul={'Daftar DO Gagal'}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        variant="primary"
        isOpen={modalKonfirmasi}
        closeModal={() => setModalKonfirmasi(false)}
        title="Selesaikan Otomatisasi Pengiriman"
        description="Anda yakin sudah selesai mengatur semua pengiriman?"
        rightButtonText="Yakin"
        leftButtonText="Batal"
        onClickRight={handleSimpanPengiriman}
      />
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description="Semua pengiriman berhasil disimpan!"
        rightButtonText="Selesai"
        onClickRight={navigateToPengiriman}
      />
      <Modal
        variant="warning"
        isOpen={isOpenInfo}
        closeModal={() => setIsOpenInfo(false)}
        description="Tidak ada pengiriman baru yang perlu disimpan"
        rightButtonText="Tutup"
        onClickRight={navigateToPengiriman}
      />
      <Modal
        variant="danger"
        isOpen={isOpenError}
        closeModal={() => setIsOpenError(false)}
        description="Gagal menyimpan pengiriman"
        rightButtonText="Tutup"
      />
    </div>
  );
}

export default ResultBuatPengiriman;
