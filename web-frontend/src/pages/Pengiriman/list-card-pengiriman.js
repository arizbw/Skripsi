import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import React, { useState } from 'react';

const PengirimanCard = ({ data, onClick, isActive }) => {
  const convertMinutesToHoursAndMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours} Jam ${remainingMinutes} Menit`;
  };

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 mb-0 md:mb-4 m-5 ${isActive ? 'bg-primary shadow-lg' : 'bg-neutral-20 hover:shadow-lg'}`}
      onClick={() => onClick(data.index)}
    >
      <div className="flex items-center mb-3">
        {data.status === 'saved' ? (
          <FiCheckCircle className="w-6 h-6 text-success" />
        ) : (
          <FiArrowRight className="w-6 h-6 rounded-full border-2 text-neutral-400 border-gray-400" />
        )}
        <span className={`ml-2 text-sm md:font-medium ${isActive ? 'text-white' : data.status === 'saved' ? 'text-success' : 'text-neutral-400'}`}>
          {data.status === 'saved' ? 'Tersimpan' : 'Belum Diproses'}
        </span>
      </div>

      <div className="mb-3">
        <p className={`text-sm ${isActive ? 'text-neutral-200' : 'text-neutral-500'}`}>No Pengiriman</p>
        <p className={`text-xl md:font-bold ${isActive ? 'text-white' : 'text-primary-border'}`}>
          {data.shipment_num}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="mb-3">
          <p className={`text-sm ${isActive ? 'text-neutral-200' : 'text-neutral-500'}`}>Truk</p>
          <p className={`text-base ${isActive ? 'text-white' : 'text-primary-border'}`}>
            {data.truck.plate_number}
          </p>
        </div>
        <div className="mb-3">
          <p className={`text-sm ${isActive ? 'text-neutral-200' : 'text-neutral-500'}`}>Total Jarak Tempuh</p>
          <p className={`text-base ${isActive ? 'text-white' : 'text-primary-border'}`}>
            {Math.round(data.total_dist / 1000)} Km
          </p>
        </div>
        <div>
          <p className={`text-sm ${isActive ? 'text-neutral-200' : 'text-neutral-500'}`}>Total Waktu Tempuh</p>
          <p className={`text-base ${isActive ? 'text-white' : 'text-primary-border'}`}>
            {convertMinutesToHoursAndMinutes(data.total_time)}
          </p>
        </div>
        {data.total_emission !== null && data.total_emission !== undefined && (
          <div>
            <p className={`text-sm ${isActive ? 'text-neutral-200' : 'text-neutral-500'}`}>Total Emisi CO2</p>
            <p className={`text-base ${isActive ? 'text-white' : 'text-green-600 font-semibold'}`}>
              {(data.total_emission / 1000).toFixed(2)} kg
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ListHasilPengiriman = ({ onSelect, pengirimanList = [] }) => {
  const [activeCardId, setActiveCardId] = useState(null);

  const handleCardClick = (index) => {
    setActiveCardId(index);
    const selectedData = pengirimanList[index];
    onSelect(selectedData);
  };

  return (
    <div className="bg-gray-50 rounded-b-lg w-1/3">
      <div className="space-y-4">
        {pengirimanList.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Tidak ada data pengiriman</p>
          </div>
        ) : (
          pengirimanList.map((item, index) => (
            <PengirimanCard
              key={index}
              data={{ ...item, index }}
              onClick={handleCardClick}
              isActive={activeCardId === index}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ListHasilPengiriman;
