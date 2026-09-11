import BaseTable, { SelectColumnFilter, StatusPill, ActionButtons } from '../../components/BaseTable'
import React, { useEffect, useState } from 'react'
import { Loading } from '../../components/Loading'
import axiosAuthInstance from '../../utils/axios-auth-instance'
import jwtDecode from 'jwt-decode'
import { Button } from '../../components/Button'
import { BsCloudUpload } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'

function ViewAllTrucks() {
  const [dataTruk, setDataTruk] = useState([])
  const [showLoading, setShowLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [dataFetched, setDataFetched] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const tokenFromSession = sessionStorage.getItem('token')
    if (tokenFromSession) {
      const decodedToken = jwtDecode(tokenFromSession)
      setUserRole(decodedToken.role.name)
    }
  }, [])

  useEffect(() => {
    if (!dataFetched) {
      axiosAuthInstance
        .get('/trucks')
        .then((response) => {
          setDataTruk(response.data.data)
          setShowLoading(false)
          setDataFetched(true)
        })
        .catch((error) => {
          console.error('Error fetching trucks:', error)
          setShowLoading(false)
        })
    }
  }, [userRole, dataFetched])

  const columns = React.useMemo(
    () => [
     
      {
        Header: 'Pelat',
        accessor: 'plate_number',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: 'Tipe',
        accessor: 'truck_type.name',
        filter: 'includes',
        Cell: (props) => {
          const truckTypeName = props.value
          let displayName = truckTypeName
          if (truckTypeName === 'BLIND_VAN') displayName = 'Blind Van'
          else if (truckTypeName === 'CDE') displayName = 'CDE'
          else if (truckTypeName === 'CDD') displayName = 'CDD'
          return <div>{displayName}</div>
        }
      },
      {
        Header: 'DC',
        accessor: 'dc.name',
        Filter: SelectColumnFilter,
        filter: 'includes'
      },
      {
        Header: () => {
          return (
            <>
              <div className="flex justify-center items-center text-center">Status</div>{' '}
            </>
          )
        },
        accessor: 'first_status',
        Cell: (props) => {
          return (
            <>
              <div className="flex justify-center items-center">{StatusPill({ value: props.value, type: 'Truk' })}</div>{' '}
            </>
          )
        }
      },
      {
        Header: 'Action',
        accessor: (row) => ['Truk', row.id],
        Cell: ActionButtons
      }
    ],
    []
  )

  return (
    <>
      <Loading visibility={showLoading} />
      <div className={`px-[50px] py-[30px] flex flex-col ${showLoading ? 'hidden' : 'visible'}`}>
        <div className="flex justify-end mb-4">
          <Button
            className="bg-white border text-[#1F54A3] hover:bg-neutral-10 border-[#1F54A3] px-4 py-2 rounded-[4px] text-[14px] font-[500]"
            label="Unggah file"
            icon={<BsCloudUpload size={16} />}
            onClick={() => navigate('/truk/import')}
          />
        </div>
        <BaseTable columns={columns} data={dataTruk} dataLength={dataTruk.length} judul={`Daftar Truk`} />
      </div>
    </>
  )
}

export default ViewAllTrucks
