import { useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Loading } from "../../components/Loading";
import Button from "../../components/Button";
import axiosAuthInstance from "../../utils/axios-auth-instance";
import { TrukPercentage } from "../../components/TrukPercentage";
import GoogleMap from "../../components/GoogleMap";
import { Tab } from '@headlessui/react';
import { classNames } from "../../utils/utils";
import BaseTable, { SelectColumnFilter } from "../../components/BaseTable";
import { ActionButtons} from "../../components/BaseTable";
import { Modal } from "../../components/Modal";

function CreatePengirimanVisualisasiCluster() {
    let navigate = useNavigate();
    const [showLoading, setShowLoading] = useState(false);
    const location = useLocation();
    const dataCluster = location.state.dataCluster;
    const dc_id = location.state.dcID;
    const userRole= localStorage.getItem("userRole");    

    const [isOpenConfirmation, setIsOpenConfirmation] = useState(false); 
    const [isOpenError, setIsOpenError] = useState(false); 
    const [isOpenSuccess, setIsOpenSuccess] = useState(false);

    const hasNegativeOne = '-1' in dataCluster;
    const nonNegativeOneClusters = Object.keys(dataCluster).filter(key => key !== '-1').reduce((obj, key) => {
        obj[key] = dataCluster[key];
        return obj;
    }, {});

    let negativeOneCluster;
    if (hasNegativeOne) {
        negativeOneCluster = dataCluster['-1'];
    }
    else {
        negativeOneCluster = []
    }

    function getAllOrdersCount() {
        return Object.entries(nonNegativeOneClusters).reduce((count, [key, cluster]) => {
            return count + cluster.orders.length;
        }, 0); 
    }
      
    function getNegativeOneOrdersCount() {
        return hasNegativeOne? negativeOneCluster.orders.length : 0;
    }

    const columns = React.useMemo(
        () => [
          {
            Header: "Nomor Order",
            accessor: "order_num",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "ETA Target",
            accessor: "eta_target",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            Cell: props => {
              const date = new Date(props.value);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              const formattedDate = `${day}-${month}-${year}`;
              return formattedDate;
            },
          },
          {
            Header: "Asal",
            accessor: "loc_ori.name",
          },
          {
            Header: "Destinasi",
            accessor: "loc_dest.name",
          },
          {
            Header: "Volume (ml)",
            accessor: "volume",
            Filter: SelectColumnFilter,  
            filter: 'includes',
          },
          {
            Header: "Keterangan",
            Cell: props => {
                return ( <>
                  <div className="flex text-danger-hover">
                    Truk Penuh
                  </div> 
                  </>
                )
              },
          },
          {
            id: "action",
            Header: "Action",
            accessor: (row) => [
              "Order",
              row.id
            ],
            Cell: props => {
              return ( <>
                <div className="flex justify-center items-center">
                  {ActionButtons({value: props.value, createCluster: true})}
                </div> 
                </>
              )
            },
          },
        ],
        []
      );

    //init maps
    const [mapKey, setMapKey] = useState(Date.now());
    const mapStyles = {
        height: "100%",
        width: "100%",
    };

    const changeTab = () => {
        setMapKey(Date.now());
    };

    const createPengiriman = async (e) => {
        e.preventDefault();
        setIsOpenConfirmation(false);
        setShowLoading(true);
        const dataClusterRequest = JSON.parse(JSON.stringify(nonNegativeOneClusters));
        const manifestID = []
        
        for (const clusterKey of Object.keys(dataClusterRequest)) {
            dataClusterRequest[clusterKey].orders = dataClusterRequest[clusterKey].orders.map(order => order.id);
            dataClusterRequest[clusterKey].location_routes = dataClusterRequest[clusterKey].location_routes.map(location => location.id);
            dataClusterRequest[clusterKey].all_coords = JSON.stringify(dataClusterRequest[clusterKey].all_coords)

            const singleManifestData = {
                [clusterKey]: dataClusterRequest[clusterKey]
            };

            const response = await axiosAuthInstance.post("/api/manifest", singleManifestData);
            if (response.status === 200) {
                manifestID.push(response.data.data.id);
            }
        };

        if (manifestID.length === Object.keys(dataClusterRequest).length) {
            try {    
                const shipmentRequest = {
                    "manifests": manifestID,
                    'dc_id': parseInt(dc_id)
                };
                const response = await axiosAuthInstance.post("/api/shipment", shipmentRequest);
            
                if (response.status === 200) {
                    setShowLoading(false);
                    setIsOpenSuccess(true);
                }
            } catch (err) {
                setShowLoading(false);
            
                if (err.response && err.response.data && err.response.data.error) {
                    console.log(err.response.data.error);
                } else {
                    console.log("An error occurred:", err);
                }
                setIsOpenError(true);
            }
        }
    };

    return (
        <div className={`relative pb-[30px] ${showLoading ? 'h-full' : null}`}>
            <Loading visibility={showLoading} />
            <Modal variant="primary" isOpen={isOpenConfirmation} closeModal={() => setIsOpenConfirmation(false)} title="Pengiriman" description="Anda yakin ingin menyimpan pengiriman baru?" rightButtonText="Yakin" 
            onClickRight={createPengiriman} leftButtonText="Batal"/>

            <Modal variant="primary" isOpen={isOpenSuccess} closeModal={() => setIsOpenSuccess(false)} description="Berhasil menyimpan pengiriman baru." rightButtonText="Selesai" onClickRight={() => navigate("/pengiriman")}/>
            <Modal variant="danger" isOpen={isOpenError} closeModal={() => setIsOpenError(false)} description="Gagal menyimpan pengiriman baru." rightButtonText="Ulangi"/>
            <div className={`px-[50px] pt-[30px] ${showLoading ? "hidden" : "visible"}`}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-inset-outline ">
                    <div className="py-4 px-6 bg-primary-hover">
                        {userRole === "Super"? 
                            <h4 className="text-white">3. Visualisasi Hasil Clustering</h4>
                            :
                            <h4 className="text-white">2. Visualisasi Hasil Clustering</h4>
                        }
                    </div>
                    <Tab.Group>
                        <Tab.List className="flex bg-primary-border pt-2 px-3">
                            {Object.keys(nonNegativeOneClusters).length > 0 && (
                            <Tab
                                className={({ selected }) =>
                                    classNames(
                                        'px-4 py-2 m-p-med rounded-t-lg',
                                        selected ? 'bg-white text-primary-hover' : 'text-neutral-10 bg-primary-border hover:text-primary-hover'
                                    )
                                }
                                onClick={() => changeTab()}
                            >
                                {`Berhasil (${getAllOrdersCount()} Order)`}
                            </Tab>
                            )}
                            {hasNegativeOne && (
                            <Tab
                                className={({ selected }) =>
                                    classNames(
                                        'px-4 py-2 m-p-med rounded-t-lg',
                                        selected ? 'bg-white text-primary-hover' : 'text-neutral-10 bg-primary-border hover:text-primary-hover'
                                    )
                                }
                                onClick={() => changeTab()}
                            >
                                {`Gagal (${getNegativeOneOrdersCount()} Order)`}
                            </Tab>
                            )}
                        </Tab.List>
                        <Tab.Panels>
                            {Object.keys(nonNegativeOneClusters).length > 0 && (
                            <Tab.Panel>
                                {/* Render non -1 clusters or all clusters if there is no -1 */}
                                {Object.entries(nonNegativeOneClusters).map(([key, cluster]) => (
                                    <div className="p-4 bg-white rounded-lg">
                                        <div className="mt-4 p-8 bg-white rounded-lg border-[1px] border-neutral-30">
                                            <div key={key} className="flex items-end">
                                                <div className='text-right m-p-reg border-r border-neutral-40 border-1 pr-3'>
                                                    <p className='small-header'>{`Truk ${key}`}</p>
                                                </div>
                                                <div className='text-left m-p-med border-neutral-40 pl-3'>
                                                    <p className='m-p-med'>{nonNegativeOneClusters[key].truck.type.name}</p>
                                                </div>
                                            </div>
                                            {/* <div className="grid grid-cols-2 px-20 pt-10"> */}
                                            <div className="flex justify-between pt-10 pr-10">
                                                {/* <div className='col-span-1 text-left p-2'> */}
                                                <div className='flex-1 p-2'>
                                                    <TrukPercentage max_volume={nonNegativeOneClusters[key].max_capacity} total_volume={nonNegativeOneClusters[key].current_capacity}/>
                                                    {/* <TrukPercentage percentage={Math.ceil((nonNegativeOneClusters[key].current_capacity / nonNegativeOneClusters[key].max_capacity) * 100)} /> */}
                                                </div>
                                                <div className='flex-1 m-p-reg pl-10'>
                                                    {
                                                        (() => {
                                                            const coords = nonNegativeOneClusters[key].all_coords;
                                                            const clusterCenter = [coords[0][0], coords[0][1]];
                                                            const clusterPolyline = coords;
                                                            const clusterMarkers = [
                                                                {
                                                                    lat: coords[0][0],
                                                                    lng: coords[0][1],
                                                                    color: 'green',
                                                                    popup: (
                                                                        <div><p><b>Stop 0</b></p><p>DC Banten</p></div>
                                                                    ),
                                                                },
                                                                ...nonNegativeOneClusters[key].location_routes.map((location, index) => ({
                                                                    lat: location.latitude,
                                                                    lng: location.longitude,
                                                                    label: index + 1,
                                                                    popup: (
                                                                        <div>
                                                                            <p><b>Stop {index + 1}</b></p>
                                                                            <p>{location.name}</p>
                                                                            <p>{location.address}</p>
                                                                        </div>
                                                                    ),
                                                                })),
                                                            ];
                                                            return (
                                                                <GoogleMap
                                                                    center={clusterCenter}
                                                                    zoom={10}
                                                                    height="400px"
                                                                    polyline={clusterPolyline}
                                                                    polylineColor="#FF0000"
                                                                    markers={clusterMarkers}
                                                                    mapKey={mapKey}
                                                                />
                                                            );
                                                        })()
                                                    }
                                                </div>
                                            </div>
                                            <div className="pt-8">
                                                <p className="m-p-med">Order Terpilih</p>
                                                {/* <div className={`overflow-x-auto grid grid-flow-col grid-rows-3 gap-y-4 max-w-[100%] pt-2`}>
                                                    {dataCluster[key].orders.map((order, index) => (
                                                        <div key={index} className="p-2 max-w-[150px]">
                                                        <p className="m-p-reg">{`- ${order.order_num}`}</p>
                                                        </div>
                                                    ))}
                                                </div> */}
                                                {/* <div className="overflow-x-auto max-w-[100%] pt-2">
                                                    <div className="grid grid-flow-row grid-cols-7 gap-y-4">
                                                        {dataCluster[key].orders.map((order, index) => (
                                                            <div key={index} className="p-2 max-w-[150px]">
                                                                <p className="m-p-reg">{`- ${order.order_num}`}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div> */}
                                                <div className="overflow-x-auto max-w-[100%] pt-2">
                                                    <div className="flex flex-wrap gap-4" style={{ maxHeight: 'calc(3 * 40px)' }}>
                                                        {dataCluster[key].orders.map((order, index) => (
                                                            <div key={index} className="p-2 min-w-[150px] h-[25px]">
                                                                <p className="m-p-reg">{`- ${order.order_num}`}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Tab.Panel>
                            )}
                            {hasNegativeOne && (
                                <Tab.Panel>
                                    {/* Render cluster -1 data here */}
                                    <div className="p-4 bg-white rounded-lg">
                                        <BaseTable columns={columns} data={negativeOneCluster.orders} dataLength={negativeOneCluster.orders.length} judul={`Order`} createCluster={true}/>
                                    </div>
                                </Tab.Panel>
                            )}
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>

            <div className={`flex justify-center gap-4 pt-4 ${showLoading ? "hidden" : "visible"}`}>
                <Button className="text-button btn-primary-outline" label="Kembali" onClick={() => navigate("/pengiriman")}/>
                <Button className="text-button btn-primary" label="Simpan" onClick={() => setIsOpenConfirmation(true)}/>
            </div>
        </div>
    )
}

export default CreatePengirimanVisualisasiCluster;