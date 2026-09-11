import { PageButton, TableButton } from './TableUtils'
import React, { useState } from 'react'
import { BsEye, BsPencilSquare } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import { FaCalendarAlt } from 'react-icons/fa'
import BoxesIcon from "../images/boxes.jpg";

export function checkboxPagination({ value }) {
  return <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" checked={value} />
}

export function ActionButtonsPagination({ value }) {
  const navigate = useNavigate()
  const page = value[0] // e.g., 'Customer'
  const id = value[1] // e.g., customerId
  const handleViewDetail = () => {
    if (page === 'Customer') {
      navigate(`/customer/detail/${id}`)
    } else if (page === 'Order') {
      navigate(`/order/detail/${id}`)
    } else if (page === 'Pengiriman') {
      navigate(`/pengiriman/detail/${id}`)
    }
    // Additional cases for other pages as needed
  }

  const handleEdit = () => {
    if (page === 'Customer') {
      navigate(`/customer/edit/${id}`)
    } else if (page === 'Order') {
      navigate(`/order/edit/${id}`)
    }
    // Add other cases for edit pages if needed
  }

  return (
    <div className="flex space-x-[20px]">
      <>
        <BsEye className="cursor-pointer" title={`View Detail ${page}`} onClick={handleViewDetail} />
        <BsPencilSquare className="cursor-pointer" title={`Edit ${page}`} onClick={handleEdit} />
      </>
    </div>
  )
}

export function BaseTablePagination({ columns, data, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, loading, showView = true, showEdit = false, onEdit, judul, showVisualisasiButton = false }) {
  const navigate = useNavigate()
  const [selectedShipments, setSelectedShipments] = useState([])
  const [allChecked, setAllChecked] = useState(false)

  const onViewDetail = (id) => {
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}/${id}`
    navigate(newUrl)
  }

  const onViewVisualisasi = (id) => {
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}/visualisasi/${id}`
    navigate(newUrl)
  }

  const getNestedValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj)

  const handleCheckboxChange = (id) => {
    setSelectedShipments((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSelectAllChange = () => {
    if (allChecked) {
      setSelectedShipments([])
    } else {
      setSelectedShipments(data.map((item) => item.id))
    }
    setAllChecked(!allChecked)
  }

  return (
    <>
      {data.length > 0 ? (
        <>
          <div className="mt-[20px] flex flex-col w-full">
            <div className="overflow-auto">
              <div className="py-2 align-middle inline-block min-w-full">
                <div className="overflow-hidden border-b border-gray-200 rounded-[7px] border border-primary-border">
                  {judul && (
                    <div className="flex justify-between bg-neutral-10 px-5 py-3 items-center rounded-t-[7px] border-b border-primary-border">
                      <p className="font-semibold text-[16px]">{judul}</p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-primary-hover">
                        <tr>
                          {columns.map((column, index) => (
                            <th key={index} scope="col" className={`px-[10px] py-3 text-left text-neutral-10 font-semibold text-[16px] tracking-wider whitespace-nowrap ${column.width} align-middle`}>
                              {column.Header === 'Checkbox' ? <input type="checkbox" checked={allChecked} onChange={handleSelectAllChange} /> : column.Header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-neutral-10 divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <td key={colIndex} className={`px-2 py-3 text-neutral-90 text-left text-m break-words ${column.width || 'max-w-[200px]'}`}>
                                {column.Header === 'No' ? (
                                  (currentPage - 1) * pageSize + rowIndex + 1 // Calculate numbering based on current page and page size
                                ) : column.Header === 'Action' ? (
                                  <div className="space-x-0 flex items-center">
                                    {/* Tombol Visualisasi, dikontrol HANYA oleh `showVisualisasiButton` */}
                                    {showVisualisasiButton && (
                                        <button
                                            className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors mr-2"
                                            onClick={() => onViewVisualisasi(row.id)}
                                            title="Visualisasi Pengiriman"
                                        >
                                            Visualisasi
                                        </button>
                                    )}

                                    {/* Tombol Detail, dikontrol HANYA oleh `showView` */}
                                    {showView && (
                                        <BsEye
                                            className="cursor-pointer text-gray-500 hover:text-blue-500 mr-2"
                                            title="View Detail"
                                            onClick={() => onViewDetail(row.id)}
                                        />
                                    )}

                                    {/* Tombol Edit */}
                                    {showEdit && (
                                        <BsPencilSquare 
                                          className="cursor-pointer text-gray-500 hover:text-blue-500" 
                                          title="Edit" 
                                          onClick={() => onEdit(row.id)} 
                                        />
                                    )}
                                  </div>

                                ) : column.Header === 'Checkbox' ? (
                                  <input type="checkbox" checked={selectedShipments.includes(row.id)} onChange={() => handleCheckboxChange(row.id)} />
                                ) : (
                                  (getNestedValue(row, column.accessor) ?? 'N/A')
                                )}
                                {" "}
                                {column.uom ? getNestedValue(row, column.uom) : null}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <TableButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </TableButton>
                <TableButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </TableButton>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex space-x-2 ml-2 mb-3 mt-2 sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-700">
                    Halaman
                    <span className="font-medium"> {currentPage}</span> dari
                    <span className="font-medium"> {totalPages}</span> | {' Total '} {data.length} | Tampilkan
                  </span>
                  <label>
                    <select className="p-1 block w-full bg-opacity-25 rounded-[8px] border border-primary-hover text-primary-hover font-semibold text-sm" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
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
                    <PageButton className="rounded-[5px]" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                      <span className="sr-only">First</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </PageButton>
                    <PageButton className="rounded-[5px]" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                      <span className="sr-only">Previous</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </PageButton>
                    <PageButton className="rounded-[5px]" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      <span className="sr-only">Next</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </PageButton>
                    <PageButton className="rounded-[5px]" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
                      <span className="sr-only">Last</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </PageButton>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <p className="font-[500]">No Data Available</p>
        </div>
      )}
    </>
  )
}

export function BaseTablePaginationShipment({ columns, data, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, loading, showView = true, judul, showVisualisasiButton = false, setStartDate, setEndDate, startDate, endDate, handleSelectAllChange, selectedData, handleCheckboxChange, totalData, isAllChecked }) {
  const navigate = useNavigate()

  const onViewDetail = (id) => {
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}/${id}`
    navigate(newUrl)
  }

  const onViewVisualisasi = (id) => {
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}/visualisasi/${id}`
    navigate(newUrl)
  }
  
  const getNestedValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj)

  return (
    <>
      <div className="mt-[3px] flex flex-col">
        <div className="overflow-auto">
          <div className="py-2 align-middle inline-block min-w-full">
            <div className="overflow-hidden border-b border-gray-200 rounded-sm">
              <div className="flex justify-between">
                <div className="flex gap-6">
                  <div className="mt-2 mb-2">
                    <p className="font-bold">Start Date</p>
                    <div className="relative w-full cursor-pointer">
                      <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="dd/MM/yyyy" dropdownMode="select" className="border rounded-lg p-2 w-full pl-10 cursor-pointer" placeholderText="Pilih tanggal" />
                      <FaCalendarAlt className="absolute top-2/4 left-3 transform -translate-y-2/4 text-gray-700 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mt-2 mb-2">
                    <p className="font-bold">End Date</p>
                    <div className="relative w-full cursor-pointer">
                      <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="dd/MM/yyyy" dropdownMode="select" className="border rounded-lg p-2 w-full pl-10 cursor-pointer" placeholderText="Pilih tanggal" />
                      <FaCalendarAlt className="absolute top-2/4 left-3 transform -translate-y-2/4 text-gray-700 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <p className="font-semibold text-primary flex items-center justify-center">Total DO Terpilih: {selectedData.length}</p>
              </div>
              {data.length > 0 ? (
                <div className="overflow-x-auto ">
                  <table className="min-w-full ">
                    <thead>
                      <tr className="border-[#1F2937] border-[1.5px]">
                        {columns.map((column, index) =>
                          column.Header === 'Checkbox' ? (
                            <th key={index} className="px-[10px] py-3 text-left text-black font-semibold text-[16px] tracking-wider whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isAllChecked} // Dynamically calculate if all rows on the current page are selected
                                onChange={handleSelectAllChange} // Handle "Select All" logic
                              />
                            </th>
                          ) : (
                            <th key={index} className={`px-[10px] py-3 text-left text-black font-semibold text-[16px] tracking-wider whitespace-nowrap ${column.width}`}>
                              {column.Header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="bg-neutral-10 divide-y divide-gray-200">
                      {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {columns.map((column, colIndex) => (
                            <td key={colIndex} className="px-2 py-3 text-neutral-90 text-left text-m max-w-[100px] break-words">
                              {column.Header === 'Action' ? <div className="flex space-x-2">{showView && <BsEye className="cursor-pointer" title="View Detail" onClick={() => onViewDetail(row.id)} />}</div> : column.Header === 'Checkbox' ? <input type="checkbox" checked={selectedData.includes(row.id)} onChange={() => handleCheckboxChange(row.id)} /> : (getNestedValue(row, column.accessor) ?? 'N/A')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center min-h-[350px] justify-center">
                  <p className="font-[500]">No Data Available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <TableButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </TableButton>
            <TableButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </TableButton>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex space-x-2 ml-2 mb-3 mt-2 sm:items-center sm:justify-between">
              <span className="text-sm text-gray-700">
                Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span> | Total {data.length} | Tampilkan
              </span>
              <label>
                <div className="relative w-full">
                  <select className=" p-2 w-full bg-white rounded-md border border-gray-300 text-gray-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-hover focus:border-primary-hover" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                    <option key={'All'} value={totalData}>
                      All
                    </option>
                  </select>
                </div>
              </label>
            </div>
            <div>
              <nav className="relative mr-1 z-0 inline-flex -space-x-px" aria-label="Pagination">
                <PageButton className="rounded-[5px]" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                  <span className="sr-only">First</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </PageButton>
                <PageButton className="rounded-[5px]" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <span className="sr-only">Previous</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </PageButton>
                <PageButton className="rounded-[5px]" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <span className="sr-only">Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </PageButton>
                <PageButton className="rounded-[5px]" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
                  <span className="sr-only">Last</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </PageButton>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
