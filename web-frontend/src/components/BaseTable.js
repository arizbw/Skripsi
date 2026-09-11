import React, { useState, useEffect, forwardRef } from 'react'
import { useTable, useGlobalFilter, useAsyncDebounce, useFilters, useSortBy, usePagination } from 'react-table' // new
import { TableButton, PageButton, classNames } from './TableUtils'
import { Button } from '../components/Button'
import { Link, useNavigate } from 'react-router-dom'
import { BsSearch, BsEye, BsPencilSquare, BsChevronExpand, BsChevronDown, BsChevronUp, BsPlusLg, BsCloudUpload, BsCalendarEvent, BsCheckLg, BsX } from 'react-icons/bs'
import { ModalDetailTruk, ModalDetailLokasi, ModalDetailOrder, ModalDetailUser } from './Modal'
import axiosAuthInstance from '../utils/axios-auth-instance'
import UpdatePengiriman from '../pages/Pengiriman/update-pengiriman'
import DatePicker from 'react-datepicker'

import 'react-datepicker/dist/react-datepicker.css'

// export function GlobalFilter({
//     preGlobalFilteredRows,
//     globalFilter,
//     setGlobalFilter,
// }) {
//     const count = preGlobalFilteredRows.length;
//     const [value, setValue] = React.useState(globalFilter);
//     const onChange = useAsyncDebounce((value) => {
//         setGlobalFilter(value || undefined);
//     }, 200);

//     return (
//         <label className="flex bg-neutral-10 pl-4 px-3 gap-x-[10px] items-baseline rounded-[7px] border border-neutral-40 focus:outline-none">
//             <BsSearch className="text-md text-neutral-60"></BsSearch>
//             <input
//                 type="text"
//                 class="h-[40px] bg-neutral-10 w-full font-[500] text-md rounded-[7px] focus:outline-none"
//                 value={value || ""}
//                 onChange={(e) => {
//                     setValue(e.target.value);
//                     onChange(e.target.value);
//                 }}
//                 placeholder={`Cari..`}
//             />
//         </label>
//     );
// }

// export function AddButtons({ page }) {
//   let navigate = useNavigate();

//   return (
//     <div className="space-x-2">
//       {page === "Pengiriman" ? (
//         <Button
//           className="text-button-m btn-primary"
//           label="Buat Baru"
//           useIcon={true}
//           onClick={() => navigate("/pengiriman/select-order")}
//           icon={<BsPlusLg size={20} />}
//         />
//       ) : null}
//       {page !== "Order" && page !== "Pengiriman" ? (
//         <Button
//           className="text-button-m btn-primary"
//           label="Buat Baru"
//           useIcon={true}
//           onClick={
//             page === "Lokasi"
//               ? () => navigate("/lokasi/create")
//               : page == "Truk"
//               ? () => navigate("/truk/create")
//               : page == "User"
//               ? () => navigate("/user/create")
//               : page == "Role"
//               ? () => navigate("/role/create")
//               : null
//           }
//           icon={<BsPlusLg size={20} />}
//         />
//       ) : null}
//       {page !== "Order" &&
//       page !== "Pengiriman" &&
//       page !== "User" &&
//       page !== "Role" ? (
//         <Button
//           className="text-button-m btn-primary-outline"
//           label="Unggah File"
//           useIcon={true}
//           icon={<BsCloudUpload size={20} />}
//           onClick={
//             page === "Lokasi"
//               ? () => navigate("/lokasi/import")
//               : page == "Truk"
//               ? () => navigate("/truk/import")
//               : null
//           }
//         />
//       ) : null}
//       {page === "Order" ? (
//         <Button
//           className="text-button-m btn-primary"
//           label="Unggah File"
//           useIcon={true}
//           icon={<BsCloudUpload size={20} />}
//           onClick={page == "Order" ? () => navigate("/order/import") : null}
//         />
//       ) : null}
//     </div>
//   );
// }

