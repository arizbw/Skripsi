import { Dropdown } from '../../components/Dropdown'
import { TextField } from '../../components/TextField'
import React, { useEffect, useState } from 'react'
import { Loading } from '../../components/Loading'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import GoogleMap from '../../components/GoogleMap'
import { useParams } from 'react-router-dom'

function ViewLokasi() {
  const { lokasiId } = useParams()
  console.log("lokasiId:", lokasiId)

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
    service_time: null,
    location_type: null,
    customer_name: null,
    is_dc: false
  })
  const [dcDropdown, setDCDropdown] = useState(null)
  const [provDropdown, setProvDropdown] = useState(null)
  const [kotaDropdown, setKotaDropdown] = useState(null)
  const [kecDropdown, setKecDropdown] = useState(null)
  const [desaDropdown, setDesaDropdown] = useState(null)

  useEffect(() => {
    fetchDataLokasi()
  }, [])

  async function fetchDataLokasi() {
    if (lokasiId) {
      try {
        const response = await axiosAuthInstance.get(`/location/${lokasiId}`)
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

  const handleProvDropdownChange = (selectedValue) => {
    setProvDropdown(selectedValue)
    setDetailLokasiData((prevData) => ({
      ...prevData,
      provinsi: selectedValue.name,
      kabupaten_kota: null,
      kecamatan: null,
      desa_kelurahan: null
    }))
    setKotaDropdown(null)
    setKecDropdown(null)
    setDesaDropdown(null)
  }

  const handleKotaDropdownChange = (selectedValue) => {
    setKotaDropdown(selectedValue)
    setDetailLokasiData((prevData) => ({
      ...prevData,
      kabupaten_kota: selectedValue.name,
      kecamatan: null,
      desa_kelurahan: null
    }))
    setKecDropdown(null)
    setDesaDropdown(null)
  }

  const handleKecDropdownChange = (selectedValue) => {
    setKecDropdown(selectedValue)
    setDetailLokasiData((prevData) => ({
      ...prevData,
      kecamatan: selectedValue.name,
      desa_kelurahan: null
    }))
    setDesaDropdown(null)
  }

  const handleDesaDropdownChange = (selectedValue) => {
    setDesaDropdown(selectedValue)
    setDetailLokasiData((prevData) => ({
      ...prevData,
      desa_kelurahan: selectedValue.name
    }))
  }

  const handleDCDropdownChange = (selectedValue) => {
    setDCDropdown(selectedValue)
    setDetailLokasiData((prevData) => ({
      ...prevData,
      dc_id: selectedValue.value
    }))
  }

  const handleInputChange = (name, value) => {
    setDetailLokasiData((prevData) => ({ ...prevData, [name]: value }))
  }

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
      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="p-8 bg-white rounded-lg">
          <h4>Informasi Lokasi</h4>
            <div className="pt-4">
              {!detailLokasiData.is_dc && (
                <TextField
                  label="Nama Customer"
                  disabled={true}
                  placeholder="Nama Customer"
                  required={true}
                  className="w-full"
                  value={detailLokasiData.customer_name}
                  onChange={(e) => handleInputChange('dc', e.target.value)}
                />
              )}
              {!detailLokasiData.is_dc && (
                <Dropdown
                  placeholder="Contoh: Jakarta Timur"
                  label="Distribution Center (DC)"
                  data={[]}
                  className="w-full min-h-[40px]"
                  required={true}
                  value={dcDropdown}
                  onChange={handleDCDropdownChange}
                  disabled={true}
                />
              )}
              <TextField
                  label="Alamat Lokasi"
                  disabled={true}
                  placeholder="Alamat Lokasi"
                  required={true}
                  className="w-full"
                  value={detailLokasiData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />

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
                  <TextField
                    label="Latitude"
                    disabled={true}
                    placeholder="Latitude"
                    type="number"
                    required={true}
                    className="w-full"
                    value={detailLokasiData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                  />
                </div>
                <div className="w-[50%]">
                  <TextField
                    label="Longitude"
                    disabled={true}
                    placeholder="Longitude"
                    type="number"
                    required={true}
                    className="w-full"
                    value={detailLokasiData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex">
                <div className="w-[50%]">
                  <Dropdown
                    placeholder="Contoh: DKI Jakarta"
                    disabled={true}
                    label="Provinsi"
                    data={[]}
                    className="w-full"
                    required={true}
                    value={provDropdown}
                    onChange={handleProvDropdownChange}
                  />
                </div>
                <div className="w-[50%]">
                  <Dropdown
                    placeholder="Contoh: Jakarta Selatan"
                    disabled={true}
                    label="Kabupaten/Kota"
                    data={[]}
                    className="w-full"
                    required={true}
                    value={kotaDropdown}
                    onChange={handleKotaDropdownChange}
                  />
                </div>
              </div>

              <div className="flex">
                <div className="w-[50%]">
                  <Dropdown
                    placeholder="Contoh: Pesanggrahan"
                    disabled={true}
                    label="Kecamatan"
                    data={[]}
                    className="w-full"
                    required={true}
                    value={kecDropdown}
                    onChange={handleKecDropdownChange}
                  />
                </div>
                <div className="w-[50%]">
                  <Dropdown
                    placeholder="Contoh: Ulujami"
                    disabled={true}
                    label="Kelurahan/Desa"
                    data={[]}
                    className="w-full"
                    required={true}
                    value={desaDropdown}
                    onChange={handleDesaDropdownChange}
                  />
                </div>
              </div>

              <TextField
                label="Kode Pos"
                placeholder="Kode Pos"
                disabled={true}
                type="number"
                required={true}
                className="w-full"
                value={detailLokasiData.kode_pos}
                onChange={(e) => handleInputChange('kode_pos', e.target.value)}
              />

              <div className="flex justify-center items-center">
                <div className="w-[50%]">
                  <TextField
                    label="Jam Buka Toko"
                    placeholder="Jam Buka Toko"
                    disabled={true}
                    type="time"
                    required={true}
                    className="w-full max-h-[40px]"
                    value={detailLokasiData.open_hour}
                    onChange={(e) => handleInputChange('open_hour', e.target.value)}
                  />
                </div>
                <div className="w-[50%]">
                  <TextField
                    label="Jam Tutup Toko"
                    placeholder="Jam Tutup Toko"
                    disabled={true}
                    type="time"
                    required={true}
                    className="w-full max-h-[40px]"
                    value={detailLokasiData.close_hour}
                    onChange={(e) => handleInputChange('close_hour', e.target.value)}
                  />
                </div>
              </div>

              <TextField
                label="Service Time Saat Ini"
                disabled={true}
                placeholder="Contoh: 15"
                type="number"
                className="w-full"
                value={detailLokasiData.service_time}
                onChange={(e) => handleInputChange('service_time', e.target.value)}
              />
            </div>
        </div>
      </div>
    </div>
  )
}

export default ViewLokasi
