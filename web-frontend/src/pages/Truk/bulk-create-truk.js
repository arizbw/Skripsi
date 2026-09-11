import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loading } from '../../components/Loading'
import { Modal } from '../../components/Modal'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import { BsArrowLeft, BsCheckCircleFill, BsExclamationCircleFill, BsTrash } from 'react-icons/bs'

// ─── Komponen inline select dropdown ───────────────────────────────────────────
function InlineSelect({ value, options, onChange, placeholder = 'Pilih...', hasError }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className={`w-full border rounded-[4px] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1F54A3] bg-white
        ${hasError ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}
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

// ─── Komponen inline text input ─────────────────────────────────────────────────
function InlineInput({ value, onChange, placeholder, hasError }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      className={`w-full border rounded-[4px] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1F54A3]
        ${hasError ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}
    />
  )
}

// ─── Komponen badge status ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const color =
    status === 'AVAILABLE'
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-yellow-100 text-yellow-700 border-yellow-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {status}
    </span>
  )
}

// ─── Helper konversi status display → first/second/third ──────────────────────
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', name: 'AVAILABLE' },
  { value: 'ON DELIVERY', name: 'ON DELIVERY' },
  { value: 'ARCHIVE', name: 'ARCHIVE' },
  { value: 'OOS - LEGAL', name: 'OOS - LEGAL' },
  { value: 'OOS - MAINTENANCE', name: 'OOS - MAINTENANCE' },
]

function mapStatusToPayload(displayStatus) {
  switch (displayStatus) {
    case 'AVAILABLE':
      return { first_status: 'AVAILABLE', second_status: null, third_status: null }
    case 'ARCHIVE':
      return { first_status: 'UNAVAILABLE', second_status: 'ARCHIVE', third_status: null }
    case 'ON DELIVERY':
      return { first_status: 'UNAVAILABLE', second_status: 'ON_DELIVERY', third_status: null }
    case 'OOS - MAINTENANCE':
      return { first_status: 'UNAVAILABLE', second_status: 'OOS', third_status: 'MAINTENANCE' }
    case 'OOS - LEGAL':
      return { first_status: 'UNAVAILABLE', second_status: 'OOS', third_status: 'LEGAL' }
    default:
      return { first_status: 'AVAILABLE', second_status: null, third_status: null }
  }
}

function mapFirstStatusToDisplay(first_status, second_status, third_status) {
  if (first_status === 'AVAILABLE') return 'AVAILABLE'
  if (second_status === 'ARCHIVE') return 'ARCHIVE'
  if (second_status === 'ON_DELIVERY') return 'ON DELIVERY'
  if (second_status === 'OOS' && third_status === 'MAINTENANCE') return 'OOS - MAINTENANCE'
  if (second_status === 'OOS' && third_status === 'LEGAL') return 'OOS - LEGAL'
  return 'AVAILABLE'
}

