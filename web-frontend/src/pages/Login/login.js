import React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsBusFront,BsFillEyeFill,BsFillEyeSlashFill,BsExclamationCircle } from "react-icons/bs";
import jwt_decode from 'jwt-decode';
import { Button } from '../../components/Button';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [passType, setPassType] = useState("password");
  const [seePassword, setSeePassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  function handlePassType() {
    setSeePassword(!seePassword);
    if (seePassword == false) {
        setPassType("text");
    } else if (seePassword == true) {
        setPassType("password");
    }
  }

  let navigate = useNavigate();

  const postLogin = async (e) => {
    e.preventDefault();

    if(username.length === 0 || password.length === 0){
      setErrorLogin(true);
    }
    else{
        setErrorLogin(false);
        setShowLoading(true);
        e.preventDefault();

        const userData = {
            username: username,
            password: password,
        };

        try {
            axios.defaults.baseURL = `${process.env.REACT_APP_BACKEND_URL}/api/v1`;

            const response = await axios.post("/login", userData);
            if(response.status === 200){
                const token = response.data.data.token;
                axios.defaults.headers.common['Authorization'] = "Bearer " + token;
                
                const decodedToken = jwt_decode(token);
                localStorage.setItem("userRole", decodedToken.role ? decodedToken.role.name : "null");
                localStorage.setItem("dcId", decodedToken.role ? decodedToken.role.dc_id : "null");
                
                sessionStorage.setItem("token", token)
                // Generate session_id unik per login agar history chat AI selalu bersih saat login baru
                const userId = decodedToken.id || decodedToken.sub || decodedToken.user_id || username;
                sessionStorage.setItem("session_id", `user_${userId}_${Date.now()}`)
                navigate("/")
                window.location.reload();
            }
            setShowLoading(false);
        } catch (error) {
          console.log(error)
          setErrorLogin(true);
          setShowLoading(false);
        }
    }
  };

  return (
    <div className='flex h-screen w-full justify-center items-center'>
        <div className='flex flex-col w-full h-full justify-center items-center max-w-[20rem] gap-4'>
          <div className='flex space-x-2 '>
            <BsBusFront  size={50}></BsBusFront>
            <h2 className='text-primary'>Routing App</h2>
          </div>
          <div className='flex w-full flex-col justify-center items-center space-y-[10px]'>
            <h3>Login</h3>
            {errorLogin? 
              <div className='flex w-full items-center rounded-[7px] px-[10px] py-3 space-x-[10px] bg-danger-surface'>
                <BsExclamationCircle className='text-danger' />
                <p className='m-p-reg text-danger-hover'>Username atau password tidak sesuai!</p>
              </div>
            :null}
            
            <div className='flex w-full flex-col justify-center space-y-4'>
              <div className="w-full sm:col-span-3">
                <label className="block m-p-med leading-6">
                    Username
                </label>
                <div className="w-full mt-1">
                    <input
                    type={'text'}
                    placeholder={'Username'}
                    value={username}
                    onChange={(event) =>
                        setUsername(event.target.value)
                    }
                    className={`block w-full rounded-md border-0 py-2 px-2 m-p-reg shadow-sm ring-1 ring-inset ring-neutral-40  focus:outline-none sm:text-sm sm:leading-6 disabled:bg-neutral-30 disabled:placeholder-neutral-60`} 
                    />
                </div>
              </div>
              <div className="w-full sm:col-span-3">
                <label className="block m-p-med leading-6">
                    Password
                </label>
                <div className="flex justify-between items-center w-full mt-1 block w-full rounded-md border-0 py-2 px-2 m-p-reg shadow-sm ring-1 ring-inset ring-neutral-40 focus:ring-1 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 disabled:bg-neutral-30 disabled:placeholder-neutral-60">
                    <input
                    type={passType}
                    placeholder={'Password'}
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    className={`w-full focus:outline-none outline-none`} 
                    onKeyDown={
                      (e) => {
                        if (e.key === "Enter"){
                          postLogin(e);
                        }
                      }
                    }
                    />
                    {seePassword ? (
                      <BsFillEyeFill  size={24} onClick={handlePassType} className='cursor-pointer'/>
                    ) : (
                      <BsFillEyeSlashFill  size={24} onClick={handlePassType} className='cursor-pointer'/>
                    )}
                </div>
                
              </div>
              <p className='m-p-reg text-primary text-left cursor-pointer' onClick={() => navigate('/')}>Lupa Password?</p>
              <Button className="text-button btn-primary" label="Login" onClick={postLogin}/>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Login