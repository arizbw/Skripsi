import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Dropdown } from '../../../components/Dropdown'
import { TextField } from '../../../components/TextField'
import React, { useEffect, useState } from 'react'
import { Loading } from '../../../components/Loading'
import { Modal } from '../../../components/Modal'
import { checkAttributeNull } from '../../../utils/utils'
import axiosAuthInstance from '../../../utils/axios-auth-instance'

function UpdateLokasiAdmin() {
  let navigate = useNavigate()
  const { state } = useLocation()
  const idLokasi = state?.Id || state?.id

  const [dataCustomer, setDataCustomer] = useState([])
  const [dataDC, setDataDC] = useState([])
  const [showLoading, setShowLoading] = useState(true)

  const dc_id = localStorage.getItem('dcId')
  const userRole = localStorage.getItem('userRole')

  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  
  const [customerDropdown, setCustomerDropdown] = useState(null)
  const [dcDropdown, setDCDropdown] = useState(null)

  const [updateLokasiData, setUpdateLokasiData] = useState({
    id: idLokasi,
    name: null,
    latitude: null,
    longitude: null,
    address: null,
    provinsi: null,
    kabupaten_kota: null,
    kecamatan: null,
    desa_kelurahan: null,
    kode_pos: null,
    open_hour: '08:00',
    close_hour: '17:00',
    customer_id: null,
    dc_id: null
  })

  useEffect(() => {
    if (!idLokasi) {
      navigate(userRole === 'Super' ? '/administrator/lokasi' : '/lokasi')
    }
  }, [idLokasi, navigate, userRole])

  useEffect(() => {
    const fetchData = async () => {
      try {
        let custData = []
        if (dataCustomer.length === 0) {
          const custRes = await axiosAuthInstance.get('/customers?limit=1000')
          custData = custRes.data.data.customers.map((item) => ({
            value: item.id,
            name: item.name
          }))
          setDataCustomer(custData)
        } else {
          custData = dataCustomer
        }

        let tempDcData = []
        if (dataDC.length === 0) {
          const dcRes = await axiosAuthInstance.get('/dcs')
          tempDcData = dcRes.data.data.map((item) => ({
            value: item.id,
            name: item.name
          }))
          setDataDC(tempDcData)
        } else {
          tempDcData = dataDC
        }

        const locRes = await axiosAuthInstance.get(`/location/${idLokasi}`)
        const loc = locRes.data.data
        
        const pad = (n) => n < 10 ? '0' + n : n;
        const oDate = new Date(loc.open_hour);
        const cDate = new Date(loc.close_hour);
        const oHour = `${pad(oDate.getUTCHours())}:${pad(oDate.getUTCMinutes())}`;
        const cHour = `${pad(cDate.getUTCHours())}:${pad(cDate.getUTCMinutes())}`;

        const prefill = state?.prefill || {};

        setUpdateLokasiData({
          id: idLokasi,
          name: prefill.name !== undefined ? prefill.name : loc.name,
          latitude: prefill.latitude !== undefined ? prefill.latitude : loc.latitude,
          longitude: prefill.longitude !== undefined ? prefill.longitude : loc.longitude,
          address: prefill.address !== undefined ? prefill.address : loc.address,
          provinsi: prefill.provinsi !== undefined ? prefill.provinsi : loc.provinsi,
          kabupaten_kota: prefill.kabupaten_kota !== undefined ? prefill.kabupaten_kota : loc.kabupaten_kota,
          kecamatan: prefill.kecamatan !== undefined ? prefill.kecamatan : loc.kecamatan,
          desa_kelurahan: prefill.desa_kelurahan !== undefined ? prefill.desa_kelurahan : loc.desa_kelurahan,
          kode_pos: prefill.kode_pos !== undefined ? prefill.kode_pos : loc.kode_pos,
          open_hour: prefill.open_hour !== undefined ? prefill.open_hour : oHour,
          close_hour: prefill.close_hour !== undefined ? prefill.close_hour : cHour,
          customer_id: prefill.customer_id !== undefined ? prefill.customer_id : loc.customer_id,
          dc_id: prefill.dc_id !== undefined ? prefill.dc_id : loc.dc_id
        })

        if (loc.customer) {
          setCustomerDropdown({ name: loc.customer.name, value: loc.customer.id })
        }
        if (loc.dc) {
          setDCDropdown({ name: loc.dc.name, value: loc.dc.id })
        } else if (dc_id !== 'null' && dc_id !== null) {
          setDCDropdown({ name: tempDcData.find(d => d.value === parseInt(dc_id))?.name, value: parseInt(dc_id) })
        }

        setShowLoading(false)
      } catch (err) {
        console.error(err)
        setShowLoading(false)
      }
    }
    fetchData()
  }, [idLokasi])

  const handleInputChange = (name, value) => {
    setUpdateLokasiData(prev => ({ ...prev, [name]: value }))
  }

  const handleDCDropdownChange = (selectedValue) => {
    setDCDropdown(selectedValue)
    setUpdateLokasiData(prev => ({
      ...prev,
      dc_id: selectedValue.value
    }))
  }

  const handleSubmit = () => {
    if (
      updateLokasiData.name === null ||
      updateLokasiData.address === null ||
      updateLokasiData.provinsi === null ||
      updateLokasiData.kabupaten_kota === null ||
      updateLokasiData.kecamatan === null ||
      updateLokasiData.desa_kelurahan === null ||
      updateLokasiData.kode_pos === null ||
      updateLokasiData.open_hour === null ||
      updateLokasiData.close_hour === null ||
      updateLokasiData.customer_id === null ||
      updateLokasiData.dc_id === null
    ) {
      setIsOpenError(true)
      setIsError(true)
    } else {
      setIsOpenConfirmation(true)
    }
  }

  const updateLokasi = async (e) => {
    e.preventDefault()
    setIsOpenConfirmation(false)
    setShowLoading(true)
    
    const finalData = {
        ...updateLokasiData,
        latitude: updateLokasiData.latitude || 0,
        longitude: updateLokasiData.longitude || 0,
    }

    axiosAuthInstance
      .put('/location', finalData)
      .then((response) => {
        if (response.status === 200) {
          setShowLoading(false)
          setIsOpenSuccess(true)
        }
      })
      .catch((err) => {
        setShowLoading(false)
        setIsOpenError(true)
        console.log(err)
      })
  }

  return (
    <div className="relative h-full">
      <Loading visibility={showLoading} />
      <Modal variant="primary" isOpen={isOpenConfirmation} closeModal={() => setIsOpenConfirmation(false)} title="Update Lokasi" description="Anda yakin ingin memperbarui data lokasi?" rightButtonText="Yakin" onClickRight={updateLokasi} leftButtonText="Batal" />

      <Modal variant="primary" isOpen={isOpenSuccess} closeModal={() => setIsOpenSuccess(false)} description="Berhasil memperbarui data lokasi." rightButtonText="Selesai" onClickRight={() => navigate(userRole === 'Super' ? '/administrator/lokasi' : '/lokasi')} />
      <Modal variant="danger" isOpen={isOpenError} closeModal={() => setIsOpenError(false)} description="Gagal memperbarui data lokasi. Periksa kembali form anda." rightButtonText="Ulangi" />

      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="p-8 bg-white rounded-lg">
          <h4>Masukan Data Lokasi</h4>
          <div className="pt-4 space-y-4">
            
            <TextField label="Nama Lokasi" placeholder="Toko ABC..." required={true} className="w-full" value={updateLokasiData.name || ""} onChange={(e) => handleInputChange('name', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.name)} />

            <TextField label="Alamat Lokasi" placeholder="Jl. Raya..." required={true} className="w-full" value={updateLokasiData.address || ""} onChange={(e) => handleInputChange('address', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.address)} />

            <div className="flex gap-4">
              <div className="w-full">
                <TextField label="Latitude" placeholder="-6.200000" className="w-full" value={updateLokasiData.latitude || ""} onChange={(e) => handleInputChange('latitude', e.target.value)} disabled={false} />
              </div>
              <div className="w-full">
                <TextField label="Longitude" placeholder="106.816666" className="w-full" value={updateLokasiData.longitude || ""} onChange={(e) => handleInputChange('longitude', e.target.value)} disabled={false} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <TextField label="Kelurahan" placeholder="Kelurahan" required={true} className="w-full" value={updateLokasiData.desa_kelurahan || ""} onChange={(e) => handleInputChange('desa_kelurahan', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.desa_kelurahan)} />
              </div>
              <div className="w-full">
                <TextField label="Kecamatan" placeholder="Kecamatan" required={true} className="w-full" value={updateLokasiData.kecamatan || ""} onChange={(e) => handleInputChange('kecamatan', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.kecamatan)} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <TextField label="Kabupaten/Kota" placeholder="Kota..." required={true} className="w-full" value={updateLokasiData.kabupaten_kota || ""} onChange={(e) => handleInputChange('kabupaten_kota', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.kabupaten_kota)} />
              </div>
              <div className="w-full">
                <TextField label="Provinsi" placeholder="Provinsi" required={true} className="w-full" value={updateLokasiData.provinsi || ""} onChange={(e) => handleInputChange('provinsi', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.provinsi)} />
              </div>
            </div>

            <div className="w-full">
              <TextField label="Kode Pos" placeholder="12345" required={true} className="w-full" value={updateLokasiData.kode_pos || ""} onChange={(e) => handleInputChange('kode_pos', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.kode_pos)} />
            </div>

            {/* Asal customer didisable sehingga tidak bisa diubah */}
            <div className="pointer-events-none opacity-60 w-full">
              <Dropdown placeholder="Pilih Customer" label="Customer " data={dataCustomer} className="w-full" required={true} value={customerDropdown} onChange={() => {}} disabled={true} />
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <TextField label="Jam Buka Toko" placeholder="08:00" required={true} className="w-full" value={updateLokasiData.open_hour || ""} onChange={(e) => handleInputChange('open_hour', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.open_hour)} />
              </div>
              <div className="w-full">
                <TextField label="Jam Tutup Toko" placeholder="17:00" required={true} className="w-full" value={updateLokasiData.close_hour || ""} onChange={(e) => handleInputChange('close_hour', e.target.value)} isError={isError && checkAttributeNull(updateLokasiData.close_hour)} />
              </div>
            </div>

            {dc_id !== 'null' && dc_id !== null ? 
              <Dropdown placeholder="Pilih DC" label="Distribution Center (DC) " data={dataDC} className="w-full" required={true} value={dcDropdown} onChange={handleDCDropdownChange} /> 
            : userRole === 'Super' ? 
              <Dropdown placeholder="Pilih DC" label="Distribution Center (DC) " data={dataDC} className="w-full" required={true} value={dcDropdown} onChange={handleDCDropdownChange} isError={isError && checkAttributeNull(dcDropdown)} /> 
            : null}

          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate(userRole === 'Super' ? '/administrator/lokasi' : '/lokasi')} />
          <Button className="text-button btn-primary" label="Simpan" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  )
}

export default UpdateLokasiAdmin