// ─── Main Component ─────────────────────────────────────────────────────────────
function BulkCreateTruk() {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = localStorage.getItem('userRole')
  const backUrl = userRole === 'Super' ? '/administrator/truk' : '/truk'

  // Master data dari API
  const [dataTipe, setDataTipe] = useState([])
  const [dataDC, setDataDC] = useState([])
  const [masterLoading, setMasterLoading] = useState(true)

  // Daftar truk (editable)
  const [trucks, setTrucks] = useState([])
  const [validated, setValidated] = useState(false) // apakah user sudah klik simpan dan ada error

  // Submit state
  const [showLoading, setShowLoading] = useState(false)
  const [isOpenConfirm, setIsOpenConfirm] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // ── Load master data (tipe kendaraan & DC) ─────────────────────────────────
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [typeRes, dcRes] = await Promise.all([
          axiosAuthInstance.get('/truck-types'),
          axiosAuthInstance.get('/dcs'),
        ])
        const types = typeRes.data.data.map((t) => ({
          value: String(t.id),
          name: t.name,
          volume: (t.length || 0) * (t.width || 0) * (t.height || 0),
        }))
        const dcs = dcRes.data.data.map((d) => ({
          value: String(d.id),
          name: d.name,
        }))
        setDataTipe(types)
        setDataDC(dcs)
      } catch (err) {
        console.error('Error loading master data:', err)
      } finally {
        setMasterLoading(false)
      }
    }
    fetchMaster()
  }, [])

  // ── Inisialisasi daftar truk dari location.state ───────────────────────────
  useEffect(() => {
    if (masterLoading) return // tunggu master data siap

    const stateData = location.state
    if (!stateData) return

    // state bisa berupa array (bulk) atau object tunggal (single → jadikan array)
    const rawList = Array.isArray(stateData) ? stateData : [stateData]

    const initialized = rawList.map((item, idx) => {
      // Cari type berdasarkan id atau name
      let typeObj = null
      if (item.type_id) {
        typeObj = dataTipe.find(
          (t) => String(t.value) === String(item.type_id) || t.name.toLowerCase() === String(item.type_id).toLowerCase()
        )
      }
      // Cari DC berdasarkan id atau name
      let dcObj = null
      if (item.dc_id) {
        dcObj = dataDC.find(
          (d) => String(d.value) === String(item.dc_id) || d.name.toLowerCase() === String(item.dc_id).toLowerCase()
        )
      }

      const displayStatus = mapFirstStatusToDisplay(
        item.first_status,
        item.second_status,
        item.third_status
      )

      return {
        _id: idx,
        plate_number: item.plate_number || '',
        type_id: typeObj ? typeObj.value : (item.type_id ? String(item.type_id) : null),
        dc_id: dcObj ? dcObj.value : (item.dc_id ? String(item.dc_id) : null),
        display_status: displayStatus,
        max_individual_capacity_volume: item.max_individual_capacity_volume
          ? String(item.max_individual_capacity_volume)
          : (typeObj && typeObj.volume > 0 ? String(typeObj.volume) : ''),
      }
    })

    setTrucks(initialized)
    // Clear state setelah dipakai
    window.history.replaceState({}, document.title)
  }, [masterLoading, location.state, dataTipe, dataDC])

  // ── Update field satu truk ─────────────────────────────────────────────────
  const updateField = (idx, field, value) => {
    setTrucks((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }

      // Kalau tipe berubah, update volume default
      if (field === 'type_id' && value) {
        const foundType = dataTipe.find((t) => t.value === value)
        if (foundType && foundType.volume > 0) {
          updated[idx].max_individual_capacity_volume = String(foundType.volume)
        }
      }
      return updated
    })
  }

  // ── Hapus satu truk dari daftar ─────────────────────────────────────────────
  const removeTruck = (idx) => {
    setTrucks((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Validasi semua baris ────────────────────────────────────────────────────
  const isRowValid = (truck) =>
    truck.plate_number?.trim() && truck.type_id && truck.dc_id && truck.max_individual_capacity_volume && truck.display_status

  const allValid = trucks.length > 0 && trucks.every(isRowValid)

  // ── Klik Simpan ────────────────────────────────────────────────────────────
  const handleSimpan = () => {
    setValidated(true)
    if (!allValid) return
    setIsOpenConfirm(true)
  }

  // ── Submit ke API ───────────────────────────────────────────────────────────
  const doSubmit = async () => {
    setIsOpenConfirm(false)
    setShowLoading(true)

    const results = { success: 0, failed: 0, errors: [] }

    for (const truck of trucks) {
      const statusPayload = mapStatusToPayload(truck.display_status)
      const payload = {
        plate_number: truck.plate_number.trim().toUpperCase(),
        type_id: Number(truck.type_id),
        dc_id: Number(truck.dc_id),
        max_individual_capacity_volume: truck.max_individual_capacity_volume
          ? Number(truck.max_individual_capacity_volume)
          : null,
        ...statusPayload,
      }

      try {
        await axiosAuthInstance.post('/truck', payload)
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(
          `${payload.plate_number}: ${err?.response?.data?.message || err.message}`
        )
      }
    }

    setShowLoading(false)
    setSubmitResult(results)

    if (results.failed === 0) {
      setIsOpenSuccess(true)
    } else {
      setErrorMsg(
        `${results.success} truk berhasil disimpan, ${results.failed} gagal.\n` +
          results.errors.slice(0, 5).join('\n') +
          (results.errors.length > 5 ? `\n...dan ${results.errors.length - 5} lainnya.` : '')
      )
      setIsOpenError(true)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (masterLoading) {
    return <Loading visibility={true} />
  }

  if (!masterLoading && trucks.length === 0) {
    return (
      <div className="px-[50px] py-[30px]">
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-sm">
          <BsExclamationCircleFill size={40} className="text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-[15px]">
            Tidak ada data truk yang diterima dari AI Assistant.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Coba minta AI untuk membuat data truk terlebih dahulu.
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

  const validCount = trucks.filter(isRowValid).length
  const invalidCount = trucks.length - validCount

  return (
    <div className="relative h-full">
      <Loading visibility={showLoading} />

      {/* Modal konfirmasi */}
      <Modal
        variant="primary"
        isOpen={isOpenConfirm}
        closeModal={() => setIsOpenConfirm(false)}
        title="Konfirmasi Simpan"
        description={`Anda akan menyimpan ${trucks.length} data truk baru. Pastikan data sudah benar. Lanjutkan?`}
        rightButtonText="Ya, Simpan Semua"
        onClickRight={doSubmit}
        leftButtonText="Batal"
      />

      {/* Modal sukses */}
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description={`Berhasil menyimpan ${submitResult?.success ?? 0} data truk.`}
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
          <span className="text-gray-600 font-medium">Validasi & Simpan Truk Baru</span>
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1F3F6E] text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[16px]">Validasi Data Truk</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {invalidCount == 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <BsCheckCircleFill className="text-green-300" />
              </div>
              )}
              {invalidCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <BsExclamationCircleFill className="text-red-300" />
                  <span className="text-white font-semibold">{invalidCount} perlu diperbaiki</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabel editable */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Nomor Plat <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Tipe Kendaraan <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Distribution Center <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[140px]">
                    Volume (ml) <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Status <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 w-14">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trucks.map((truck, idx) => {
                  const rowValid = isRowValid(truck)
                  const showError = validated && !rowValid
                  return (
                    <tr
                      key={truck._id}
                      className={`transition-colors ${
                        showError
                          ? 'bg-red-50'
                          : rowValid
                          ? 'hover:bg-gray-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Nomor baris */}
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

                      {/* Nomor Plat */}
                      <td className="px-3 py-2">
                        <InlineInput
                          value={truck.plate_number}
                          onChange={(val) => updateField(idx, 'plate_number', val)}
                          placeholder="B 1234 AB"
                          hasError={validated && !truck.plate_number?.trim()}
                        />
                      </td>

                      {/* Tipe Kendaraan */}
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={truck.type_id}
                          options={dataTipe}
                          onChange={(val) => updateField(idx, 'type_id', val)}
                          placeholder="Pilih tipe..."
                          hasError={validated && !truck.type_id}
                        />
                      </td>

                      {/* DC */}
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={truck.dc_id}
                          options={dataDC}
                          onChange={(val) => updateField(idx, 'dc_id', val)}
                          placeholder="Pilih DC..."
                          hasError={validated && !truck.dc_id}
                        />
                      </td>

                      {/* Volume */}
                      <td className="px-3 py-2">
                        <InlineInput
                          value={truck.max_individual_capacity_volume}
                          onChange={(val) =>
                            updateField(idx, 'max_individual_capacity_volume', val)
                          }
                          placeholder="0"
                          hasError={false}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <InlineSelect
                          value={truck.display_status}
                          options={STATUS_OPTIONS}
                          onChange={(val) => updateField(idx, 'display_status', val)}
                          placeholder="Pilih status..."
                          hasError={validated && !truck.display_status}
                        />
                      </td>

                      {/* Hapus */}
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeTruck(idx)}
                          title="Hapus baris ini"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                          disabled={trucks.length === 1}
                        >
                          <BsTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tabel — ringkasan */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>
              Total:{' '}
              <strong className="text-gray-700">{trucks.length} truk</strong>
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
            className="px-8 py-2.5 bg-[#1F54A3] text-white rounded-[4px] text-[14px] font-medium hover:bg-[#184481] transition-colors disabled:opacity-50"
            disabled={trucks.length === 0}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkCreateTruk
