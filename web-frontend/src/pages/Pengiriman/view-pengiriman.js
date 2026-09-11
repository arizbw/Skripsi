import BaseTable, { SelectColumnFilter, ActionButtons } from "../../components/BaseTable";
import React, { useEffect, useState } from "react";
import { Loading } from "../../components/Loading";
import axiosAuthInstance from "../../utils/axios-auth-instance";
import { TrukPercentage } from "../../components/TrukPercentage";
import { Tab } from '@headlessui/react'
import { classNames, formatEta, formatTravelDistance, formatTravelTime } from "../../utils/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { BsInfoCircle } from "react-icons/bs";
import GoogleMap from "../../components/GoogleMap";

function ViewPengiriman() {
    const location = useLocation();
    const navigate = useNavigate();
    const pengirimanId = location.state.id;
    const [showLoading, setShowLoading] = useState(false); 
    const [dataPengiriman, setDataPengiriman] = useState({});
    const [getDataPengiriman, setGetDataPengiriman] = useState(false);
    
    useEffect(() => {
        if (getDataPengiriman === false) {
          axiosAuthInstance.get("/api/shipment/" + pengirimanId).then((response) => {            
            let fetchedData = response.data.data;
            setDataPengiriman(updateAllManifestCoords(fetchedData));
            setShowLoading(false);
            setGetDataPengiriman(true)
          });
        }
    }, [getDataPengiriman]);

    const updateAllManifestCoords = (fetchedData) => {
        if (fetchedData.manifests && fetchedData.manifests.length > 0) {
            fetchedData.manifests.forEach(manifest => {
                manifest.all_coords = JSON.parse(manifest.all_coords)
            });
        }
        return fetchedData;
    };

    const columns = React.useMemo(
        () => [
            {
            id: "order_num",
            Header: "Nomor Order",
            accessor: "order_num",
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
            Header: "ETA",
            accessor: "eta",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            Cell: props => {
                const etaDate = new Date(props.value);
                const year = etaDate.getFullYear();
                const month = String(etaDate.getMonth() + 1).padStart(2, "0");
                const day = String(etaDate.getDate()).padStart(2, "0");
                const formattedETA = `${day}-${month}-${year}`;
                return formattedETA;
            },
            },
            {
            Header: "Asal",
            accessor: "loc_ori.name",
            Filter: SelectColumnFilter,
            filter: 'includes',
            },
            {
            Header: "Destinasi",
            accessor: "loc_dest.name",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            },
            {
            Header: "Volume (ml)",
            accessor: "volume",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            },
            {
            id: "action",
            Header: "Action",
            accessor: (row) => [
                "Order",
                row.id
            ],
            // Cell: ActionButtons
            Cell: props => {
                return ( <>
                  <div className="">
                    {ActionButtons({value: props.value, viewPengiriman: true})}
                  </div> 
                  </>
                )
              },
            },
        ],
        []
    );

    const columnsDibatalkan = React.useMemo(
        () => [
            {
            id: "order_num",
            Header: "Nomor Order",
            accessor: "order_num",
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
            Header: "ETA",
            accessor: "eta",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            Cell: props => {
                const etaDate = new Date(props.value);
                const year = etaDate.getFullYear();
                const month = String(etaDate.getMonth() + 1).padStart(2, "0");
                const day = String(etaDate.getDate()).padStart(2, "0");
                const formattedETA = `${day}-${month}-${year}`;
                return formattedETA;
            },
            },
            {
            Header: "Asal",
            accessor: "loc_ori.name",
            Filter: SelectColumnFilter,
            filter: 'includes',
            },
            {
            Header: "Destinasi",
            accessor: "loc_dest.name",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            },
            {
            Header: "Volume (ml)",
            accessor: "volume",
            Filter: SelectColumnFilter,  
            filter: 'includes',
            },
            {
                Header: "Quantity",
                accessor: "quantity",
                Filter: SelectColumnFilter,  
                filter: 'includes',
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

    return (
      <>
        <Loading visibility={showLoading} />
        {
            getDataPengiriman == true ?
                <>
                    <div className={`px-[50px] pt-[30px] ${showLoading ? "hidden" : "visible"}`}>
                        <div className="p-8 bg-white rounded-lg">
                            <p className="small-header">
                                Nomor Pengiriman
                            </p>
                            <h3 className="pt-4 text-primary">
                                {dataPengiriman.shipment_num}
                            </h3>

                            <div class="grid grid-cols-4 pt-4">
                                <div className='col-span-1 text-left border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-med'>Estimate Time Arrival (ETA)</p>
                                </div>
                                <div className='col-span-3 text-right border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-reg'>{formatEta(dataPengiriman.eta)}</p>
                                </div>

                                <div className='col-span-1 text-left border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-med'>Total Jarak Tempuh</p>
                                </div>
                                <div className='col-span-3 text-right border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-reg'>{formatTravelDistance(dataPengiriman.total_dist)}</p>
                                </div>

                                <div className='col-span-1 text-left border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-med'>Total Waktu Tempuh</p>
                                </div>
                                <div className='col-span-3 text-right border-b border-neutral-40 pt-4 pb-2'>
                                    <p className='m-p-reg'>{formatTravelTime(dataPengiriman.total_time_with_waiting)}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className={`px-[50px] py-[30px] ${showLoading ? "hidden" : "visible"}`}>
                        <div className="bg-white rounded-lg overflow-hidden">
                            <Tab.Group>
                                <Tab.List className="flex bg-primary-hover pt-2">
                                {
                                    dataPengiriman.manifests.map((manifest, index) => (
                                        <>
                                                <Tab
                                                    className={({ selected }) =>
                                                        classNames(
                                                            'ml-2 px-3 py-2.5 m-p-med rounded-t-lg',
                                                            selected ? 'bg-white text-primary-hover' : 'text-neutral-10 bg-primary-hover hover:text-white'
                                                        )
                                                    }
                                                    onClick={() => changeTab()}
                                                >
                                                    Truk {manifest.truck_id}
                                                </Tab>

                                        </>
                                    ))
                                }
                                </Tab.List>
                                <Tab.Panels>
                                {
                                    dataPengiriman.manifests.map((manifest, index) => (
                                        <>
                                            <Tab.Panel>
                                                <div className="p-8 bg-white rounded-lg">
                                                    <p className="text-primary font-inter font-semibold text-[16px]">
                                                        Informasi Truk
                                                    </p>
                                                    {/* <div className="grid grid-cols-2 h-full pb-[30px]">
                                                        <div className='col-span-1 text-left flex flex-col justify-end'> */}
                                                    <div className="flex justify-between h-full pb-[30px]">
                                                        <div className='flex-1 flex flex-col justify-end min-w-0'>
                                                            <div class="grid grid-cols-2 pr-[30px]">
                                                                <div className='col-span-1 text-left border-b border-neutral-40 p-2 mt-[10px]'>
                                                                    <p className=' m-p-med'>Plat Kendaraan</p>
                                                                </div>
                                                                <div className='col-span-1 text-right m-p-reg border-b border-neutral-40 p-2 mt-[10px]'>
                                                                    <p className='m-p-reg'>{manifest.truck.plate_number}</p>
                                                                    {console.log(manifest.truck)}
                                                                </div>
                                                                <div className='col-span-1 text-left m-p-med border-b border-neutral-40 p-2'>
                                                                    <p className='m-p-med'>Tipe Kendaraan</p>
                                                                </div>
                                                                <div className='col-span-1 text-right m-p-reg border-b border-neutral-40 p-2 break-all'>
                                                                    <p className='m-p-reg'>{manifest.truck.type.name}</p>
                                                                </div>
                                                                <div className='col-span-1 text-left m-p-med border-b border-neutral-40 p-2'>
                                                                    <p className='m-p-med'>Asal Perusahaan</p>
                                                                </div>
                                                                <div className='col-span-1 text-right m-p-reg border-b border-neutral-40 p-2 break-all'>
                                                                    <p className='m-p-reg'>{manifest.truck.company.name}</p>
                                                                </div>
                                                                <div className='col-span-1 text-left m-p-med border-b border-neutral-40 p-2'>
                                                                    <p className='m-p-med'>Distribution Center (DC) </p>
                                                                </div>
                                                                <div className='col-span-1 text-right m-p-reg border-b border-neutral-40 p-2 break-all'>
                                                                    <p className='m-p-reg'>{manifest.truck.dc.name}</p>
                                                                </div>
                                                                <div className='col-span-1 text-left m-p-med border-b border-neutral-40 p-2'>
                                                                    <p className='m-p-med'>Volume Maksimal Kendaraan (m)</p>
                                                                </div>
                                                                <div className='col-span-1 text-right m-p-reg border-b border-neutral-40 p-2 break-all'>
                                                                    <p className='m-p-reg'>{manifest.truck.type.max_capacity_volume}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* <div className='col-span-1 flex flex-col justify-end m-p-reg'> */}
                                                        <div className='ml-auto m-p-reg'>
                                                            <TrukPercentage max_volume={manifest.truck.type.max_capacity_volume} total_volume={manifest.total_volume} 
                                                            // percentage={Math.ceil((manifest.total_volume / (manifest.truck.type.max_capacity_volume)) * 100)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <p className="text-primary font-inter font-semibold text-[16px]">
                                                        Rute Pengiriman
                                                    </p>
                                                    <div className="grid grid-cols-5 max-h-[400px] pb-[30px]">
                                                        <div className='col-span-3 text-left p-2'>
                                                            {
                                                                (() => {
                                                                    const coords = manifest.all_coords;
                                                                    const manifestCenter = [coords[0][0], coords[0][1]];
                                                                    const manifestPolyline = coords;
                                                                    const manifestMarkers = [
                                                                        {
                                                                            lat: coords[0][0],
                                                                            lng: coords[0][1],
                                                                            color: 'green',
                                                                            popup: (
                                                                                <div><p><b>Stop 0</b></p><p>{dataPengiriman.dc?.name || 'DC Banten'}</p></div>
                                                                            ),
                                                                        },
                                                                        ...manifest.manifestLocations.map((loc, index) => ({
                                                                            lat: loc.location.latitude,
                                                                            lng: loc.location.longitude,
                                                                            label: index + 1,
                                                                            popup: (
                                                                                <div>
                                                                                    <p><b>Stop {index + 1}</b></p>
                                                                                    <p>{loc.location.name}</p>
                                                                                    <p>{loc.location.address}</p>
                                                                                </div>
                                                                            ),
                                                                        })),
                                                                    ];
                                                                    return (
                                                                        <GoogleMap
                                                                            center={manifestCenter}
                                                                            zoom={10}
                                                                            height="360px"
                                                                            polyline={manifestPolyline}
                                                                            polylineColor="#FF0000"
                                                                            markers={manifestMarkers}
                                                                            mapKey={mapKey}
                                                                        />
                                                                    );
                                                                })()
                                                            }
                                                        </div>
                                                        <div className='col-span-2 text-left p-2'>
                                                            <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                                                <div className="p-4 border-b">
                                                                    <p className="m-p-reg">Starting At</p>
                                                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                                                        <div>
                                                                            <p className="m-p-med text-primary">{dataPengiriman.dc.name}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="s-p-reg text-primary">{formatEta(manifest.etd)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {manifest.manifestLocations.map((location, index) => (
                                                                    <div key={location.id} className="p-4 border-b">
                                                                        <div className="flex justify-between items-center">
                                                                            <p className="m-p-med">{`${index + 1}.`} {location.location.name}</p>
                                                                            <BsInfoCircle className="text-lg" title="Service Time 15 menit"/>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-1 pt-1">
                                                                            <div>
                                                                                <p className="s-p-reg text-neutral-60">Estimation Time Arrival (ETA)</p>
                                                                                <p className="s-p-reg text-neutral-60">Waktu Tempuh</p>
                                                                                <p className="s-p-reg text-neutral-60">Jarak Tempuh</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="s-p-med text-primary">{formatEta(location.eta)}</p>
                                                                                <p className="s-p-med text-primary">{formatTravelTime(location.travel_time)}</p>
                                                                                <p className="s-p-med text-primary">{formatTravelDistance(location.travel_distance)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-primary font-inter font-semibold text-[16px]">
                                                        Data Order
                                                    </p>
                                                    <div>
                                                        <BaseTable columns={
                                                            dataPengiriman.status === 'DIBATALKAN' ?
                                                            columnsDibatalkan :
                                                            columns
                                                        } data={manifest.orders} dataLength={manifest.orders.length} judul={`Order`} viewPengiriman={true}/>
                                                    </div>
                                                </div>
                                            </Tab.Panel>
                                        </>
                                    ))
                                }
                                </Tab.Panels>
                            </Tab.Group>
                        </div>

                    </div>
                </>
            : null
        }
      </>
    )
}

export default ViewPengiriman;