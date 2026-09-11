import React, { useState, useEffect } from "react";
import GoogleMap from "../../components/GoogleMap";
import { Modal } from "../../components/Modal";
import axiosAuthInstance from '../../utils/axios-auth-instance';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

function DetailPengiriman({ pengiriman, updatePengirimanList }) {
  const navigate = useNavigate();
  const [modalKonfirmasi, setModalKonfirmasi] = useState(false);
  const [isOpenSuccess, setIsOpenSuccess] = useState(false);
  const [isOpenError, setIsOpenError] = useState(false);

  useEffect(() => {
    // DEBUG LOGGING
    if (pengiriman) {
      console.log('=== PENGIRIMAN DATA DEBUG ===');
      console.log('Full pengiriman object:', pengiriman);
      console.log('all_coords exists?', 'all_coords' in pengiriman);
      console.log('all_coords value:', pengiriman.all_coords);
      console.log('all_coords type:', typeof pengiriman.all_coords);
      console.log('all_coords length:', pengiriman.all_coords?.length);
      console.log('location_routes:', pengiriman.location_routes);
      console.log('location_routes length:', pengiriman.location_routes?.length);
      console.log('============================');
    }
  }, [pengiriman]);

  if (!pengiriman) {
    return (
      <div className="w-2/3 bg-white rounded-lg p-6">
        <p className="text-gray-500">Pilih pengiriman untuk melihat detail.</p>
      </div>
    );
  }

  const convertMinutesToHoursAndMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours} Jam ${remainingMinutes} Menit` : `${remainingMinutes} Menit`;
  };

  const handleSimpanPengiriman = async () => {
    try {
      if (pengiriman.shipment_num?.startsWith('DRAF')) {
        await axiosAuthInstance.post('/priority-opt/bulk-save', { shipments: [pengiriman] });
      } else {
        await axiosAuthInstance.patch(`/shipment/simpan/${pengiriman.shipment_num}`, {
          action: 'Simpan'
        });
      }
      updatePengirimanList(pengiriman.shipment_num, 'saved');
      setModalKonfirmasi(false);
      setIsOpenSuccess(true);
    } catch (error) {
      console.error('Gagal menyimpan pengiriman:', error);
      setIsOpenError(true);
    }
  };


  const deliveryOrders = pengiriman.delivery_orders.map(order => ({
    location: order.loc_dest?.customer?.name || 'N/A',
    address: order.loc_dest?.address || 'N/A',
    startTime: "08:00 WIB",
    endTime: "17:00 WIB",
    distance: `${order.loc_ori?.dist_to_origin || 0} Km`,
    arrivalTime: order?.eta || 'N/A',
    departureTime: order?.etd || 'N/A'
  }));

  const locationRoutes = pengiriman.location_routes || [];
  const dos = pengiriman.delivery_orders || [];
  const additionalInfo = pengiriman.additional_info || [];
  const updatedLocationRoutes = locationRoutes.map(route => {
    const matchingDOs = dos.filter(doItem => doItem.loc_dest_id === route.id);

    const loc_do = matchingDOs.map(doItem => doItem.delivery_order_num);
    const boxCounts = matchingDOs.reduce((total, doItem) => {
      return total + (doItem.boxes?.length || 0);
    }, 0);

    return {
      ...route,
      loc_do: loc_do.length > 0 ? loc_do : [],
      box_count: boxCounts,
    };
  });

  // Parse all_coords if it's a string, otherwise use it directly
  let routeCoordinates = [];
  if (pengiriman.all_coords) {
    if (typeof pengiriman.all_coords === 'string') {
      try {
        routeCoordinates = JSON.parse(pengiriman.all_coords);
      } catch (e) {
        console.error('Failed to parse all_coords:', e);
      }
    } else if (Array.isArray(pengiriman.all_coords)) {
      routeCoordinates = pengiriman.all_coords;
    }
  }

  const mapCenter =
    routeCoordinates.length > 0
      ? [routeCoordinates[0][0], routeCoordinates[0][1]]
      : locationRoutes.length > 0
      ? [locationRoutes[0].latitude, locationRoutes[0].longitude]
      : [-6.2257, 106.7612];

  const mapMarkers = locationRoutes.map((route, index) => ({
    lat: route.latitude,
    lng: route.longitude,
    label: index + 1,
    popup: (
      <div>
        <b>{route.is_dc ? route.dc?.name : route.customer?.name}</b>
        <p style={{ margin: '4px 0 0' }}>{route.address}</p>
      </div>
    ),
  }));

  return (
    <div className="w-2/3 space-y-4">
      <div className="bg-neutral-10 rounded-b-md p-6">
        <h2 className="text-lg font-medium mb-4">Peta Rute</h2>
        <div className="h-[400px] bg-gray-100 rounded-lg mb-4">
          <GoogleMap
            center={mapCenter}
            zoom={12}
            height="400px"
            polyline={routeCoordinates}
            markers={mapMarkers}
          />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Informasi Pengiriman</h3>
            <div className="border border-primary-border rounded-lg p-4 grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Nomor Pengiriman</p>
                <p className="text-sm">{pengiriman.shipment_num}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">ETA</p>
                <p className="text-sm">
                  {pengiriman.delivery_orders?.at(-1)?.eta ||
                    pengiriman.additional_info?.at(-1)?.eta ||
                    'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Jarak Tempuh</p>
                <p className="text-sm">{Math.round(pengiriman.total_dist / 1000)} Km</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Waktu Tempuh</p>
                <p className="text-sm">{convertMinutesToHoursAndMinutes(pengiriman.total_time)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Volume Muatan</p>
                <p className="text-sm">
                  {`${(pengiriman.current_capacity || 0).toLocaleString('id-ID')} m³`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Biaya</p>
                <p className="text-sm">
                  {`Rp${(pengiriman.shipment_cost || 0).toLocaleString('id-ID')},00`}
                </p>
              </div>
              {pengiriman.total_emission !== null &&
                pengiriman.total_emission !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Total Emisi CO2</p>
                    <p className="text-sm">
                      {(pengiriman.total_emission / 1000).toFixed(2)} kg
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Informasi Truk</h3>
            <div className="border border-primary-border rounded-lg p-4 grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Nomor Plat</p>
                <p className="text-sm">{pengiriman.truck?.plate_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Distribution Center</p>
                <p className="text-sm">{pengiriman.truck?.dc?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Tipe Truk</p>
                <p className="text-sm">{pengiriman.truck?.truck_type?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Volume Maksimal</p>
                <p className="text-sm">{`${(pengiriman.truck?.max_individual_capacity_volume || 0).toLocaleString('id-ID')} m³`}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Daftar Delivery Order</h3>
            <div className="space-y-4">
              {updatedLocationRoutes.map((route, index) => {
                const isDC = route.is_dc === true;
                return (
                  <div key={index} className="flex items-start gap-4 relative">
                    <div className="min-w-[24px] relative">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white relative z-10">
                        {index + 1}
                      </div>
                      {index < locationRoutes.length - 1 && (
                        <div
                          className="absolute left-1/2 w-0.5 bg-neutral-200"
                          style={{
                            height: '200px',
                            transform: 'translateX(-50%)',
                            top: '20px'
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                      <div className="justify-between mb-2">
                        <div>
                          <h4 className="font-medium">
                            {isDC ? route.dc?.name || 'Distribution Center' : route.customer?.name || 'N/A'}
                          </h4>
                          {!isDC && (
                            <div className="mb-1">
                              <h7 className="font-medium">{route.loc_do.join(", ")}</h7>
                              <div className="text-sm text-gray-600">Jumlah Box: {route.box_count} Box</div>
                            </div>
                          )}
                          {isDC && (
                            <div className="mb-1">
                              <div className="text-sm text-gray-600 italic">Titik Awal Pengiriman</div>
                            </div>
                          )}
                          <div className="text-sm mb-1">
                            <span className="font-normal text-primary">
                              {route.open_hour ? route.open_hour.substring(11, 16) : 'N/A'} - {route.close_hour ? route.close_hour.substring(11, 16) : 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{route.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-right">
                          <div className="text-xs text-neutral-50">Jarak Tempuh</div>
                          <div className="font-medium text-primary">
                            {isDC ? '0 Km' : `${Math.round(additionalInfo[index]?.travel_distance / 1000)} Km`}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-xs text-neutral-50">Waktu Tempuh</div>
                          <div className="font-medium text-primary">
                            {isDC ? '0 Menit' : convertMinutesToHoursAndMinutes(additionalInfo[index]?.travel_time)}
                          </div>
                        </div>
                        <div className="text-sm text-right">
                          <div className="text-xs text-neutral-50">Tiba</div>
                          <div className="font-medium text-primary">{additionalInfo[index]?.eta}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="bg-primary text-white px-4 py-2 rounded-md"
                onClick={() => setModalKonfirmasi(true)} // Show modal on click
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        variant="primary"
        isOpen={modalKonfirmasi}
        closeModal={() => setModalKonfirmasi(false)}
        title="Simpan Pengiriman"
        description="Anda yakin ingin menyimpan pengiriman ini?"
        rightButtonText="Yakin"
        leftButtonText="Batal"
        onClickRight={handleSimpanPengiriman}
      />
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description="Pengiriman berhasil disimpan!"
        rightButtonText="Selesai"
        onClickRight={() => {
          let userRole = '';
          const token = sessionStorage.getItem('token');
          if (token) {
            const decodedToken = jwtDecode(token);
            userRole = decodedToken.role?.name;
          }
          const basePath = userRole === 'Super' ? '/administrator' : '';
          navigate(`${basePath}/pengiriman`);
        }}
      />
      <Modal
        variant="danger"
        isOpen={isOpenError}
        closeModal={() => setIsOpenError(false)}
        description="Terjadi kesalahan saat menyimpan pengiriman"
        rightButtonText="Tutup"
      />
    </div>
  );
}

export default DetailPengiriman;
