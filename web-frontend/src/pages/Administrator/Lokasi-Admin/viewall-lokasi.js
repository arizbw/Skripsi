import React, { useEffect, useState } from 'react';
import { Loading } from '../../../components/Loading';
import axiosAuthInstance from '../../../utils/axios-auth-instance';
import { BaseTablePagination } from '../../../components/BaseTablePagination';
import { SelectColumnFilter, ActionButtons } from '../../../components/BaseTable';
import { Button } from '../../../components/Button';
import { BsPlusLg, BsCloudUpload, BsSearch } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

function ViewAllLokasiAdmin() {
  const [dataLokasi, setDataLokasi] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLocations = async (page, limit) => {
    setLoading(true);
    try {
      const response = await axiosAuthInstance.get(`administrator/locations?skip=${(page - 1) * limit}&limit=${limit}`);
      const { locations, total } = response.data.data;
      setDataLokasi(locations);
      setTotalPages(Math.ceil(total / limit));
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const columns = React.useMemo(() => [
    {
      Header: 'No',
      accessor: 'no',
      Filter: SelectColumnFilter,
      filter: 'includes',
      width: 'w-[60px] min-w-[60px]',
    },
    {
      Header: 'Nama Lokasi',
      accessor: 'name',
      Filter: SelectColumnFilter,
      filter: 'includes',
      width: 'w-[200px] min-w-[180px]',
    },
    {
      Header: 'Alamat Lokasi',
      accessor: 'address',
      Filter: SelectColumnFilter,
      filter: 'includes',
      width: 'w-[450px] min-w-[400px]',
    },
    {
      Header: 'Nama Customer',
      accessor: 'customer.name',
      Filter: SelectColumnFilter,
      filter: 'includes',
      width: 'w-[200px] min-w-[180px]',
    },
    {
      Header: 'Action',
      accessor: (row) => ['Lokasi', row.id],
      Cell: ActionButtons,
      width: 'w-[100px] min-w-[80px]',
    },
  ], []);

  return (
    <div className="h-full min-h-full justify-center">
      <Loading visibility={loading} />

      <div className={`px-[50px] py-[30px] flex flex-col ${loading ? 'hidden' : 'visible'}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-3">
            <Button
              className="bg-[#1F54A3] text-white hover:bg-[#184481] px-4 py-2 rounded-[4px] text-[14px] font-[500]"
              label="Buat baru"
              onClick={() => navigate('/administrator/lokasi/buat')}
              icon={<BsPlusLg size={14} />}
            />
            <Button
              className="bg-white border text-[#1F54A3] hover:bg-neutral-10 border-[#1F54A3] px-4 py-2 rounded-[4px] text-[14px] font-[500]"
              label="Unggah file"
              icon={<BsCloudUpload size={16} />}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari..."
              className="pl-10 pr-4 py-2 w-64 border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#1F54A3] shadow-sm"
            />
          </div>
        </div>

        <BaseTablePagination
          columns={columns}
          data={dataLokasi}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
          showEdit={true}
          onEdit={(id) => navigate('/administrator/lokasi/update', { state: { Id: id } })}
        />
      </div>
    </div>
  );
}

export default ViewAllLokasiAdmin;