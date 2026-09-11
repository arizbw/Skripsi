export { Login } from './Login'
export { default as NotFound } from './notFound'
export { default as SystemDesign } from './system-design'

// ADMINISTRATOR
export { ViewAllProductLineAdmin } from './Administrator/ProductLine-Admin'
export { ViewAllProdukAdmin } from './Administrator/Produk-Admin'
export { ViewAllTruksAdmin, CreateTrukAdmin, UpdateTrukAdmin } from './Administrator/Truk-Admin'
export { ViewAllLokasiAdmin, ViewLokasiAdmin, CreateLokasiAdmin, UpdateLokasiAdmin } from './Administrator/Lokasi-Admin'
export { ViewAllUserAdmin, CreateUserAdmin, UpdateUserAdmin } from './Administrator/User-Admin'
export { ViewAllRoleAdmin, CreateRole, UpdateRole } from './Administrator/Role-Admin'
export { DashboardAdmin } from './Administrator/Dashboard-Admin'
export { ViewAllShipment, DoSelectAutomateAdmin } from './Administrator/Shipment-Admin'

// USER
export { ViewLocation, ViewAllLokasi } from './Lokasi'
export { ViewAllProduk } from './Produk'
export { ViewTrucks, ViewAllTrucks, ImportTruk, BulkCreateTruk, BulkUpdateTruk } from './Truk'
export { ViewAllPengiriman, CreatePengirimanSelectOrder, CreatePengirimanVisualisasiCluster, ViewPengiriman } from './Pengiriman'
export { ViewAllOrder, UpdateOrder } from './Order'
export { Dashboard } from './Dashboard'
export { ViewAllProductLine } from './ProductLine'