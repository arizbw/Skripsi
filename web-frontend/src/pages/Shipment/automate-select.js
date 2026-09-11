import DatePicker from 'react-datepicker'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import 'react-datepicker/dist/react-datepicker.css'
import { BaseTablePaginationShipment } from '../../components/BaseTablePagination'
import { SelectColumnFilter } from '../../components/BaseTable'
import React, { useEffect, useState } from 'react'
import { FaCalendarAlt, FaClipboard } from 'react-icons/fa'
import { Loading } from '../../components/Loading'
import { Modal } from '../../components/Modal'
import jwtDecode from 'jwt-decode'
import { useNavigate, useLocation } from 'react-router-dom'

function DoSelectAutomate() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const navigate = useNavigate()
  const location = useLocation();
  const { optimizationType } = location.state || {};

  const [selectedStartDate, setSelectedStartDate] = useState(new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(0)
  const [showLoading, setShowLoading] = useState(true) // Gunakan hanya satu state loading
  const [loadingMessage, setLoadingMessage] = useState(null)
  const [selectedDO, setSelectedDO] = useState([])
  const [totalData, setTotalData] = useState(0)
  const [dataDO, setDataDO] = useState([])
  const [dc_id, setDcId] = useState("")
  const [isOpenError, setIsOpenError] = useState(false)

  const fetchDO = async (page, limit, start_date, end_date) => {
    try {
      setShowLoading(true)
      const formattedStartDate = new Date(start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const formattedEndDate = new Date(end_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const response = await axiosAuthInstance.get(`/delivery-orders?skip=${(page - 1) * limit}&limit=${limit}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&status=READY`)
      const { deliveryOrders, total } = response.data.data
      setDataDO(deliveryOrders)
      setTotalPages(Math.ceil(total / limit))
      setTotalData(total)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setShowLoading(false)
    }
  }

  const handleOtomatisasi = async () => {
    try {
      setShowLoading(true) // Tampilkan loading saat proses otomatisasi
      if (optimizationType === 'emission') {
        setLoadingMessage("Menghitung emisi... Mohon tunggu, proses ini mungkin memakan waktu beberapa menit.")
      } else {
        setLoadingMessage(null)
      }
      const response = await axiosAuthInstance.post(
        `priority-opt`,
        {
          delivery_orders_id: selectedDO,
          priority: optimizationType
        },
        {
          headers: {
            dc_id: dc_id
          },
          timeout: 600000 // 10 minutes timeout
        }
      );

      console.log('Pengiriman berhasil dibuat:', response.data);
      localStorage.setItem('responseData', JSON.stringify(response.data));
      navigate('/pengiriman/otomatisasi');
    } catch (error) {
      console.error('Gagal membuat pengiriman:', error.response?.data?.message || error.message);
      setIsOpenError(true)
    } finally {
      setShowLoading(false)
      setLoadingMessage(null)
    }
  };


  useEffect(() => {
    setDcId(jwtDecode(sessionStorage.getItem('token')).role.dc_id)
    fetchDO(currentPage, pageSize, selectedStartDate, selectedEndDate)
  }, [currentPage, pageSize, selectedStartDate, selectedEndDate])

  useEffect(() => {
    setSelectedDO([])
  }, [selectedStartDate, selectedEndDate])

  const handleSelectAllChange = () => {
    if (isAllChecked) {
      const currentPageIds = dataDO.map((item) => item.id)
      setSelectedDO((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      const currentPageIds = dataDO.map((item) => item.id)
      setSelectedDO((prev) => [...new Set([...prev, ...currentPageIds])])
    }
  }

  const handleCheckboxChange = (id) => {
    setSelectedDO((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const columns = React.useMemo(
    () => [
      {
        Header: 'Checkbox',
        accessor: 'id',
        Cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedDO.includes(row.original.id)}
            onChange={() => handleCheckboxChange(row.original.id)}
          />
        )
      },
      {
        Header: 'Origin',
        accessor: 'so_origin',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'DO Number',
        accessor: 'delivery_order_num',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'Asal',
        accessor: 'loc_ori.dc.name',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'Destinasi',
        accessor: 'loc_dest.customer.name',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'Status',
        accessor: 'status',
        Filter: SelectColumnFilter,
        filter: 'includes'
      }
    ],
    [selectedDO]
  )

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const isAllChecked = dataDO.every((item) => selectedDO.includes(item.id))

  return (
    <>
      <Loading visibility={showLoading} message={loadingMessage} />
      <Modal
        variant="danger"
        isOpen={isOpenError}
        closeModal={() => setIsOpenError(false)}
        title="Terjadi Kesalahan"
        description="Mohon coba lagi."
        rightButtonText="Tutup"
      />
      <div className={`w-full mx-auto space-y-5 mt-4 pt-10 px-10 ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="w-full bg-white border rounded-lg shadow-md">
          <div className="bg-primary-hover text-white px-4 py-3 rounded-t-lg">
            <h2 className="text-lg font-semibold">Atur Tanggal Pengiriman</h2>
          </div>
          <div className="px-4 py-3">
            <p className="mb-2">Pilih tanggal pengiriman yang akan dilakukan.</p>
            <div className="mt-4">
              <p className="font-bold">Tanggal Pengiriman</p>
              <div className="relative w-full cursor-pointer">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  dropdownMode="select"
                  className="border rounded-lg p-2 w-full pl-10 cursor-pointer"
                  placeholderText="Pilih tanggal"
                />
                <FaCalendarAlt className="absolute top-2/4 left-3 transform -translate-y-2/4 text-gray-700 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-white border rounded-lg shadow-md">
          <div className="bg-primary-hover text-white px-4 py-3 rounded-t-lg">
            <h2 className="text-lg font-semibold">Daftar Delivery Order</h2>
          </div>
          <div className="px-4 py-1">
            <p className="mb-3 mt-3">Pilih DO yang ingin dimasukkan ke dalam pengirman pada tanggal di atas.</p>

            <BaseTablePaginationShipment
              columns={columns}
              data={dataDO}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={showLoading}
              judul={'Daftar Delivery Order'}
              setStartDate={setSelectedStartDate}
              setEndDate={setSelectedEndDate}
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              selectedData={selectedDO}
              totalData={totalData}
              isAllChecked={isAllChecked}
            />
          </div>
        </div>
        <div className="flex justify-end w-full">
          <button
            className="flex items-center px-4 py-2 bg-primary-hover text-white rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleOtomatisasi}
            disabled={selectedDO.length === 0 || !selectedDate || !selectedStartDate || !selectedEndDate}
          >
            <span className="mr-2 text-lg text-white">
              <FaClipboard />
            </span>
            Buat Pengiriman
          </button>
        </div>
      </div>
    </>
  )
}

export default DoSelectAutomate