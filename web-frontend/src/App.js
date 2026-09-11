import './App.css'
import { UserProvider } from './utils/userContext'
import ProtectedRoutes from './ProtectedRoutes'
import { useEffect, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'))

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
  })

  return (
    <UserProvider>
      <ProtectedRoutes />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </UserProvider>
  )
}

export default App
