import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import { Loading } from '../../components/Loading'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FaCalendarAlt, FaTrash, FaPlus, FaSave } from 'react-icons/fa'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { Dropdown } from '../../components/Dropdown'
import { Modal } from '../../components/Modal'
import jwtDecode from 'jwt-decode'

function CreateDO() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLoading, setShowLoading] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isOpenWarning, setIsOpenWarning] = useState(false)
  const [warningDescription, setWarningDescription] = useState('')
  const [isOpenError, setIsOpenError] = useState(false)
  const [errorDescription, setErrorDescription] = useState('')

  // Master Data
  const [dcs, setDcs] = useState([])
  const [customers, setCustomers] = useState([])
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])

  // Form State
  const [soOrigin, setSoOrigin] = useState('')
  const [doNum, setDoNum] = useState('')
  const [etaTarget, setEtaTarget] = useState(new Date())

  const statusOptions = [
    { value: 'READY', name: 'READY' },
    { value: 'RUNNING', name: 'RUNNING' },
    { value: 'PENDING', name: 'PENDING' },
    { value: 'DONE', name: 'DONE' },
    { value: 'IN_CALCULATION', name: 'IN_CALCULATION' }
  ]
  const [statusDropdown, setStatusDropdown] = useState(statusOptions[0])
  const [dcDropdown, setDcDropdown] = useState(null)
  const [customerDropdown, setCustomerDropdown] = useState(null)
  
  const tokenFromSession = sessionStorage.getItem('token')
  const decodedToken = tokenFromSession ? jwtDecode(tokenFromSession) : null
  const userRole = decodedToken?.role?.name
  const userDcId = decodedToken?.role?.dc_id

  const [productLines, setProductLines] = useState([
    { product_id: '', volume: 0, weight: 0, price: 0, quantity: 1, unit_volume: 'm3', unit_weight: 'kg', unit_price: 'Rp', unit_quantity: 'pcs' }
  ])

  // Track whether master data has been loaded to apply prefill
  const [masterDataLoaded, setMasterDataLoaded] = useState(false)

  useEffect(() => {
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    setShowLoading(true)
    try {
      const [resDcs, resCustomers, resLocations, resProducts] = await Promise.all([
        axiosAuthInstance.get('/dcs'),
        axiosAuthInstance.get('/customers?limit=1000'),
        axiosAuthInstance.get('/locations?limit=1000'),
        axiosAuthInstance.get('/products?limit=1000')
      ])

      const dcsData = resDcs.data.data.map(d => ({ value: d.id, name: d.name }))
      const customersData = (resCustomers.data.data.customers || []).map(c => ({ value: c.id, name: c.name, Location: c.Location }))
      const locsData = resLocations.data.data.locations || []

      if (userRole !== 'Super' && userDcId) {
        const adminDc = dcsData.find(d => parseInt(d.value) === parseInt(userDcId))
        if (adminDc) {
          setDcDropdown(adminDc)
          setDcs([adminDc])
        }
      } else {
        setDcs(dcsData)
      }

      setCustomers(customersData)
      setLocations(locsData)
      setProducts(resProducts.data.data.product || [])
      setMasterDataLoaded(true)
    } catch (error) {
      setErrorDescription('Gagal memuat data')
      setIsOpenError(true)
    } finally {
      setShowLoading(false)
    }
  }

  // Prefill from AI state (manage_delivery_order PREFILL action)
  useEffect(() => {
    if (!masterDataLoaded) return
    const aiState = location.state
    if (!aiState) return

    if (aiState.so_origin) setSoOrigin(aiState.so_origin)
    if (aiState.delivery_order_num) setDoNum(aiState.delivery_order_num)
    if (aiState.eta_target) setEtaTarget(new Date(aiState.eta_target))
    if (aiState.status) {
      const statusOpt = statusOptions.find(s => s.value === aiState.status)
      if (statusOpt) setStatusDropdown(statusOpt)
    }
    if (aiState.dc_id) {
      // dcs is available after masterDataLoaded; if userRole != Super, dcs is single-item
      setDcs(prev => {
        const found = prev.find(d => parseInt(d.value) === parseInt(aiState.dc_id))
        if (found && userRole === 'Super') setDcDropdown(found)
        return prev
      })
      // For Super role, do an additional lookup from the full list
      axiosAuthInstance.get('/dcs').then(res => {
        const all = res.data.data.map(d => ({ value: d.id, name: d.name }))
        const found = all.find(d => parseInt(d.value) === parseInt(aiState.dc_id))
        if (found) setDcDropdown(found)
      }).catch(() => {})
    }
    if (aiState.customer_id) {
      axiosAuthInstance.get('/customers?limit=1000').then(res => {
        const all = (res.data.data.customers || []).map(c => ({ value: c.id, name: c.name, Location: c.Location }))
        const found = all.find(c => parseInt(c.value) === parseInt(aiState.customer_id))
        if (found) setCustomerDropdown(found)
      }).catch(() => {})
    }
    if (aiState.product_lines && Array.isArray(aiState.product_lines) && aiState.product_lines.length > 0) {
      setProductLines(aiState.product_lines.map(pl => ({
        product_id: String(pl.product_id || ''),
        volume: pl.volume ?? 0,
        weight: pl.weight ?? 0,
        price: pl.price ?? 0,
        quantity: pl.quantity ?? 1,
        unit_volume: 'm3',
        unit_weight: 'kg',
        unit_price: 'Rp',
        unit_quantity: 'pcs'
      })))
    }
  }, [masterDataLoaded])

  const handleAddProductLine = () => {
    setProductLines([
      ...productLines,
      { product_id: '', volume: 0, weight: 0, price: 0, quantity: 1, unit_volume: 'm3', unit_weight: 'kg', unit_price: 'Rp', unit_quantity: 'pcs' }
    ])
  }

  const handleRemoveProductLine = (index) => {
    const newLines = [...productLines]
    newLines.splice(index, 1)
    setProductLines(newLines)
  }

  const handleProductLineChange = (index, field, value) => {
    const newLines = [...productLines]
    newLines[index][field] = value
    setProductLines(newLines)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!soOrigin || !doNum || !etaTarget || !dcDropdown || !customerDropdown) {
      setWarningDescription('Mohon lengkapi semua field utama')
      setIsOpenWarning(true)
      return
    }

    if (productLines.length === 0 || productLines.some(pl => !pl.product_id)) {
      setWarningDescription('Mohon lengkapi data produk muatan')
      setIsOpenWarning(true)
      return
    }

    const payload = {
      so_origin: soOrigin,
      delivery_order_num: doNum,
      eta_target: etaTarget.toISOString(),
      status: statusDropdown.value,
      dc_id: parseInt(dcDropdown.value),
      customer_id: parseInt(customerDropdown.value),
      productLines: productLines.map(pl => ({
        product_id: parseInt(pl.product_id),
        volume: parseFloat(pl.volume),
        weight: parseFloat(pl.weight),
        price: parseFloat(pl.price),
        quantity: parseFloat(pl.quantity),
        unit_volume: pl.unit_volume,
        unit_weight: pl.unit_weight,
        unit_price: pl.unit_price,
        unit_quantity: pl.unit_quantity
      }))
    }

    setShowLoading(true)
    try {
      await axiosAuthInstance.post('/delivery-orders', payload)
      setIsOpenSuccess(true)
    } catch (error) {
      setErrorDescription(error.response?.data?.message || 'Gagal membuat Delivery Order')
      setIsOpenError(true)
    } finally {
      setShowLoading(false)
    }
  }

  // Get addresses for display
  const originAddress = dcDropdown ? (locations.find(l => l.dc_id === parseInt(dcDropdown.value) && l.is_dc === true)?.address || '-') : '-'
  const destAddress = customerDropdown ? (customerDropdown.Location?.[0]?.address || locations.find(l => l.customer_id === parseInt(customerDropdown.value))?.address || '-') : '-'

  return (
    <>
      <Loading visibility={showLoading} />
      <Modal
        variant="primary"
        isOpen={isOpenSuccess}
        closeModal={() => setIsOpenSuccess(false)}
        description="Berhasil membuat Delivery Order baru"
        rightButtonText="Selesai"
        onClickRight={() => navigate('/delivery-order')}
      />
      <Modal
        variant="warning"
        isOpen={isOpenWarning}
        closeModal={() => setIsOpenWarning(false)}
        description={warningDescription}
        rightButtonText="Tutup"
      />
      <Modal
        variant="danger"
        isOpen={isOpenError}
        closeModal={() => setIsOpenError(false)}
        description={errorDescription}
        rightButtonText="Tutup"
      />
      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="p-8 bg-white rounded-lg">
          <h4>Masukan Data Delivery Order</h4>

        <form onSubmit={handleSubmit} className="pt-4 space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Informasi Utama</h2>
              
              <TextField 
                label="Dokumen SO (SO Origin)" 
                placeholder="Contoh: SO-001" 
                required={true} 
                className="w-full" 
                value={soOrigin} 
                onChange={e => setSoOrigin(e.target.value)} 
              />
              
              <TextField 
                label="Nomor DO" 
                placeholder="Contoh: DO-001" 
                required={true} 
                className="w-full" 
                value={doNum} 
                onChange={e => setDoNum(e.target.value)} 
              />
              
              <div className="sm:col-span-3 p-2">
                <label className="block m-p-med leading-6">Target ETA <span className="text-danger">*</span></label>
                <div className="relative w-full cursor-pointer mt-1">
                  <DatePicker
                    selected={etaTarget}
                    onChange={(date) => setEtaTarget(date)}
                    dateFormat="dd/MM/yyyy HH:mm"
                    className="block min-w-[25%] rounded-md border-0 py-2 px-2 pl-10 m-p-reg shadow-sm ring-1 ring-inset ring-neutral-40 focus:ring-1 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 w-full cursor-pointer"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                  />
                  <FaCalendarAlt className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <Dropdown 
                label="Status Awal" 
                data={statusOptions} 
                required={true} 
                className="w-full" 
                value={statusDropdown} 
                onChange={setStatusDropdown} 
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Lokasi</h2>
              
              <div>
                <Dropdown 
                  label="Asal (Distribution Center)" 
                  placeholder="-- Pilih DC --" 
                  data={dcs} 
                  required={true} 
                  className={`w-full ${userRole !== 'Super' ? 'bg-gray-100' : ''}`} 
                  value={dcDropdown} 
                  onChange={setDcDropdown}
                  disabled={userRole !== 'Super'}
                />
              </div>

              <div>
                <Dropdown 
                  label="Tujuan (Customer)" 
                  placeholder="-- Pilih Customer --" 
                  data={customers} 
                  required={true} 
                  className="w-full" 
                  value={customerDropdown} 
                  onChange={setCustomerDropdown} 
                />
                <p className="text-xs text-gray-500 mt-1 pl-2">Alamat: {destAddress}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Tabel Muatan (Produk)</h2>
              <button type="button" onClick={handleAddProductLine} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2">
                <FaPlus /> Tambah Produk
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 border-r w-[250px]">Produk</th>
                    <th className="p-2 border-r">Kuantitas</th>
                    <th className="p-2 border-r">Volume Total (m3)</th>
                    <th className="p-2 border-r">Berat Total (kg)</th>
                    <th className="p-2 border-r">Total Harga (Rp)</th>
                    <th className="p-2 w-[50px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {productLines.map((pl, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 border-r">
                        <select required className="w-full border rounded p-1" value={pl.product_id} onChange={(e) => handleProductLineChange(idx, 'product_id', e.target.value)}>
                          <option value="">-- Pilih --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <input required type="number" min="1" step="any" className="w-full border rounded p-1" value={pl.quantity} onChange={(e) => handleProductLineChange(idx, 'quantity', e.target.value)} />
                      </td>
                      <td className="p-2 border-r">
                        <input required type="number" min="0" step="any" className="w-full border rounded p-1" value={pl.volume} onChange={(e) => handleProductLineChange(idx, 'volume', e.target.value)} />
                      </td>
                      <td className="p-2 border-r">
                        <input required type="number" min="0" step="any" className="w-full border rounded p-1" value={pl.weight} onChange={(e) => handleProductLineChange(idx, 'weight', e.target.value)} />
                      </td>
                      <td className="p-2 border-r">
                        <input required type="number" min="0" step="any" className="w-full border rounded p-1" value={pl.price} onChange={(e) => handleProductLineChange(idx, 'price', e.target.value)} />
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveProductLine(idx)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={productLines.length <= 1}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productLines.length === 0 && (
                <p className="text-center py-4 text-gray-500 border border-t-0">Belum ada muatan. Silakan tambah produk.</p>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate(-1)} />
            <Button className="text-button btn-primary" label="Simpan" onClick={handleSubmit} />
          </div>
        </form>
        </div>
      </div>
    </>
  )
}

export default CreateDO
