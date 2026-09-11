import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loading } from '../../components/Loading'
import { Modal } from '../../components/Modal'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import { formatFileSize, getFileExtension, readCSV } from '../../utils/utils'
import {
  BsCloudUpload,
  BsFiletypeCsv,
  BsFiletypeXls,
  BsFiletypeXlsx,
  BsSearch,
  BsChevronExpand,
  BsChevronDown,
  BsChevronUp,
  BsEye,
  BsArrowLeft,
  BsX,
} from 'react-icons/bs'
import * as XLSX from 'xlsx'

function ModalDetailRow({ isOpen, closeModal, row }) {
  if (!isOpen || !row) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h5 className="font-semibold text-[16px] text-[#1F54A3]">Detail Data Truk</h5>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <BsX size={22} />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          {Object.entries(row).map(([key, val]) => (
            <div key={key} className="flex justify-between border-b pb-1 last:border-0">
              <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-gray-800 text-right max-w-[60%]">{String(val ?? '-')}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm bg-[#1F54A3] text-white rounded-[4px] hover:bg-[#184481]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

const COLUMN_MAP = {
  'nomor plat': 'plate_number',
  'plat': 'plate_number',
  'plate_number': 'plate_number',
  'plate number': 'plate_number',
  'tipe kendaraan': 'truck_type',
  'tipe': 'truck_type',
  'truck_type': 'truck_type',
  'type': 'truck_type',
  'dc': 'dc',
  'distribution center': 'dc',
  'volume': 'volume',
  'volume kendaraan': 'volume',
  'max_individual_capacity_volume': 'volume',
  'perusahaan': 'company',
  'company': 'company',
}

function normalizeHeaders(rawRow) {
  const normalized = {}
  Object.keys(rawRow).forEach((key) => {
    const mappedKey = COLUMN_MAP[key.toLowerCase().trim()]
    if (mappedKey) {
      normalized[mappedKey] = rawRow[key]
    } else {
      normalized[key] = rawRow[key]
    }
  })
  return normalized
}

function ImportTruk() {
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole')
  const backUrl = userRole === 'Super' ? '/administrator/truk' : '/truk'

  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef()

  const [parsedRows, setParsedRows] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' })

  const [detailRow, setDetailRow] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [showLoading, setShowLoading] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const [isOpenConfirm, setIsOpenConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitResult, setSubmitResult] = useState(null)

  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return
    const ext = getFileExtension(selectedFile.name)
    let rows = []

    try {
      if (ext === 'csv') {
        const { parsedData } = await readCSV(selectedFile)
        rows = parsedData.map(normalizeHeaders)
      } else if (ext === 'xls' || ext === 'xlsx') {
        const buffer = await selectedFile.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
        rows = raw.map(normalizeHeaders)
      } else {
        alert('Format file tidak didukung. Gunakan CSV, XLS, atau XLSX.')
        return
      }
      setFile(selectedFile)
      setParsedRows(rows)
      setSelectedIds(new Set())
      setPageIndex(0)
    } catch (err) {
      console.error('Error parsing file:', err)
      alert('Gagal membaca file. Pastikan format file benar.')
    }
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) processFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)

  const handleRemoveFile = () => {
    setFile(null)
    setParsedRows([])
    setSelectedIds(new Set())
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const goToStep2 = () => {
    if (!file || parsedRows.length === 0) {
      alert('Silakan pilih file terlebih dahulu.')
      return
    }
    setStep(2)
  }

  const goBackToStep1 = () => {
    setStep(1)
    setSelectedIds(new Set())
    setSearchQuery('')
    setPageIndex(0)
  }

  const filteredRows = React.useMemo(() => {
    if (!searchQuery) return parsedRows
    const q = searchQuery.toLowerCase()
    return parsedRows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [parsedRows, searchQuery])

  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key) return filteredRows
    return [...filteredRows].sort((a, b) => {
      const aVal = String(a[sortConfig.key] ?? '').toLowerCase()
      const bVal = String(b[sortConfig.key] ?? '').toLowerCase()
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredRows, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const pagedRows = sortedRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <BsChevronExpand className="ml-1 inline-block" />
    return sortConfig.dir === 'asc'
      ? <BsChevronUp className="ml-1 inline-block" />
      : <BsChevronDown className="ml-1 inline-block" />
  }

  const allPageSelected =
    pagedRows.length > 0 && pagedRows.every((_, i) => selectedIds.has(pageIndex * pageSize + i))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pagedRows.forEach((_, i) => next.delete(pageIndex * pageSize + i))
      } else {
        pagedRows.forEach((_, i) => next.add(pageIndex * pageSize + i))
      }
      return next
    })
  }

  const toggleRow = (absIdx) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(absIdx) ? next.delete(absIdx) : next.add(absIdx)
      return next
    })
  }

  const selectedRows = [...selectedIds].map((i) => sortedRows[i]).filter(Boolean)

  const handleSimpan = () => {
    if (selectedRows.length === 0) {
      alert('Pilih minimal 1 data truk untuk disimpan.')
      return
    }
    setIsOpenConfirm(true)
  }

  const doSubmit = async () => {
    setIsOpenConfirm(false)
    setShowLoading(true)

    const results = { success: 0, failed: 0, errors: [] }

    for (const row of selectedRows) {
      try {
        // Cari truck_type_id dari API
        const typesResp = await axiosAuthInstance.get('/truck-types')
        const types = typesResp.data.data
        const truckTypeName = String(row.truck_type || '').toUpperCase().replace(' ', '_')
        const matchedType = types.find(
          (t) =>
            t.name === truckTypeName ||
            t.name.toLowerCase() === String(row.truck_type || '').toLowerCase()
        )

        // Cari dc_id dari API
        const dcsResp = await axiosAuthInstance.get('/dcs')
        const dcs = dcsResp.data.data
        const matchedDc = dcs.find(
          (d) => d.name.toLowerCase() === String(row.dc || '').toLowerCase()
        )

        const payload = {
          plate_number: row.plate_number || null,
          type_id: matchedType ? matchedType.id : null,
          dc_id: matchedDc ? matchedDc.id : null,
          max_individual_capacity_volume: row.volume ? Number(row.volume) : null,
          first_status: 'AVAILABLE',
          second_status: null,
          third_status: null,
        }

        if (!payload.plate_number || !payload.type_id || !payload.dc_id) {
          results.failed++
          results.errors.push(`${row.plate_number || '?'}: data tidak lengkap`)
          continue
        }

        await axiosAuthInstance.post('/truck', payload)
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(
          `${row.plate_number || '?'}: ${err?.response?.data?.message || err.message}`
        )
      }
    }

    setShowLoading(false)
    setSubmitResult(results)

    if (results.failed === 0) {
      setIsOpenSuccess(true)
    } else {
      setErrorMsg(
        `${results.success} berhasil, ${results.failed} gagal.\n` +
          results.errors.slice(0, 5).join('\n') +
          (results.errors.length > 5 ? `\n...dan ${results.errors.length - 5} lainnya.` : '')
      )
      setIsOpenError(true)
    }
  }

  const DISPLAY_COLS = ['plate_number', 'truck_type', 'company', 'dc']
  const HEADERS = {
    plate_number: 'Nomor Plat',
    truck_type: 'Tipe Kendaraan',
    company: 'Perusahaan',
    dc: 'DC',
  }

  // determine which columns to show based on what's in data
  const displayCols = DISPLAY_COLS.filter(
    (col) => parsedRows.length === 0 || parsedRows.some((r) => r[col] !== undefined)
  )

  const fileExt = file ? getFileExtension(file.name) : ''

  return (
    <div className="relative h-full">
      <Loading visibility={showLoading} />

      {/* Modals */}
      <Modal
        variant="primary"
        isOpen={isOpenConfirm}
        closeModal={() => setIsOpenConfirm(false)}
        title="Konfirmasi Import"
        description={`Anda akan menyimpan ${selectedRows.length} data truk. Lanjutkan?`}
        rightButtonText="Ya, Simpan"
        onClickRight={doSubmit}
        leftButtonText="Batal"
      />
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description={`Berhasil menyimpan ${submitResult?.success ?? 0} data truk.`}
        rightButtonText="Selesai"
        onClickRight={() => navigate(backUrl)}
      />
      <Modal
        variant="danger"
        isOpen={isOpenError}
        closeModal={() => setIsOpenError(false)}
        description={errorMsg}
        rightButtonText="Tutup"
        onClickRight={() => {
          setIsOpenError(false)
          if (submitResult?.success > 0) navigate(backUrl)
        }}
      />

      <ModalDetailRow
        isOpen={isDetailOpen}
        closeModal={() => setIsDetailOpen(false)}
        row={detailRow}
      />

      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => navigate(backUrl)}
            className="flex items-center gap-1 text-[#1F54A3] hover:underline font-medium"
          >
            <BsArrowLeft size={14} />
            Daftar Truk
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium">Unggah Data Truk</span>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#1F3F6E] text-white px-6 py-4">
              <h3 className="font-semibold text-[16px]">1. &nbsp; Unggah File</h3>
            </div>

            <div className="p-8">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center py-16 
                  ${isDragging
                    ? 'border-[#1F54A3] bg-blue-50'
                    : 'border-[#1F54A3] bg-gray-50 hover:bg-blue-50'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <BsCloudUpload size={36} className="text-[#1F54A3] mb-3" />
                <p className="text-gray-600 font-medium">Klik untuk unggah file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Format yang didukung: CSV, XLS, XLSX</p>

              {/* File terpilih */}
              {file && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">File terpilih:</p>
                  <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-3">
                    {fileExt === 'csv' ? (
                      <BsFiletypeCsv size={32} className="text-green-600 shrink-0" />
                    ) : fileExt === 'xls' ? (
                      <BsFiletypeXls size={32} className="text-green-700 shrink-0" />
                    ) : (
                      <BsFiletypeXlsx size={32} className="text-green-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus file"
                    >
                      <BsX size={20} />
                    </button>
                  </div>
                  {parsedRows.length > 0 && (
                    <p className="text-xs text-[#1F54A3] mt-1">
                      {parsedRows.length} baris data terdeteksi
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#1F3F6E] text-white px-6 py-4">
              <h3 className="font-semibold text-[16px]">2. &nbsp; Pilih Data</h3>
            </div>

            <div className="p-6">
              {/* Search + counter */}
              <div className="flex justify-between items-center mb-3">
                <div />
                <div className="relative">
                  <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPageIndex(0) }}
                    className="pl-9 pr-4 py-2 w-56 border rounded-[4px] text-sm focus:outline-none focus:ring-1 focus:ring-[#1F54A3] shadow-sm"
                  />
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-[#1F54A3] mb-2">
                #{selectedIds.size} Truk Terpilih
              </div>

              {/* Table */}
              <div className="overflow-x-auto border rounded-[4px]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          className="accent-[#1F54A3] w-4 h-4 cursor-pointer"
                        />
                      </th>
                      {displayCols.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                          onClick={() => handleSort(col)}
                        >
                          {HEADERS[col] || col}
                          <SortIcon colKey={col} />
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td colSpan={displayCols.length + 2} className="text-center py-8 text-gray-400">
                          Tidak ada data yang cocok
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((row, i) => {
                        const absIdx = pageIndex * pageSize + i
                        const isChecked = selectedIds.has(absIdx)
                        return (
                          <tr
                            key={absIdx}
                            className={`transition-colors ${isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleRow(absIdx)}
                                className="accent-[#1F54A3] w-4 h-4 cursor-pointer"
                              />
                            </td>
                            {displayCols.map((col) => (
                              <td key={col} className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                                {row[col] ?? '-'}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <button
                                title="Lihat detail"
                                onClick={() => { setDetailRow(row); setIsDetailOpen(true) }}
                                className="text-gray-500 hover:text-[#1F54A3] transition-colors"
                              >
                                <BsEye size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>
                    Halaman {pageIndex + 1} dari {totalPages} &nbsp;|&nbsp;{' '}
                    {pageIndex * pageSize + 1} - {Math.min((pageIndex + 1) * pageSize, sortedRows.length)} dari {sortedRows.length}
                    &nbsp;&nbsp; Tampilkan
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0) }}
                    className="border rounded-[4px] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1F54A3] text-[#1F54A3] font-semibold"
                  >
                    {[5, 10, 20, 30].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <PagButton onClick={() => setPageIndex(0)} disabled={pageIndex === 0} label="«" />
                  <PagButton onClick={() => setPageIndex((p) => p - 1)} disabled={pageIndex === 0} label="‹" />
                  <PagButton onClick={() => setPageIndex((p) => p + 1)} disabled={pageIndex >= totalPages - 1} label="›" />
                  <PagButton onClick={() => setPageIndex(totalPages - 1)} disabled={pageIndex >= totalPages - 1} label="»" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Buttons ── */}
        <div className="flex justify-center gap-4 mt-8">
          {step === 1 ? (
            <>
              <button
                onClick={() => navigate(backUrl)}
                className="px-6 py-2 border border-[#1F54A3] text-[#1F54A3] rounded-[4px] text-[14px] font-medium hover:bg-blue-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={goToStep2}
                disabled={!file || parsedRows.length === 0}
                className="px-6 py-2 bg-[#1F54A3] text-white rounded-[4px] text-[14px] font-medium hover:bg-[#184481] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut
              </button>
            </>
          ) : (
            <>
              <button
                onClick={goBackToStep1}
                className="px-6 py-2 border border-[#1F54A3] text-[#1F54A3] rounded-[4px] text-[14px] font-medium hover:bg-blue-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleSimpan}
                className="px-6 py-2 bg-[#1F54A3] text-white rounded-[4px] text-[14px] font-medium hover:bg-[#184481] transition-colors"
              >
                Simpan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PagButton({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center border rounded-[4px] text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
    >
      {label}
    </button>
  )
}

export default ImportTruk
