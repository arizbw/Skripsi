import React, { useState } from "react";
import { TextField } from "../components/TextField";
import { Modal } from "../components/Modal";
import { Dropdown, MultipleDropdown } from "../components/Dropdown";
import { Toggle } from "../components/Switch";
import BaseTable, { SelectColumnFilter, StatusPill, ActionButtons } from "../components/BaseTable";
import { Button } from "../components/Button";

function SystemDesign() {
    const [agreed, setAgreed] = useState(false)

    let [isOpenDanger, setIsOpenDanger] = useState(false)
    let [isOpenPrimary, setIsOpenPrimary] = useState(false)
    let [isOpenWarning, setIsOpenWarning] = useState(false)
    let [isOpenNoWarning, setIsOpenNoWarning] = useState(false)
    let [isOpenMove, setIsOpenMove] = useState(false)

    const orders = [
        { id: 1, name: 'Order 1', value: "O1" },
        { id: 2, name: 'Order 2', value: "02" },
        { id: 3, name: 'Order 3', value: "03" },
        { id: 4, name: 'Order 4', value: "04" },
        { id: 5, name: 'Order 5', value: "05" },
      ]
      
    const [selected, setSelected] = useState(null)
    const [selectedMultiple, setSelectedMultiple] = useState([])

    let tempData = [
        {
            "ID": "123456",
            "Pelat": "123456",
            "Tipe": "Wingbox",
            "Perusahaan": "PT. Makmur Sejahtera",
            "DC": "Jakarta Selatan"
        },
        {
            "ID": "123456",
            "Pelat": "123456",
            "Tipe": "Wingbox",
            "Perusahaan": "PT. Makmur Sejahtera",
            "DC": "Jakarta Selatan"
        },
        {
            "ID": "12312312",
            "Pelat": "123412312356",
            "Tipe": "Wingbox",
            "Perusahaan": "PT. Makmur Sejahtera",
            "DC": "Jakarta Selatan"
        },
    ]

    const columns = React.useMemo(
        () => [
          {
            Header: "ID Truk",
            accessor: "ID",
            Cell: props => {
              const { original } = props.cell.row;
              return ( <>
                <div
                    style={{
                      textAlign:"left",
                    }}
                  >{props.value}</div> </>
              )
            },
          },
          {
            Header: "Pelat",
            accessor: "Pelat",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "Tipe",
            accessor: "Tipe",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "Perusahaan",
            accessor: "Perusahaan",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "DC",
            accessor: "DC",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "Status",
            // accessor: "ID",
            Cell: StatusPill
        
          },
          {
            Header: "Action",
            accessor: (row) => [
                "1",
                "2"
              ],
            Cell: ActionButtons
          },
        ],
        []
      );

    return (
        <div className="">
            <div className="m-8 p-12 bg-gray-100 border border-gray-200 rounded-lg shadow">
                <h2>
                    Typography
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div className="text-center">
                    <p className="s-p-med">
                        Bermain kata adalah passion ku
                    </p>
                    <p className="m-p-med">
                        Bermain kata adalah passion ku
                    </p>
                    <p className="m-p-reg">
                        Bermain kata adalah passion ku
                    </p>
                    <h4>
                        Bermain kata adalah passion ku
                    </h4>
                    <h3>
                        Bermain kata adalah passion ku 
                    </h3>
                    <h2>
                        Bermain kata adalah passion ku 
                    </h2>
                    <h1>
                        Bermain kata adalah passion ku 
                    </h1>
                </div>
            </div>

            <div className="m-8 p-12 bg-gray-100 border border-gray-200 rounded-lg shadow">
                <h2>
                    Buttons
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div className="text-center space-x-4">
                    <Button className="text-button btn-primary" label="Button" useIcon={true}/>
                    <Button className="text-button btn-danger" label="Button"/>
                    <Button className="text-button btn-warning" label="Button"/>
                    <Button className="text-button btn-success" label="Button"/>
                </div>
                <div className="text-center mt-4 space-x-4">
                    <Button className="text-button btn-primary-outline" label="Button"/>
                    <Button className="text-button btn-danger-outline" label="Button"/>
                    <Button className="text-button btn-warning-outline" label="Button"/>
                    <Button className="text-button btn-success-outline" label="Button"/>
                </div>

                <h2>
                    Radio
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div className="text-center">
                    <label className="flex radio p-2 cursor-pointer">
                        <input className="my-auto accent-primary border-0" type="radio" name="field"/>
                        <p className="m-p-reg px-2">Radio</p>
                    </label>
                    <label className="flex radio p-2 cursor-pointer">
                        <input className="my-auto accent-primary" type="radio" name="field"/>
                        <p className="m-p-reg px-2">Radio</p>
                    </label>

                </div>

                <h2>
                    Checkbox
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div>
                    <div className="flex items-center p-2">
                        <input id="default-checkbox" type="checkbox" value="" className="accent-primary bg-gray-100 border-gray-300 rounded"/>
                        <label for="default-checkbox" className="ml-2 m-p-reg">Checkbox</label>
                    </div>
                    <div className="flex items-center p-2">
                        <input id="default-checkbox" type="checkbox" value="" className="accent-primary bg-gray-100 border-gray-300 rounded"/>
                        <label for="default-checkbox" className="ml-2 m-p-reg">Checkbox</label>
                    </div>
                </div>

                <h2>
                    Toggle
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <Toggle label="Enable notifications" value={agreed} onChange={setAgreed} />
            </div>

            <div className="m-8 p-12 bg-gray-100 border border-gray-200 rounded-lg shadow">
                <h2>
                    Text Fields
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div>
                    <TextField label="Order" placeholder="Order" helper="Helper"/>

                    <TextField label="Order" placeholder="Order" helper="Helper" disabled={true}/>

                    <TextField label="Order" placeholder="Order" helper="Helper" required={true}/>
                    
                    <TextField label="Order" placeholder="Order" helper="Helper" required={true} disabled={true}/>
                </div>

                <h2>
                    Dropdown
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div>
                    <Dropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selected} onChange={setSelected}/>

                    <Dropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selected} onChange={setSelected} disabled={true}/>

                    <Dropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selected} required={true} onChange={setSelected}/>

                    <Dropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selected} required={true} onChange={setSelected} disabled={true}/>

                    <MultipleDropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selectedMultiple} onChange={setSelectedMultiple}/>

                    <MultipleDropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selectedMultiple} onChange={setSelectedMultiple} disabled={true}/>

                    <MultipleDropdown placeholder="Order" label="Order" helper="Choose Order" data={orders} value={selectedMultiple} required={true} onChange={setSelectedMultiple}/>
                </div>
            </div>

            <div className="m-8 p-12 bg-gray-100 border border-gray-200 rounded-lg shadow">
                <h2>
                    Modals
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <div className="">
                    <div className="flex items-center justify-center space-x-4">
                        <Button className="text-button btn-primary" label="Logout" onClick={() => setIsOpenPrimary(true)}/>
                        <Modal variant="primary" isOpen={isOpenPrimary} closeModal={() => setIsOpenPrimary(false)} title="Keluar" description="Anda yakin ingin keluar dari akun?" warningDesc="Anda akan keluar dari akun" rightButtonText="Yakin" onClickRight={() => {
                            setIsOpenNoWarning(true)
                            setIsOpenPrimary(false)
                        }} leftButtonText="Batal"/>

                        <Button className="text-button btn-danger" label="Logout" onClick={() => setIsOpenDanger(true)}/>
                        <Modal variant="danger" isOpen={isOpenDanger} closeModal={() => setIsOpenDanger(false)} title="Keluar" description="Anda yakin ingin keluar dari akun?" warningDesc="Anda akan keluar dari akun" rightButtonText="Yakin" onClickRight={() => {
                            setIsOpenNoWarning(true)
                            setIsOpenDanger(false)
                        }} leftButtonText="Batal"/>

                        <Button className="text-button btn-warning" label="Logout" onClick={() => setIsOpenWarning(true)}/>
                        <Modal variant="warning" isOpen={isOpenWarning} closeModal={() => setIsOpenWarning(false)} title="Keluar" description="Anda yakin ingin keluar dari akun?" warningDesc="Anda akan keluar dari akun" rightButtonText="Yakin" onClickRight={() => {
                            setIsOpenNoWarning(true)
                            setIsOpenWarning(false)
                        }} leftButtonText="Batal"/>

                        <Modal variant="danger" isOpen={isOpenNoWarning} closeModal={() => setIsOpenNoWarning(false)} description="Anda telah keluar dari akun" rightButtonText="Selesai"/>

                        <Button className="text-button btn-primary" label="Move other Truck" onClick={() => setIsOpenMove(true)}/>
                        {/* <ModalMoveOrder
                            isOpen={isOpenMove} 
                            closeModal={() => setIsOpenMove(false)} 
                            title="Pindahkan Order" 
                            description="Anda yakin ingin keluar dari akun?" 
                            warningDesc="Dengan memindahkan order ke truk lain, rute pengiriman juga akan berubah." 
                            rightButtonText="Yakin" 
                            onClickRight={() => {
                                setIsOpenNoWarning(true)
                                setIsOpenWarning(false)}
                                } 
                            leftButtonText="Batal"/> */}
                    </div>
                </div>
            </div>

            <div className="m-8 p-12 bg-gray-100 border border-gray-200 rounded-lg shadow">
                <h2>
                    Table
                </h2>
                <hr className="h-px bg-gray-700 border-0 m-4"></hr>
                <BaseTable columns={columns} data={tempData} dataLength={tempData.length} judul={`Truk`}/>
            </div>
        </div>

        
    )
}

export default SystemDesign;