import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Dropdown } from '../../../components/Dropdown'
import { TextField } from '../../../components/TextField'
import React, { useEffect, useState } from 'react'
import { Loading } from '../../../components/Loading'
import { Modal } from '../../../components/Modal'
import { isAnyAttributeNull, checkAttributeNull } from '../../../utils/utils'
import axiosAuthInstance from '../../../utils/axios-auth-instance'
import GoogleMap from '../../../components/GoogleMap'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { useParams } from 'react-router-dom'

function ViewLokasiAdmin() {
  const { lokasiId } = useParams()
  let navigate = useNavigate()
  const location = useLocation()

  const [showLoading, setShowLoading] = useState(true)
  const [detailLokasiData, setDetailLokasiData] = useState({
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
    loc_id: null,
    service_time: null,
    location_type: null
  })
  const [dataDC, setDataDC] = useState([])
  const [dataTipeLokasi, setDataTipeLokasi] = useState([])
  const [customerDropdown, setCustomerDropdown] = useState([])
  const [tipeLokasiDropdown, setTipeLokasiDropdown] = useState({
    name: '',
    value: '',
    time: '' // You might want to provide a default value for this property
  })
  const [dcDropdown, setDCDropdown] = useState(null)
  const [dataProvinsi, setDataProvinsi] = useState([])
  const [dataKota, setDataKota] = useState([])
  const [dataKecamatan, setDataKecamatan] = useState([])
  const [dataDesa, setDataDesa] = useState([])
  const [provDropdown, setProvDropdown] = useState(null)
  const [kotaDropdown, setKotaDropdown] = useState(null)
  const [kecDropdown, setKecDropdown] = useState(null)
  const [desaDropdown, setDesaDropdown] = useState(null)

  useEffect(() => {
    async function fetchDataLokasi() {
      if (lokasiId != null) {
        console.log(lokasiId)
        try {
          const response = await axiosAuthInstance.get(`/location/${lokasiId}`)
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
            open_hour: responseData.open_hour.slice(11, 16),
            close_hour: responseData.close_hour.slice(11, 16),
            dc: responseData.dc,
            service_time: responseData.service_time,
            customer_name: responseData.is_dc ? null : responseData.customer.name,
            is_dc: responseData.is_dc
          }
          setDetailLokasiData(lokasiData)

          if (lokasiData.dc) {
            setDCDropdown({
              name: lokasiData.dc.name,
              value: lokasiData.dc.id
            })
          }

          if (lokasiData.provinsi) {
            setProvDropdown({
              name: lokasiData.provinsi,
              value: null
            })
          }
          if (lokasiData.kabupaten_kota) {
            setKotaDropdown({
              name: lokasiData.kabupaten_kota,
              value: null
            })
          }
          if (lokasiData.kecamatan) {
            setKecDropdown({
              name: lokasiData.kecamatan,
              value: null
            })
          }
          if (lokasiData.desa_kelurahan) {
            setDesaDropdown({
              name: lokasiData.desa_kelurahan,
              value: null
            })
          }
          setShowLoading(false)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }

    fetchDataLokasi()
  }, [lokasiId])

  const handleProvDropdownChange = (selectedValue) => {
    setProvDropdown(selectedValue)
    setDetailLokasiData({
      ...detailLokasiData,
      provinsi: selectedValue.name
    })
    if (detailLokasiData.provinsi !== selectedValue.name) {
      setKotaDropdown(null)
      setKecDropdown(null)
      setDesaDropdown(null)
      setDetailLokasiData({
        ...detailLokasiData,
        provinsi: selectedValue.name,
        kabupaten_kota: null,
        kecamatan: null,
        desa_kelurahan: null
      })
    }
  }

  const handleKotaDropdownChange = (selectedValue) => {
    setKotaDropdown(selectedValue)
    setDetailLokasiData({
      ...detailLokasiData,
      kabupaten_kota: selectedValue.name
    })

    if (detailLokasiData.kabupaten_kota !== selectedValue.name) {
      setKecDropdown(null)
      setDesaDropdown(null)
      setDetailLokasiData({
        ...detailLokasiData,
        kabupaten_kota: selectedValue.name,
        kecamatan: null,
        desa_kelurahan: null
      })
    }
  }

  const handleKecDropdownChange = (selectedValue) => {
    setKecDropdown(selectedValue)
    setDetailLokasiData({
      ...detailLokasiData,
      kecamatan: selectedValue.name
    })

    if (detailLokasiData.kecamatan !== selectedValue.name) {
      setDesaDropdown(null)
      setDetailLokasiData({
        ...detailLokasiData,
        kecamatan: selectedValue.name,
        desa_kelurahan: null
      })
    }
  }

  const handleDesaDropdownChange = (selectedValue) => {
    setDesaDropdown(selectedValue)
    setDetailLokasiData({
      ...detailLokasiData,
      desa_kelurahan: selectedValue.name
    })
  }

  //Handle Detail Req
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleDCDropdownChange = (selectedValue) => {
    setDCDropdown(selectedValue)
    setDetailLokasiData({
      ...detailLokasiData,
      dc_id: selectedValue.value
    })
  }

  const handleInputChange = (name, value) => {
    setDetailLokasiData({ ...detailLokasiData, [name]: value })
  }

  //Init Maps
  const mapCenter = [
    detailLokasiData.latitude  || -6.2257128925342755,
    detailLokasiData.longitude || 106.76117789050836,
  ];
  const mapMarkers =
    detailLokasiData.latitude && detailLokasiData.longitude
      ? [{ lat: detailLokasiData.latitude, lng: detailLokasiData.longitude }]
      : [];

  return (
    <div className="relative h-full -z-10">
      <Loading visibility={showLoading} />
      {/* <Modal variant="primary" isOpen={isOpenConfirmation} closeModal={() => setIsOpenConfirmation(false)} title="Ubah Data Lokasi" description="Anda yakin ingin menyimpan lokasi baru?" rightButtonText="Yakin" onClickRight={detailLokasi} leftButtonText="Batal" /> */}

      {/* <Modal variant="primary" isOpen={isOpenSuccess} closeModal={() => setIsOpenSuccess(false)} description="Berhasil menyimpan data lokasi." rightButtonText="Selesai" onClickRight={() => navigate('/lokasi')} />
      <Modal variant="danger" isOpen={isOpenError} closeModal={() => setIsOpenError(false)} description="Gagal menyimpan data lokasi." rightButtonText="Ulangi" /> */}

      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="p-8 bg-white rounded-lg">
          <h4>Informasi Lokasi</h4>
          <div className="pt-4">
              <TextField label="Nama Lokasi" disabled={true} placeholder="Nama Lokasi" required={true} className="w-full" value={detailLokasiData.name} onChange={(e) => handleInputChange('name', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.name)} />
              {!detailLokasiData.is_dc && <TextField label="Nama Customer" disabled={true} placeholder="Nama Customer" required={true} className="w-full" value={detailLokasiData.customer_name} onChange={(e) => handleInputChange('dc', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.customer_name)} />}
              {!detailLokasiData.is_dc && <Dropdown placeholder="Contoh: Jakarta Timur" label="Distribution Center (DC) " data={dataDC} className="w-full min-h-[40px]" required={true} value={dcDropdown} onChange={handleDCDropdownChange} isError={isError && checkAttributeNull(dcDropdown)} disabled={true} />}
              <TextField label="Alamat Lokasi" disabled={true} placeholder="Alamat Lokasi" required={true} className="w-full" value={detailLokasiData.address} onChange={(e) => handleInputChange('address', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.address)} />

              <div className={`w-full overflow-hidden p-2`} style={{ height: '300px' }}>
                <GoogleMap
                  center={mapCenter}
                  zoom={15}
                  height="300px"
                  markers={mapMarkers}
                />
              </div>
              <div className="flex">
                <div className="w-[50%]">
                  <TextField label="Latitude" disabled={true} placeholder="Latitude" type="number" required={true} className="w-full" value={detailLokasiData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.latitude)} />
                </div>
                <div className="w-[50%]">
                  <TextField label="Longitude" disabled={true} placeholder="Longitude" type="number" required={true} className="w-full" value={detailLokasiData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.longitude)} />
                </div>
              </div>

              <div className="flex">
                <div className="w-[50%]">
                  <Dropdown placeholder="Contoh: DKI Jakarta" disabled={true} label="Provinsi" data={dataProvinsi} className="w-full" required={true} value={provDropdown} onChange={handleProvDropdownChange} isError={isError && checkAttributeNull(provDropdown)} />
                  {/* <TextField label="Kelurahan" placeholder="Kelurahan" required={true} className="w-full" value={detailLokasiData.desa_kelurahan} onChange={(e) => handleInputChange("desa_kelurahan", e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.desa_kelurahan)}/> */}
                </div>
                <div className="w-[50%]">
                  <Dropdown placeholder="Contoh: Jakarta Selatan" disabled={true} label="Kabupaten/Kota" data={dataKota} className="w-full" required={true} value={kotaDropdown} onChange={handleKotaDropdownChange} isError={isError && checkAttributeNull(kotaDropdown)} />
                  {/* <TextField label="Kecamatan" placeholder="Kecamatan" required={true} className="w-full" value={detailLokasiData.kecamatan} onChange={(e) => handleInputChange("kecamatan", e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.kecamatan)}/> */}
                </div>
              </div>

              <div className="flex">
                <div className="w-[50%]">
                  <Dropdown placeholder="Contoh: Pesanggrahan" disabled={true} label="Kecamatan" data={dataKecamatan} className="w-full" required={true} value={kecDropdown} onChange={handleKecDropdownChange} isError={isError && checkAttributeNull(kecDropdown)} />
                  {/* <TextField label="Kabupaten/Kota" placeholder="Kabupaten/Kota" required={true} className="w-full" value={detailLokasiData.kabupaten_kota} onChange={(e) => handleInputChange("kabupaten_kota", e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.kabupaten_kota)}/> */}
                </div>
                <div className="w-[50%]">
                  <Dropdown placeholder="Contoh: Ulujami" disabled={true} label="Kelurahan/Desa" data={dataDesa} className="w-full" required={true} value={desaDropdown} onChange={handleDesaDropdownChange} isError={isError && checkAttributeNull(desaDropdown)} />
                  {/* <TextField label="Provinsi" placeholder="Provinsi" required={true} className="w-full" value={detailLokasiData.provinsi} onChange={(e) => handleInputChange("provinsi", e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.provinsi)}/> */}
                </div>
              </div>

              <TextField label="Kode Pos" placeholder="Kode Pos" disabled={true} type="number" required={true} className="w-full" value={detailLokasiData.kode_pos} onChange={(e) => handleInputChange('kode_pos', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.kode_pos)} />
              {/* <Dropdown placeholder="Contoh: Paragon" label="Customer" className="w-full text-neutral-60" required={true} data={[]} value={customerDropdown} isError={isError && checkAttributeNull(customerDropdown)} disabled={true} /> */}

              <div className="flex justify-center items-center">
                <div className="w-[50%]">
                  <TextField label="Jam Buka Toko" placeholder="Jam Buka Toko" disabled={true} type="time" required={true} className="w-full max-h-[40px]" value={detailLokasiData.open_hour} onChange={(e) => handleInputChange('open_hour', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.open_hour)} />
                </div>
                <div className="w-[50%]">
                  <TextField label="Jam Tutup Toko" placeholder="Jam Tutup Toko" disabled={true} type="time" required={true} className="w-full max-h-[40px]" value={detailLokasiData.close_hour} onChange={(e) => handleInputChange('close_hour', e.target.value)} isError={isError && checkAttributeNull(detailLokasiData.close_hour)} />
                </div>
              </div>

              {/* <Dropdown placeholder="Contoh: Supermarket" label="Tipe Lokasi" className="w-full" required={true} data={dataTipeLokasi} value={tipeLokasiDropdown} onChange={handleTipeLokasiDropdownChange} isError={isError && checkAttributeNull(tipeLokasiDropdown)} /> */}

              <TextField label="Service Time Saat Ini" disabled={true} placeholder="Contoh: 15" type="number" className="w-full" value={detailLokasiData.service_time} onChange={(e) => handleInputChange('service_time', e.target.value)} />
            </div>
        </div>

        {/* <div className="flex justify-center gap-4 pt-4">
          <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate('/lokasi')} />
          <Button className="text-button btn-primary" label="Simpan" onClick={handleSubmit} />
        </div> */}
      </div>
    </div>
  )
}

export default ViewLokasiAdmin
