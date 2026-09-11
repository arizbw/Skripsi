import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loading } from '../../components/Loading'
import { Modal } from '../../components/Modal'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import { BsArrowLeft, BsCheckCircleFill, BsExclamationCircleFill } from 'react-icons/bs'

// ─── Inline select dropdown ─────────────────────────────────────────────────────
function InlineSelect({ value, options, onChange, placeholder = 'Pilih...', hasError, disabled }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      disabled={disabled}
      className={`w-full border rounded-[4px] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1F54A3] bg-white
        ${hasError ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}
        ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.name}
        </option>
      ))}
    </select>
  )
}

// ─── Inline text input (disabled-only) ─────────────────────────────────────────
function InlineReadonly({ value, placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      readOnly
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-[4px] px-2 py-1.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
    />
  )
}

// ─── Status option list ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'AVAILABLE',        name: 'AVAILABLE' },
  { value: 'ON DELIVERY',      name: 'ON DELIVERY' },
  { value: 'ARCHIVE',          name: 'ARCHIVE' },
  { value: 'OOS - LEGAL',      name: 'OOS - LEGAL' },
  { value: 'OOS - MAINTENANCE',name: 'OOS - MAINTENANCE' },
]

// ─── Map first/second/third status → display string ────────────────────────────
function mapStatusToDisplay(first, second, third) {
  if (first === 'AVAILABLE') return 'AVAILABLE'
  if (second === 'ARCHIVE')    return 'ARCHIVE'
  if (second === 'ON_DELIVERY') return 'ON DELIVERY'
  if (second === 'OOS' && third === 'MAINTENANCE') return 'OOS - MAINTENANCE'
  if (second === 'OOS' && third === 'LEGAL')       return 'OOS - LEGAL'
  if (second === 'MAINTENANCE') return 'OOS - MAINTENANCE'
  if (second === 'LEGAL')       return 'OOS - LEGAL'
  return 'AVAILABLE'
}

// ─── Map display string → API payload fields ────────────────────────────────────
function mapDisplayToPayload(display) {
  switch (display) {
    case 'AVAILABLE':        return { first_status: 'AVAILABLE',   second_status: null,          third_status: null }
    case 'ARCHIVE':          return { first_status: 'UNAVAILABLE', second_status: 'ARCHIVE',      third_status: null }
    case 'ON DELIVERY':      return { first_status: 'UNAVAILABLE', second_status: 'ON_DELIVERY',  third_status: null }
    case 'OOS - MAINTENANCE':return { first_status: 'UNAVAILABLE', second_status: 'OOS',          third_status: 'MAINTENANCE' }
    case 'OOS - LEGAL':      return { first_status: 'UNAVAILABLE', second_status: 'OOS',          third_status: 'LEGAL' }
    default:                 return { first_status: 'AVAILABLE',   second_status: null,           third_status: null }
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────
function BulkUpdateTruk() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const userRole  = localStorage.getItem('userRole')
  const backUrl   = userRole === 'Super' ? '/administrator/truk' : '/truk'

  // Master data
  const [dataTipe, setDataTipe] = useState([])
  const [dataDC,   setDataDC]   = useState([])
  const [masterLoading, setMasterLoading] = useState(true)

  // Rows state
  const [trucks,    setTrucks]    = useState([])
  const [validated, setValidated] = useState(false)

  // Submit state
  const [showLoading,    setShowLoading]    = useState(false)
  const [isOpenConfirm,  setIsOpenConfirm]  = useState(false)
  const [isOpenSuccess,  setIsOpenSuccess]  = useState(false)
  const [isOpenError,    setIsOpenError]    = useState(false)
  const [submitResult,   setSubmitResult]   = useState(null)
  const [errorMsg,       setErrorMsg]       = useState('')

  // ── Load master data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const [typeRes, dcRes] = await Promise.all([
          axiosAuthInstance.get('/truck-types'),
          axiosAuthInstance.get('/dcs'),
        ])
        setDataTipe(typeRes.data.data.map((t) => ({
          value: String(t.id),
          name: t.name,
        })))
        setDataDC(dcRes.data.data.map((d) => ({
          value: String(d.id),
          name: d.name,
        })))
      } catch (e) {
        console.error('Error loading master data:', e)
      } finally {
        setMasterLoading(false)
      }
    }
    fetch()
  }, [])

  // ── Init dari location.state ──────────────────────────────────────────────────
  useEffect(() => {
    if (masterLoading) return
    const stateData = location.state
    if (!stateData) return

    const rawList = Array.isArray(stateData) ? stateData : [stateData]

    const initialized = rawList.map((item, idx) => {
      // Label readonly — resolve nama dari master data
      const typeObj = dataTipe.find((t) => String(t.value) === String(item.type_id))
      const currentDcObj = dataDC.find((d) => String(d.value) === String(item.dc_id))
      const newDcObj     = dataDC.find((d) => String(d.value) === String(item.new_dc_id))

      // Status saat ini (readonly label)
      const currentStatusDisplay = mapStatusToDisplay(
        item.first_status, item.second_status, item.third_status
      )

      // Status baru yang disarankan AI (bisa diedit user)
      let newStatusDisplay = item.new_status
        ? String(item.new_status)
        : currentStatusDisplay

      // Normalise new_status jika AI kirim "AVAILABLE"/"UNAVAILABLE" mentah
      if (!STATUS_OPTIONS.find((s) => s.value === newStatusDisplay)) {
        newStatusDisplay = currentStatusDisplay
      }

      return {
        _id:        idx,
        truck_id:   item.id,
        plate_number: item.plate_number ?? '',
        type_label: typeObj ? typeObj.name : (item.type_id ? String(item.type_id) : '-'),
        volume:     item.max_individual_capacity_volume ?? '-',
        // Editable fields
        dc_id:          newDcObj  ? newDcObj.value  : (currentDcObj ? currentDcObj.value : null),
        display_status: newStatusDisplay,
      }
    })

    setTrucks(initialized)
    window.history.replaceState({}, document.title)
  }, [masterLoading, location.state, dataTipe, dataDC])

  // ── Update field ──────────────────────────────────────────────────────────────
  const updateField = (idx, field, value) => {
    setTrucks((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  // ── Validasi ──────────────────────────────────────────────────────────────────
  const isRowValid = (t) => t.dc_id && t.display_status
  const allValid   = trucks.length > 0 && trucks.every(isRowValid)

  // ── Klik Simpan ───────────────────────────────────────────────────────────────
  const handleSimpan = () => {
    setValidated(true)
    if (!allValid) return
    setIsOpenConfirm(true)
  }

  // ── Submit ke API ─────────────────────────────────────────────────────────────
  const doSubmit = async () => {
    setIsOpenConfirm(false)
    setShowLoading(true)

    const results = { success: 0, failed: 0, errors: [] }

    for (const truck of trucks) {
      const statusPayload = mapDisplayToPayload(truck.display_status)
      const payload = {
        id:     truck.truck_id,
        dc_id:  Number(truck.dc_id),
        ...statusPayload,
      }

      try {
        await axiosAuthInstance.put('/truck', payload)
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(
          `${truck.plate_number}: ${err?.response?.data?.message || err.message}`
        )
      }
    }

    setShowLoading(false)
    setSubmitResult(results)

    if (results.failed === 0) {
      setIsOpenSuccess(true)
    } else {
      setErrorMsg(
        `${results.success} truk berhasil diperbarui, ${results.failed} gagal.\n` +
          results.errors.slice(0, 5).join('\n') +
          (results.errors.length > 5 ? `\n...dan ${results.errors.length - 5} lainnya.` : '')
      )
      setIsOpenError(true)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (masterLoading) return <Loading visibility={true} />

  if (!masterLoading && trucks.length === 0) {
    return (
      <div className="px-[50px] py-[30px]">
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-sm">
          <BsExclamationCircleFill size={40} className="text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-[15px]">
            Tidak ada data truk yang diterima dari AI Assistant.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Coba minta AI untuk memperbarui data truk terlebih dahulu.
          </p>
          <button
            onClick={() => navigate(backUrl)}
            className="mt-6 px-6 py-2 bg-[#1F54A3] text-white rounded-[4px] text-sm font-medium hover:bg-[#184481] transition-colors"
          >
            Kembali ke Daftar Truk
          </button>
        </div>
      </div>
    )
  }

  const validCount   = trucks.filter(isRowValid).length
  const invalidCount = trucks.length - validCount

  return (
    <div className="relative h-full">
      <Loading visibility={showLoading} />

      {/* Modal konfirmasi */}
      <Modal
        variant="primary"
        isOpen={isOpenConfirm}
        closeModal={() => setIsOpenConfirm(false)}
        title="Konfirmasi Perbarui"
        description={`Anda akan memperbarui ${trucks.length} data truk. Pastikan data sudah benar. Lanjutkan?`}
        rightButtonText="Ya, Perbarui Semua"
        onClickRight={doSubmit}
        leftButtonText="Batal"
      />

      {/* Modal sukses */}
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description={`Berhasil memperbarui ${submitResult?.success ?? 0} data truk.`}
        rightButtonText="Selesai"
        onClickRight={() => navigate(backUrl)}
      />

      {/* Modal error */}
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
          <span className="text-gray-600 font-medium">Validasi &amp; Perbarui Truk</span>
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1F3F6E] text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[16px]">Validasi Perubahan Truk</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <BsCheckCircleFill className="text-green-300" />
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <BsExclamationCircleFill className="text-red-300" />
                  <span className="text-white font-semibold">{invalidCount} perlu diperbaiki</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-400 min-w-[140px]">
                    Nomor Plat
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-400 min-w-[140px]">
                    Tipe Kendaraan
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-400 min-w-[120px]">
                    Volume (ml)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Distribution Center <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Status <span className="text-red-500">*</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trucks.map((truck, idx) => {
                  const rowValid  = isRowValid(truck)
                  const showError = validated && !rowValid
                  return (
                    <tr
                      key={truck._id}
                      className={`transition-colors ${showError ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Nomor */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            showError
                              ? 'bg-red-100 text-red-600'
                              : 'bg-[#1F3F6E]/10 text-[#1F3F6E]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Plat — readonly */}
                      <td className="px-3 py-2">
                        <InlineReadonly value={truck.plate_number} placeholder="-" />
                      </td>

                      {/* Tipe — readonly */}
                      <td className="px-3 py-2">
                        <InlineReadonly value={truck.type_label} placeholder="-" />
                      </td>

                      {/* Volume — readonly */}
                      <td className="px-3 py-2">
                        <InlineReadonly value={truck.volume} placeholder="-" />
                      </td>

                      {/* DC — editable */}
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={truck.dc_id}
                          options={dataDC}
                          onChange={(val) => updateField(idx, 'dc_id', val)}
                          placeholder="Pilih DC..."
                          hasError={validated && !truck.dc_id}
                        />
                      </td>

                      {/* Status — editable */}
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={truck.display_status}
                          options={STATUS_OPTIONS}
                          onChange={(val) => updateField(idx, 'display_status', val)}
                          placeholder="Pilih status..."
                          hasError={validated && !truck.display_status}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>
              Total: <strong className="text-gray-700">{trucks.length} truk</strong>
            </span>
            {validated && !allValid && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <BsExclamationCircleFill />
                Masih ada {invalidCount} baris yang belum lengkap
              </span>
            )}
          </div>
        </div>

        {/* Tombol aksi */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate(backUrl)}
            className="px-8 py-2.5 border border-[#1F54A3] text-[#1F54A3] rounded-[4px] text-[14px] font-medium hover:bg-blue-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSimpan}
            disabled={trucks.length === 0}
            className="px-8 py-2.5 bg-[#1F54A3] text-white rounded-[4px] text-[14px] font-medium hover:bg-[#184481] transition-colors disabled:opacity-50"
          >
            Perbarui Semua ({trucks.length} Truk)
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkUpdateTruk
