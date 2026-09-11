import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Dropdown } from '../../../components/Dropdown'
import { TextField } from '../../../components/TextField'
import React, { useEffect, useState } from 'react'
import { Loading } from '../../../components/Loading'
import { Modal } from '../../../components/Modal'
import { checkAttributeNull } from '../../../utils/utils'
import axiosAuthInstance from '../../../utils/axios-auth-instance'

function CreateTrukAdmin() {
  let navigate = useNavigate()
  const [dataTipe, setDataTipe] = useState([])
  const [dataDC, setDataDC] = useState([])
  const [dataStatus, setDataStatus] = useState([])
  const [showLoading, setShowLoading] = useState(true)

  const dc_id = localStorage.getItem('dcId')
  const userRole = localStorage.getItem('userRole')
  const [dcName, setDcName] = useState()

  let status = ['AVAILABLE', 'ON DELIVERY', 'ARCHIVE', 'OOS - LEGAL', 'OOS - MAINTENANCE']

  useEffect(() => {
    if (dataTipe.length === 0) {
      axiosAuthInstance.get('/truck-types').then((response) => {
        const tipeData = response.data.data.map((item) => {
          const calcVolume = (item.length || 0) * (item.width || 0) * (item.height || 0)
          return {
            value: item.id,
            name: item.name,
            volume: calcVolume,
            pallet: 0
          }
        })
        setDataTipe(tipeData)
        setShowLoading(false)
      })
    }
  }, [dataTipe])

  useEffect(() => {
    if (dataDC.length === 0) {
      axiosAuthInstance.get('/dcs').then((response) => {
        const dcData = response.data.data.map((item) => ({
          value: item.id,
          name: item.name
        }))
        if (dc_id !== 'null' && dc_id !== null) {
          setDcName(dcData[parseInt(dc_id) - 1])
          setNewTrukData((prev) => ({
            ...prev,
            dc_id: dc_id
          }))
        } else {
          setDataDC(dcData)
        }
        setShowLoading(false)
      })
    }
  }, [dataDC, dc_id])

  useEffect(() => {
    if (dataStatus.length === 0) {
      const statusData = status.map((item) => ({
        value: item,
        name: item
      }))
      setDataStatus(statusData)
      setShowLoading(false)
    }
  }, [dataStatus])

  const location = useLocation()
  useEffect(() => {
    if (location.state && dataTipe.length > 0 && dataDC.length > 0 && dataStatus.length > 0) {
      const stateData = location.state
      console.log('Prefilling from AI:', stateData)

      let updatedData = { ...newTrukData }

      // Map plate number
      if (stateData.plate_number) {
        updatedData.plate_number = stateData.plate_number
      }

      // Map Truck Type
      if (stateData.type_id) {
        const foundType = dataTipe.find((t) => t.value === stateData.type_id)
        if (foundType) {
          setTipeDropdown(foundType)
          updatedData.type_id = foundType.value
          if (stateData.max_individual_capacity_volume) {
            updatedData.max_individual_capacity_volume = stateData.max_individual_capacity_volume
          }
        }
      }

      // Map DC
      if (stateData.dc_id) {
        const foundDC = dataDC.find((d) => d.value === stateData.dc_id)
        if (foundDC) {
          setDCDropdown(foundDC)
          updatedData.dc_id = foundDC.value
        }
      }

      // Map Status
      if (stateData.first_status) {
        const foundStatus = dataStatus.find((s) => s.name === stateData.first_status || s.name.includes(stateData.first_status))
        if (foundStatus) {
          setStatusDropdown(foundStatus)
          if (foundStatus.value === 'AVAILABLE') {
            updatedData.first_status = 'AVAILABLE'
            updatedData.second_status = null
            updatedData.third_status = null
          } else if (foundStatus.value === 'ARCHIVE') {
            updatedData.first_status = 'UNAVAILABLE'
            updatedData.second_status = 'ARCHIVE'
            updatedData.third_status = null
          } else if (foundStatus.value === 'ON DELIVERY') {
            updatedData.first_status = 'UNAVAILABLE'
            updatedData.second_status = 'ON_DELIVERY'
            updatedData.third_status = null
          } else if (foundStatus.value === 'OOS - MAINTENANCE') {
            updatedData.first_status = 'UNAVAILABLE'
            updatedData.second_status = 'OOS'
            updatedData.third_status = 'MAINTENANCE'
          } else if (foundStatus.value === 'OOS - LEGAL') {
            updatedData.first_status = 'UNAVAILABLE'
            updatedData.second_status = 'OOS'
            updatedData.third_status = 'LEGAL'
          }
        }
      }

      setNewTrukData(updatedData)
      // Clear state after pre-filling to avoid re-triggering if user navigates away and back
      window.history.replaceState({}, document.title)
    }
  }, [location.state, dataTipe, dataDC, dataStatus])

  //Handle Create Req
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [tipeDropdown, setTipeDropdown] = useState(null)
  const [dcDropdown, setDCDropdown] = useState(null)
  const [statusDropdown, setStatusDropdown] = useState({ value: 'AVAILABLE', name: 'AVAILABLE' })

  const [newTrukData, setNewTrukData] = useState({
    plate_number: null,
    dc_id: null,
    first_status: 'AVAILABLE',
    second_status: null,
    third_status: null,
    type_id: null,
    max_individual_capacity_volume: null
  })

  const handleInputChange = (name, value) => {
    setNewTrukData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeDropdownChange = (selectedValue) => {
    setTipeDropdown(selectedValue)
    setNewTrukData((prev) => ({
      ...prev,
      type_id: selectedValue.value,
      max_individual_capacity_volume: selectedValue.volume > 0 ? selectedValue.volume : ''
    }))
  }

  const handleDCDropdownChange = (selectedValue) => {
    setDCDropdown(selectedValue)
    setNewTrukData((prev) => ({
      ...prev,
      dc_id: selectedValue.value
    }))
  }

  const handleStatusDropdownChange = (selectedValue) => {
    setStatusDropdown(selectedValue)
    if (selectedValue.value === 'AVAILABLE') {
      setNewTrukData((prev) => ({
        ...prev,
        first_status: 'AVAILABLE',
        second_status: null,
        third_status: null
      }))
    } else if (selectedValue.value === 'ARCHIVE') {
      setNewTrukData((prev) => ({
        ...prev,
        first_status: 'UNAVAILABLE',
        second_status: 'ARCHIVE',
        third_status: null
      }))
    } else if (selectedValue.value === 'ON DELIVERY') {
      setNewTrukData((prev) => ({
        ...prev,
        first_status: 'UNAVAILABLE',
        second_status: 'ON_DELIVERY',
        third_status: null
      }))
    } else if (selectedValue.value === 'OOS - MAINTENANCE') {
      setNewTrukData((prev) => ({
        ...prev,
        first_status: 'UNAVAILABLE',
        second_status: 'OOS',
        third_status: 'MAINTENANCE'
      }))
    } else if (selectedValue.value === 'OOS - LEGAL') {
      setNewTrukData((prev) => ({
        ...prev,
        first_status: 'UNAVAILABLE',
        second_status: 'OOS',
        third_status: 'LEGAL'
      }))
    }
  }

  const handleSubmit = () => {
    if (newTrukData.plate_number === null || newTrukData.first_status === null || newTrukData.dc_id === null || newTrukData.type_id === null) {
      setIsOpenError(true)
      setIsError(true)
    } else {
      setIsOpenConfirmation(true)
    }
  }

  const createTruk = async (e) => {
    e.preventDefault()
    setIsOpenConfirmation(false)
    setShowLoading(true)
    console.log(newTrukData)
    axiosAuthInstance
      .post('/truck', newTrukData)
      .then((response) => {
        if (response.status === 201 || response.status === 200) {
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
      <Modal variant="primary" isOpen={isOpenConfirmation} closeModal={() => setIsOpenConfirmation(false)} title="Buat Truk" description="Anda yakin ingin menyimpan truk baru?" rightButtonText="Yakin" onClickRight={createTruk} leftButtonText="Batal" />

      <Modal variant="primary" isOpen={isOpenSuccess} closeModal={() => setIsOpenSuccess(false)} description="Berhasil menyimpan data truk." rightButtonText="Selesai" onClickRight={() => navigate(userRole === 'Super' ? '/administrator/truk' : '/truk')} />
      <Modal variant="danger" isOpen={isOpenError} closeModal={() => setIsOpenError(false)} description="Gagal menyimpan data truk." rightButtonText="Ulangi" />

      <div className={`px-[50px] py-[30px] ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="p-8 bg-white rounded-lg">
          <h4>Masukan Data Truk</h4>
          <div className="pt-4">
            <TextField label="Plat Kendaraan" placeholder="B1234RFS" required={true} className="w-full" value={newTrukData.plate_number} onChange={(e) => handleInputChange('plate_number', e.target.value)} isError={isError && checkAttributeNull(newTrukData.plate_number)} />

            <Dropdown label="Tipe Kendaraan" placeholder="Contoh: Blind Van" data={dataTipe} className="w-full" required={true} value={tipeDropdown} onChange={handleTypeDropdownChange} isError={isError && checkAttributeNull(tipeDropdown)} />

            <div className="flex">
              <div className="w-full">
                <TextField label="Volume Maksimal Kendaraan (ml)" placeholder="0" required={true} className="w-full" value={newTrukData.max_individual_capacity_volume} onChange={(e) => handleInputChange('max_individual_capacity_volume', e.target.value)} isError={isError && checkAttributeNull(newTrukData.max_individual_capacity_volume)} />
              </div>
              {/* <div className="w-full">
                                <TextField label="Berat Maksimal Kendaraan (kg)"className="w-full" value={pallet} disabled={true}/>
                            </div> */}
            </div>

            {dc_id !== 'null' ? <Dropdown placeholder="Contoh: Jakarta Timur" label="Distribution Center (DC) " data={dataDC} className="w-full" required={true} value={dc_id} onChange={handleDCDropdownChange} /> : userRole === 'Super' ? <Dropdown placeholder="Contoh: Jakarta Timur" label="Distribution Center (DC) " data={dataDC} className="w-full" required={true} value={dcDropdown} onChange={handleDCDropdownChange} isError={isError && checkAttributeNull(dcDropdown)} /> : null}

            <Dropdown placeholder="AVAILABLE" label="Status" data={dataStatus} className="w-full" required={true} value={statusDropdown} onChange={handleStatusDropdownChange} isError={isError && checkAttributeNull(statusDropdown)} />
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate(userRole === 'Super' ? '/administrator/truk' : '/truk')} />
          <Button className="text-button btn-primary" label="Simpan" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  )
}

export default CreateTrukAdmin
