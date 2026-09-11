import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import { Loading } from '../../components/Loading'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FaCalendarAlt } from 'react-icons/fa'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { Dropdown } from '../../components/Dropdown'
import { Modal } from '../../components/Modal'

function EditDO() {
  const navigate = useNavigate()
  const { doId } = useParams()
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

  const [productLines, setProductLines] = useState([])

  const location = useLocation()

  useEffect(() => {
    fetchMasterAndDO()
  }, [])

  const fetchMasterAndDO = async () => {
    setShowLoading(true)
    // Simpan AI prefill state sebelum apapun (bisa hilang setelah navigation)
    const aiState = location.state || null
    try {
      const [resDcs, resCustomers, resLocations, resProducts, resDo] = await Promise.all([
        axiosAuthInstance.get('/dcs'),
        axiosAuthInstance.get('/customers?limit=1000'),
        axiosAuthInstance.get('/locations?limit=1000'),
        axiosAuthInstance.get('/products?limit=1000'),
        axiosAuthInstance.get(`/delivery-order/${doId}`)
      ])

      const dcsData = resDcs.data.data.map(d => ({ value: d.id, name: d.name }))
      const customersData = (resCustomers.data.data.customers || []).map(c => ({ value: c.id, name: c.name, Location: c.Location }))
      const locsData = resLocations.data.data.locations || []
      const prodsData = resProducts.data.data.product || []

      setDcs(dcsData)
      setCustomers(customersData)
      setLocations(locsData)
      setProducts(prodsData)

      // Set DO Data dari database
      const doData = resDo.data.data
      setSoOrigin(doData.so_origin || '')
      setDoNum(doData.delivery_order_num || '')
      if (doData.eta_target) setEtaTarget(new Date(doData.eta_target))
      
      // Status: gunakan prefill AI jika ada, otherwise dari DO asli
      const aiStatus = aiState?.status
      if (aiStatus) {
        const statusOpt = statusOptions.find(s => s.value === aiStatus)
        if (statusOpt) setStatusDropdown(statusOpt)
      } else {
        const statusOpt = statusOptions.find(s => s.value === doData.status) || statusOptions[0]
        setStatusDropdown(statusOpt)
      }

      // Find original DC from loc_ori (tidak bisa diubah)
      if (doData.loc_ori && doData.loc_ori.dc_id) {
        const dcOpt = dcsData.find(d => d.value === doData.loc_ori.dc_id)
        if (dcOpt) setDcDropdown(dcOpt)
      } else if (doData.loc_ori_id) {
        const loc = locsData.find(l => l.id === doData.loc_ori_id)
        if (loc && loc.dc_id) {
          const dcOpt = dcsData.find(d => d.value === loc.dc_id)
          if (dcOpt) setDcDropdown(dcOpt)
        }
      }

      // Customer: gunakan prefill AI jika ada, otherwise dari DO asli
      const aiCustomerId = aiState?.customer_id
      if (aiCustomerId) {
        const found = customersData.find(c => parseInt(c.value) === parseInt(aiCustomerId))
        if (found) setCustomerDropdown(found)
      } else {
        if (doData.loc_dest && doData.loc_dest.customer_id) {
          const custOpt = customersData.find(c => c.value === doData.loc_dest.customer_id)
          if (custOpt) setCustomerDropdown(custOpt)
        } else if (doData.loc_dest_id) {
          const loc = locsData.find(l => l.id === doData.loc_dest_id)
          if (loc && loc.customer_id) {
            const custOpt = customersData.find(c => c.value === loc.customer_id)
            if (custOpt) setCustomerDropdown(custOpt)
          }
        }
      }

      // Set product lines
      if (doData.ProductLine) {
        setProductLines(doData.ProductLine.map(pl => ({
          product_id: pl.product_id,
          volume: pl.volume,
          weight: pl.weight,
          price: pl.price,
          quantity: pl.quantity
        })))
      }

    } catch (error) {
      setErrorDescription('Gagal memuat data Delivery Order')
      setIsOpenError(true)
    } finally {
      setShowLoading(false)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customerDropdown) {
      setWarningDescription('Mohon pilih Tujuan (Customer)')
      setIsOpenWarning(true)
      return
    }

    const payload = {
      status: statusDropdown.value,
      customer_id: parseInt(customerDropdown.value)
    }

    setShowLoading(true)
    try {
      await axiosAuthInstance.put(`/delivery-orders/${doId}`, payload)
      setIsOpenSuccess(true)
    } catch (error) {
      setErrorDescription(error.response?.data?.message || 'Gagal memperbarui Delivery Order')
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
        description="Berhasil memperbarui Delivery Order"
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
          <h4>Edit Data Delivery Order</h4>

        <form onSubmit={handleSubmit} className="pt-4 space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Informasi Utama</h2>
              
              <TextField 
                label="Dokumen SO (SO Origin)" 
                required={true} 
                className="w-full bg-gray-100" 
                value={soOrigin} 
                disabled={true}
                onChange={() => {}}
              />
              
              <TextField 
                label="Nomor DO" 
                required={true} 
                className="w-full bg-gray-100" 
                value={doNum} 
                disabled={true}
                onChange={() => {}}
              />
              
              <div className="sm:col-span-3 p-2">
                <label className="block m-p-med leading-6">Target ETA</label>
                <div className="relative w-full mt-1">
                  <DatePicker
                    selected={etaTarget}
                    disabled={true}
                    dateFormat="dd/MM/yyyy HH:mm"
                    className="block min-w-[25%] rounded-md border-0 py-2 px-2 pl-10 m-p-reg shadow-sm ring-1 ring-inset ring-neutral-40 bg-gray-200 text-gray-500 sm:text-sm sm:leading-6 w-full"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                  />
                  <FaCalendarAlt className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  data={dcs} 
                  required={true} 
                  disabled={true}
                  className="w-full bg-gray-100" 
                  value={dcDropdown} 
                  onChange={() => {}} 
                />
                <p className="text-xs text-gray-500 mt-1 pl-2">Alamat: {originAddress}</p>
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
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border opacity-75">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 border-r w-[250px]">Produk</th>
                    <th className="p-2 border-r">Kuantitas</th>
                    <th className="p-2 border-r">Volume Total (m3)</th>
                    <th className="p-2 border-r">Berat Total (kg)</th>
                    <th className="p-2 border-r">Total Harga (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {productLines.map((pl, idx) => (
                    <tr key={idx} className="border-b bg-gray-50">
                      <td className="p-2 border-r">
                        <select disabled className="w-full border rounded p-1 bg-gray-100" value={pl.product_id}>
                          <option value="">-- Pilih --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <input disabled type="number" className="w-full border rounded p-1 bg-gray-100" value={pl.quantity} />
                      </td>
                      <td className="p-2 border-r">
                        <input disabled type="number" className="w-full border rounded p-1 bg-gray-100" value={pl.volume} />
                      </td>
                      <td className="p-2 border-r">
                        <input disabled type="number" className="w-full border rounded p-1 bg-gray-100" value={pl.weight} />
                      </td>
                      <td className="p-2 border-r">
                        <input disabled type="number" className="w-full border rounded p-1 bg-gray-100" value={pl.price} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productLines.length === 0 && (
                <p className="text-center py-4 text-gray-500 border border-t-0 bg-gray-50">Tidak ada data muatan.</p>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate(-1)} />
            <Button className="text-button btn-primary" label="Simpan Perubahan" onClick={handleSubmit} />
          </div>
        </form>
        </div>
      </div>
    </>
  )
}

export default EditDO