export function StatusPill({ value, type, key = Date.now() }) {
  return (
    <>
      {type === 'Truk' ? (
        <>
          {value === 'AVAILABLE' ? (
            <div className="w-fit px-2 py-1 bg-success-surface text-success-hover rounded-[7px]">
              <p className="m-p-med">Tersedia</p>
            </div>
          ) : (
            <div className="w-fit px-2 py-1 bg-danger-surface text-danger rounded-[7px]">
              <p className="m-p-med">Tidak Tersedia</p>
            </div>
          )}
        </>
      ) : type === 'Order' ? (
        <>
          {value === 'OPEN' ? (
            <div className="w-fit px-2 py-1 bg-warning-surface text-warning-hover rounded-[7px]">
              <p className="m-p-med">Belum Diproses</p>
            </div>
          ) : value === 'OPTIMIZED' ? (
            <div className="w-fit px-2 py-1 bg-success-surface text-success-hover rounded-[7px]">
              <p className="m-p-med">Teroptimasi</p>
            </div>
          ) : (
            <div className="w-fit px-2 py-1 bg-danger-surface text-danger rounded-[7px]">
              <p className="m-p-med">Tidak Disetujui</p>
            </div>
          )}
        </>
      ) : type === 'Pengiriman' ? (
        <>
          {value === 'DIKIRIM' ? (
            <div className="w-fit px-2 py-1 bg-warning-surface text-warning-hover rounded-[7px]">
              <p className="m-p-med">Dikirim</p>
            </div>
          ) : value === 'SELESAI' ? (
            <div className="w-fit px-2 py-1 bg-success-surface text-success-hover rounded-[7px]">
              <p className="m-p-med">Selesai</p>
            </div>
          ) : (
            <div className="w-fit px-2 py-1 bg-danger-surface text-danger rounded-[7px]">
              <p className="m-p-med">Dibatalkan</p>
            </div>
          )}
        </>
      ) : type === 'Role' ? (
        <>{value === true ? <BsCheckLg className=" text-primary" size={16} /> : <BsX className=" text-danger" size={20} />}</>
      ) : null}
    </>
  )
}

export function Location_name({ value }) {
  const [id, setId] = useState()
  const [lokasiNama, setLokasiNama] = useState('')

  useEffect(() => {
    setId(value)
  }, [])

  useEffect(() => {
    async function fetchDataLokasi() {
      try {
        const response = await axiosAuthInstance.get(`administrator/locations`)
        const responseData = response.data.data

        console.log(responseData)

        const lokasiData = {
          id: responseData.id,
          name: responseData.name,
          address: responseData.address,
          desa_kelurahan: responseData.desa_kelurahan,
          kecamatan: responseData.kecamatan,
          kabupaten_kota: responseData.kabupaten_kota,
          provinsi: responseData.provinsi,
          kode_pos: responseData.kode_pos,
          latitude: responseData.latitude,
          longitude: responseData.longitude,
          company: responseData.company,
          updated_by: responseData.updated_by
        }

        setLokasiNama(lokasiData.name)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchDataLokasi()
  }, [lokasiNama])

  return <p>{lokasiNama}</p>
}

export function ActionButtons({ value, createCluster = false, viewPengiriman = false, refetchData = null }) {
  const navigate = useNavigate()
  const [page, setPage] = useState()
  const [id, setId] = useState(null)
  const userRole = localStorage.getItem('userRole')

  const [isOpenDetail, setIsOpenDetail] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [isOpenDetailTruk, setIsOpenDetailTruk] = useState(false)
  const [isOpenDetailOrder, setIsOpenDetailOrder] = useState(false)
  const [isOpenDetailUser, setIsOpenDetailUser] = useState(false)
  const [isOpenUpdatePengiriman, setIsOpenUpdatePengiriman] = useState(false)
  const [isOpenMoveTruck, setIsOpenMoveTruck] = useState(false)
  const [isOpenDetailRole, setIsOpenDetailRole] = useState(false)
  const openUpdatePengiriman = () => {
    setIsOpenUpdatePengiriman(true)
  }

  const closeUpdatePengiriman = () => {
    setIsOpenUpdatePengiriman(false)
  }

  useEffect(() => {
    setPage(value[0])
    setId(value[1])
  }, [])

  useEffect(() => {
    if (isOpenUpdatePengiriman) {
      setOpenUpdate(true)
    }
  }, [isOpenUpdatePengiriman])

  const [lokasiData, setLokasiData] = useState({
    id: null,
    name: null,
    address: null,
    desa_kelurahan: null,
    kecamatan: null,
    kabupaten_kota: null,
    provinsi: null,
    kode_pos: null,
    latitude: null,
    longitude: null,
    open_hour: null,
    close_hour: null,
    company: null,
    updated_by: null,
    dc: null,
    loc_id: null,
    service_time: null,
    location_type: null,
    dist_to_origin: null
  })

  const [trukData, setTrukData] = useState({
    id: null,
    plate_number: null,
    type: null,
    company_name: null,
    first_status: null,
    second_status: null,
    third_status: null,
    max_capacity_pallet: null,
    max_capacity_volume: null,
    dc: null
  })

  const [orderData, setOrderData] = useState({
    id: null,
    order_num: null,
    description: null,
    volume: null,
    quantity: null,
    status: null,
    eta: null,
    eta_target: null,
    etd: null,
    company: null,
    company_id: null,
    dc: null,
    loc_dest: null,
    loc_dest_id: null,
    loc_ori: null,
    manifest: null
  })

  const [pengirimanData, setPengirimanData] = useState({
    id: null,
    status: null,
    shipment_num: null
  })

  const [roleData, setRoleData] = useState({
    id: null,
    name: null,
    is_allowed_shipment: null,
    is_allowed_order: null,
    is_allowed_location: null,
    is_allowed_truck: null
  })

  const [userData, setUserData] = useState({
    id: null,
    username: null,
    first_name: null,
    last_name: null,
    email: null,
    phone_num: null,
    role: null,
    dc: null,
    company: null,
    is_active: null
  })

  useEffect(() => {
    async function fetchDataLokasi() {
      if (lokasiData.name === null && id !== null && page === 'Lokasi') {
        try {
          const response = await axiosAuthInstance.get(`/location/${id}`)
          const responseData = response.data.data

          const lokasiData = {
            id: responseData.id,
            name: responseData.name,
            address: responseData.address,
            desa_kelurahan: responseData.desa_kelurahan,
            kecamatan: responseData.kecamatan,
            kabupaten_kota: responseData.kabupaten_kota,
            provinsi: responseData.provinsi,
            kode_pos: responseData.kode_pos,
            latitude: responseData.latitude,
            longitude: responseData.longitude,
            open_hour: responseData.open_hour,
            close_hour: responseData.close_hour,
            company: responseData.company,
            updated_by: responseData.updated_by,
            dc: responseData.dc,
            loc_id: responseData.loc_id,
            service_time: responseData.service_time,
            location_type: responseData.location_type,
            dist_to_origin: responseData.dist_to_origin
          }

          setLokasiData(lokasiData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    async function fetchDataTruk() {
      if (trukData.plate_number === null && id !== null && page === 'Truk') {
        try {
          const response = await axiosAuthInstance.get(`truck/${id}`)
          const responseData = response.data.data
          const trukData = {
            id: responseData.id,
            plate_number: responseData.plate_number,
            type: responseData.truck_type,
            first_status: responseData.first_status,
            second_status: responseData.second_status,
            third_status: responseData.third_status,
            max_individual_capacity_volume: responseData.max_individual_capacity_volume,
            dc: responseData.dc.name
          }

          setTrukData(trukData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    async function fetchDataOrder() {
      if (orderData.id === null && id !== null && page === 'Order') {
        try {
          const response = await axiosAuthInstance.get(`/api/order/${id}`)
          const responseData = response.data.data

          const response_company = await axiosAuthInstance.get(`/api/company/${responseData.loc_dest.company_id}`)
          const responseData_company = response_company.data.data

          const orderData = {
            id: responseData.id,
            order_num: responseData.order_num,
            description: responseData.description,
            volume: responseData.volume,
            quantity: responseData.quantity,
            status: responseData.status,
            eta: responseData.eta,
            eta_target: responseData.eta_target,
            etd: responseData.etd,
            dc: responseData.loc_dest.dc.name,
            company_id: responseData.loc_dest.company_id,
            company: responseData_company.name,
            loc_dest: responseData.loc_dest.name,
            loc_dest_id: responseData.loc_dest_id,
            loc_ori: responseData.loc_ori.name,
            manifest: responseData.manifest
          }

          setOrderData(orderData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    async function fetchDataPengiriman() {
      if (pengirimanData.id === null && id !== null && page === 'Pengiriman') {
        try {
          const response = await axiosAuthInstance.get(`/api/shipment/${id}`)
          const responseData = response.data.data

          const pengirimanData = {
            id: responseData.id,
            status: responseData.status,
            shipment_num: responseData.shipment_num
          }

          setPengirimanData(pengirimanData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    async function fetchDataUser() {
      if (userData.id === null && id !== null && page === 'User') {
        try {
          const response = await axiosAuthInstance.get(`/user/${id}`)
          const responseData = response.data.data

          const userData = {
            id: responseData.id,
            username: responseData.username,
            first_name: responseData.first_name,
            last_name: responseData.last_name,
            email: responseData.email,
            phone_num: responseData.phone_num,
            role: responseData.role,
            dc: responseData.dc,
            company: responseData.company,
            is_active: responseData.is_active
          }

          setUserData(userData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    async function fetchDataRole() {
      if (roleData.id === null && id !== null && page === 'Role') {
        try {
          const response = await axiosAuthInstance.get(`administrator/role/${id}`)
          const responseData = response.data.data

          const roleData = {
            id: responseData.id,
            name: responseData.username,
            is_allowed_shipment: responseData.is_allowed_shipment,
            is_allowed_order: responseData.is_allowed_order,
            is_allowed_location: responseData.is_allowed_location,
            is_allowed_truck: responseData.is_allowed_truck
          }

          setRoleData(roleData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    if (page === 'Lokasi') {
      fetchDataLokasi()
    } else if (page === 'Truk') {
      fetchDataTruk()
    } else if (page === 'Order') {
      fetchDataOrder()
    } else if (page === 'Pengiriman') {
      fetchDataPengiriman()
    } else if (page === 'User') {
      fetchDataUser()
    } else if (page === 'Role') {
      fetchDataRole()
    }
  }, [lokasiData, trukData, orderData, pengirimanData, userData, roleData, id])
  let targetUrl = ''
  if (page === 'Lokasi') {
    targetUrl = '/lokasi/update'
  } else if (page === 'Truk') {
    targetUrl = '/truk/update'
  } else if (page === 'Order') {
    targetUrl = '/order/update'
  } else if (page === 'User') {
    targetUrl = '/user/update'
  } else if (page === 'Role') {
    targetUrl = '/role/update'
  }
  return (
    <>
      {lokasiData.id === null ? null : <ModalDetailLokasi isOpen={isOpenDetail} closeModal={() => setIsOpenDetail(false)} lokasi={lokasiData} />}
      {trukData.id === null ? null : <ModalDetailTruk isOpen={isOpenDetailTruk} closeModal={() => setIsOpenDetailTruk(false)} truk={trukData} />}
      {orderData.id === null ? null : <ModalDetailOrder isOpen={isOpenDetailOrder} closeModal={() => setIsOpenDetailOrder(false)} order={orderData} />}

      {userData.id === null ? null : <ModalDetailUser isOpen={isOpenDetailUser} closeModal={() => setIsOpenDetailUser(false)} user={userData} />}
      {pengirimanData.id !== null && openUpdate ? <UpdatePengiriman isOpen={isOpenUpdatePengiriman} closeModal={() => closeUpdatePengiriman()} pengiriman={pengirimanData} fetchData={refetchData} /> : null}

      <div className="flex space-x-[20px]">
        {page !== 'Role' ? (
          <>
            <BsEye
              className="cursor-pointer"
              title={`View Detail ${page}`}
              onClick={
                page === 'Lokasi'
                  ? () => setIsOpenDetail(true)
                  : page == 'Truk'
                    ? () => setIsOpenDetailTruk(true)
                    : page == 'Order'
                      ? () => setIsOpenDetailOrder(true)
                      : page == 'Pengiriman'
                        ? () =>
                            navigate('/pengiriman/detail', {
                              state: {
                                id: id
                              }
                            })
                        : page === 'User'
                          ? () => setIsOpenDetailUser(true)
                          : null
              }
            />
            {page === 'Order' && (orderData.manifest === null || (orderData.manifest && orderData.manifest.status !== 'DIBATALKAN')) && viewPengiriman === true ? <BsPencilSquare className="cursor-pointer" title={`Move ${page}`} onClick={() => setIsOpenMoveTruck(true)} /> : null}
            {page === 'Truk' ? <BsPencilSquare className="cursor-pointer" title={`Edit ${page}`} onClick={() => navigate(userRole === 'Super' ? '/administrator/truk/update' : '/truk/update', { state: { Id: id } })} /> : null}
            {page === 'Lokasi' ? <BsPencilSquare className="cursor-pointer" title={`Edit ${page}`} onClick={() => navigate(userRole === 'Super' ? '/administrator/lokasi/update' : '/lokasi/update', { state: { Id: id } })} /> : null}
          </>
        ) : null}
        {/* {
                    createCluster == false ? 
                        (
                            page != "Order" && page != "Pengiriman" ?
                            <Link to={targetUrl} state={{Id: id}}>
                                <BsPencilSquare className="cursor-pointer" title={`Edit ${page}`}/>
                            </Link>
                            : 
                            page === "Pengiriman" && pengirimanData.status === 'DIKIRIM' ? 
                                <BsPencilSquare className="cursor-pointer" onClick={() => openUpdatePengiriman()} />
                            : 
                            // orderData.status != 'OPTIMIZED'  && orderData.manifest.status != 'DIBATALKAN' && page != "Pengiriman" ?
                            (orderData.status !== 'OPTIMIZED') && 
                            ((orderData.manifest === null) || (orderData.manifest && orderData.manifest.status !== 'DIBATALKAN')) && 
                            (page !== "Pengiriman") ?
                            <Link to={targetUrl} state={{Id: id, CompanyId: orderData.company_id, CompanyName:orderData.company}}>
                                <BsPencilSquare className="cursor-pointer" />
                            </Link>
                            : 
                            null
                        )
                    : null
                } */}
      </div>
    </>
  )
}

function dateFormat(date) {
  const etaDate = new Date(date)
  const year = etaDate.getFullYear()
  const month = String(etaDate.getMonth() + 1).padStart(2, '0')
  const day = String(etaDate.getDate()).padStart(2, '0')
  const formattedETA = `${day}-${month}-${year}`
  return formattedETA
}

export function SelectColumnFilter({ column: { filterValue, setFilter, preFilteredRows, id, render } }) {
  const options = React.useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach((row) => {
      options.add(row.values[id])
    })

    return [...options.values()]
  }, [id, preFilteredRows])

  // Render a multi-select box
  return (
    <>
      <label className="flex gap-x-2 items-baseline">
        {/* <span className="text-gray-700">{render("Header")}: </span> */}
        <select
          className="mt-1 text-filter block w-full rounded-default border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          name={id}
          id={id}
          value={filterValue}
          onChange={(e) => {
            setFilter(e.target.value || undefined)
          }}
        >
          <option value="">{render('Header')}</option>
          {options.map((option, i) => (
            <option key={i} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

export function BaseTable({
  columns,
  data,
  dataLength = 0,
  judul,
  createCluster = false,
  viewPengiriman = false,
  orderDate,
  disablePagination = false // ✅ default false
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state,
    preGlobalFilteredRows
  } = useTable(
    {
      columns,
      data
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    ...(disablePagination ? [] : [usePagination])
  )

  const visibleRows = disablePagination ? rows : page

  return (
    <>
      {dataLength > 0 ? (
        <>
          <div className="mt-[20px] flex flex-col">
            <div className="-my-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="overflow-hidden border-b border-gray-200 rounded-sm">
                  <div className="flex justify-between bg-neutral-10 px-5 py-3 items-center rounded-t-[7px] border border-primary-border">
                    <p className="font-semibold text-[16px]">{judul}</p>
                  </div>
                  <table {...getTableProps()} className="min-w-full">
                    <thead className={!createCluster ? `bg-primary-hover` : null}>
                      {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                          <th className="px-[10px] py-3 text-left text-neutral-10 font-semibold text-[16px] tracking-wider">No</th>
                          {headerGroup.headers.map((column) => (
                            <th
                              {...column.getHeaderProps(column.getSortByToggleProps())}
                              className={!createCluster
                                ? `px-[10px] py-3 text-left text-neutral-10 font-semibold text-[16px] tracking-wider`
                                : `px-[10px] py-3 text-left text-black font-semibold text-[16px] tracking-wider border-[1px] border-primary-border`
                              }
                            >
                              {column.render('Header')}
                              <span>
                                {[
                                  'ID Truk', 'Pelat', 'Tipe', 'DC', 'ID Lokasi', 'Nama Lokasi', 'Alamat Lokasi',
                                  'Nomor Order', 'ETA', 'Tanggal Order', 'Asal', 'Destinasi', 'Volume (ml)',
                                  'Quantity', 'Nama Role', 'Perusahaan'
                                ].includes(column.render('Header')) &&
                                  (column.isSorted
                                    ? column.isSortedDesc
                                      ? <BsChevronDown className="ml-2 inline-block" />
                                      : <BsChevronUp className="ml-2 inline-block" />
                                    : <BsChevronExpand className="ml-2 inline-block" />
                                  )}
                              </span>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody {...getTableBodyProps()} className="bg-neutral-10 divide-y divide-gray-200">
                      {visibleRows.map((row, i) => {
                        prepareRow(row)
                        return (
                          <tr {...row.getRowProps()}>
                            <td className="px-4 py-3 text-neutral-90 max-w-[100px] text-left text-m break-all truncate">{i + 1}</td>
                            {row.cells.map((cell) => (
                              <td {...cell.getCellProps()} className="px-4 py-3 text-neutral-90 max-w-[100px] text-left text-m break-all truncate">
                                {cell.render('Cell')}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {!disablePagination && (
            <div className="py-3 flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex space-x-2 ml-2 mb-3 mt-2 sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-700">
                    Halaman
                    <span className="font-medium"> {state.pageIndex + 1}</span> dari
                    <span className="font-medium"> {pageOptions.length}</span> | {' Total '} {preGlobalFilteredRows.length} | Tampilkan
                  </span>
                  <label>
                    <select
                      className="p-1 block w-full bg-opacity-25 rounded-[8px] border border-primary-hover text-primary-hover font-semibold text-sm"
                      value={state.pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                      }}
                    >
                      {[5, 10, 20, 30].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <nav className="relative mr-1 z-0 inline-flex -space-x-px" aria-label="Pagination">
                    <PageButton onClick={() => gotoPage(0)} disabled={!canPreviousPage} />
                    <PageButton onClick={() => previousPage()} disabled={!canPreviousPage} />
                    <PageButton onClick={() => nextPage()} disabled={!canNextPage} />
                    <PageButton onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} />
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center">
          <p className="font-[500]">Tidak Ada Data</p>
          <p>Belum ada data yang dapat ditampilkan di halaman ini.</p>
        </div>
      )}
    </>
  )
}

export default BaseTable
