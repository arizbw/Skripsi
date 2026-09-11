import React, { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsBusFront, BsBoxSeam, BsHouse, BsClipboard, BsTruck, BsGeoAlt, BsChevronDown, BsCart, BsArrowLeft, BsPeople, BsPersonGear, BsReceipt, BsBasket, BsPersonLinesFill, BsRobot } from 'react-icons/bs'
import { Modal } from './Modal'
import AIChatbox from './chat'
import axios from 'axios'
import jwtDecode from 'jwt-decode'

export default function Sidebar({ children, beranda, user, role, pengiriman, truk, lokasi, title, breadcrumb = null, baseRoute, deliveryOrder, productLine, product, customer }) {
  let navigate = useNavigate()
  let [modalKeluar, setModalKeluar] = useState(false)
  let [modalKeluarSukses, setModalKeluarSukses] = useState(false)
  let [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [token, setToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [username, setUsername] = useState('')
  const [shipmentAllow, setShipmentAllow] = useState(false)
  const [doAllow, setDoAllow] = useState(false)
  const [truckAllow, setTruckAllow] = useState(false)
  const [locationAllow, setLocationAllow] = useState(false)
  const [userAllow, setUserAllow] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const handleLogout = () => {
    delete axios.defaults.headers.common['Authorization']
    sessionStorage.clear()
    navigate('/login')
  }

  const navigateWithReload = (path) => {
    navigate(path)
    // window.location.reload();
  }

  // const userEmail= sessionStorage.getItem("userEmail");
  // const userUsername= sessionStorage.getItem("userUsername");
  // const shipmentAllow= sessionStorage.getItem("shipment");
  // const orderAllow= localStorage.getItem("order");
  // const trukAllow= localStorage.getItem("truk");
  // const locationAllow= localStorage.getItem("location");
  // const userAllow= localStorage.getItem("user");
  // const [userRole, setUserRole] = useState(localStorage.getItem("userRole"))

  useEffect(() => {
    const tokenFromSession = sessionStorage.getItem('token')
    if (tokenFromSession) {
      const decodedToken = jwtDecode(tokenFromSession)
      setToken(decodedToken)
      setUserEmail(decodedToken.email)
      setUsername(decodedToken.username)
      setShipmentAllow(decodedToken.role.is_allowed_shipment)
      setDoAllow(decodedToken.role.is_allowed_do)
      setTruckAllow(decodedToken.role.is_allowed_truck)
      setLocationAllow(decodedToken.role.is_allowed_location)
      setUserAllow(decodedToken.role.is_allowed_user)
      setUserRole(decodedToken.role)
    }
  }, [])

  return (
    <div>
      <Modal
        variant="danger"
        isOpen={modalKeluar}
        closeModal={() => setModalKeluar(false)}
        title="Keluar"
        description="Anda yakin ingin keluar dari akun?"
        rightButtonText="Yakin"
        leftButtonText="Batal"
        onClickRight={() => {
          handleLogout()
          setModalKeluarSukses(true)
          setModalKeluar(false)
        }}
      />

      <Modal variant="danger" isOpen={modalKeluarSukses} closeModal={() => setModalKeluarSukses(false)} description="Anda telah keluar dari akun" rightButtonText="Selesai" />

      <div className="flex h-screen overflow-hidden bg-[#F8F9FB]">
        <aside className="bg-primary h-full w-[250px] flex-shrink-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="flex flex-col items-center justify-center w-[250px] h-[88px] px-4 space-y-5 drop-shadow-md">
            <div className="flex w-max space-x-2">
              <BsBusFront className="text-neutral-10" size={30} />
              <h3 className="text-neutral-10">Routing App</h3>
            </div>
          </div>

          <div className="py-5 pl-4 space-y-4">
            {beranda === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/dashboard'), setIsDropdownOpen(false)]}>
                <BsHouse size={24} />
                <p className="text-[16px] font-semibold text-primary">Beranda</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/dashboard'), setIsDropdownOpen(false)]}>
                <BsHouse size={24} />
                <p className="text-[16px] font-semibold">Beranda</p>
              </div>
            )}

            {pengiriman === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/pengiriman'), setIsDropdownOpen(false)]}>
                <BsClipboard size={24} />
                <p className="text-[16px] font-semibold text-primary">Pengiriman</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/pengiriman'), setIsDropdownOpen(false)]}>
                <BsClipboard size={24} />
                <p className="text-[16px] font-semibold">Pengiriman</p>
              </div>
            )}

            {deliveryOrder === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/delivery-order'), setIsDropdownOpen(false)]}>
                <BsBoxSeam size={24} />
                <p className="text-[16px] font-semibold text-primary">Delivery Order</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-1 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/delivery-order'), setIsDropdownOpen(false)]}>
                <BsBoxSeam size={24} />
                <p className="text-[16px] font-semibold">Delivery Order</p>
              </div>
            )}
            {productLine === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/product-line'), setIsDropdownOpen(false)]}>
                <BsReceipt size={24} />
                <p className="text-[16px] font-semibold text-primary">Product Line</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-1 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/product-line'), setIsDropdownOpen(false)]}>
                <BsReceipt size={24} />
                <p className="text-[16px] font-semibold">Product Line</p>
              </div>
            )}

            {product === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/product'), setIsDropdownOpen(false)]}>
                <BsReceipt size={24} />
                <p className="text-[16px] font-semibold text-primary">Product</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-1 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/product'), setIsDropdownOpen(false)]}>
                <BsBasket size={24} />
                <p className="text-[16px] font-semibold">Product</p>
              </div>
            )}
            
            {truk === true ? (
              <div
                className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer"
                onClick={() => {
                  navigateWithReload('/truk')
                  setIsDropdownOpen(false)
                }}
              >
                <BsTruck size={24} />
                <p className="text-[16px] font-semibold text-primary">Truk</p>
              </div>
            ) : (
              <div
                className="flex w-full px-[15px] py-[15px] space-x-2 text-neutral-10 cursor-pointer"
                onClick={() => {
                  navigateWithReload('/truk')
                  setIsDropdownOpen(false)
                }}
              >
                <BsTruck size={24} />
                <p className="text-[16px] font-semibold">Truk</p>
              </div>
            )}

            {lokasi === true ? (
              <div className="flex w-full px-[15px] py-[15px] space-x-2 bg-neutral-10 text-primary rounded-l-[12px] cursor-pointer" onClick={() => [navigateWithReload('/lokasi'), setIsDropdownOpen(false)]}>
                <BsGeoAlt size={24} />
                <p className="text-[16px] font-semibold text-primary">Lokasi</p>
              </div>
            ) : (
              <div className="flex w-full px-[15px] py-[15px] space-x-1 text-neutral-10 cursor-pointer" onClick={() => [navigateWithReload('/lokasi'), setIsDropdownOpen(false)]}>
                <BsGeoAlt size={24} />
                <p className="text-[16px] font-semibold">Lokasi</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 h-full overflow-y-auto">
          <div className="flex items-center justify-between px-[50px] drop-shadow-md bg-neutral-10 z-40 w-full">
            <h3>{title}</h3>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="flex items-center justify-center p-2 text-neutral-80 hover:bg-neutral-20 rounded-full transition-colors"
                title="Buka AI Assistant"
              >
                <BsRobot size={24} />
              </button>
              <div className=" space-y-2">
                <div className="flex items-center  justify-between px-4 h-[88px] space-x-2 hover:bg-primary-surface hover:bg-opacity-25 hover:text-primary cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <p className="m-p-med">{userEmail}</p>
                <BsChevronDown></BsChevronDown>
              </div>
              {isDropdownOpen && (
                <div className=" fixed right-0 z-40 bg-neutral-10 rounded-[7px]  space-y-2 p-4 w-[213px] drop-shadow-none">
                  <p className="m-p-reg cursor-default">{username}</p>
                  <hr />
                  <div className="w-full h-full cursor-pointer text-danger hover:text-danger-hover " onClick={() => setModalKeluar(true)}>
                    <p className="text-[16px] font-semibold">Logout</p>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          {children}
        </main>
        {isChatOpen && <AIChatbox onClose={() => setIsChatOpen(false)} />}
      </div>
    </div>
  )
}
