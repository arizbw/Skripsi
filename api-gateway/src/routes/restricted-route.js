import express from "express";
import { jwtMiddleware } from "../middlewares/jwt-middleware.js";
import userController from "../controllers/user-controller.js";
import {
  getAllDOAdminController,
  getAllDOController,
  getDOByIDController,
  createDOController,
  updateDOController,
} from "../controllers/delivery-order-controller.js"; //DO
import {
  getAllLocationsAdminController,
  getAllLocationsController,
  getLocationByIdController,
  createLocationController,
  updateLocationController,
} from "../controllers/location-controller.js"; //LOCATION
import {
  getAllTruckAdminController,
  getAllTrucksController,
  getTruckByIDController,
  createTruckController,
  updateTruckController,
  getAllTruckTypesController,
} from "../controllers/truck-controller.js"; //TRUCK
import { getAllRoleController } from "../controllers/role-controller.js"; //ROLE
import { getAllDCController } from "../controllers/dc-controller.js"; //DC
import { getAllProductController } from "../controllers/product-controller.js"; //PRODUCT
import { getAllProductLineController } from "../controllers/product-line-controller.js"; //PRODUCTLINE
import {
  getAllShipmentAdminController,
  getAllShipmentController,
  getAllMobileShipmentsController,
  searchAllMobileShipmentsController,
  getDetailMobileShipmentController,
  getDetailShipmentWebController,
  simpanShipmentStatusController,
  getBoxLayoutingCoordinatesController,
  updateTruckTypeInShipmentController,
} from "../controllers/shipment-controller.js"; //SHIPMENT
import {
  getAllCustomersController,
  getCustomerByIdController,
} from "../controllers/customers-controller.js"; //CUSTOMER
import { priorityOptimizationController, bulkSaveShipmentController } from "../controllers/optimization-controller.js"; //OPTIMIZATION
import {
  addBoxToDOController,
  boxDimensionCalculation,
  deleteBoxByIdController,
  getBoxByNameController,
  getAllBoxesController,
  createBoxController,
} from "../controllers/box-controller.js"; // BOX
import {
  getChatHistoryController,
  saveChatMessagesController,
  getChatSessionsController,
  createChatSessionController,
  deleteChatSessionController,
} from "../controllers/chat-history-controller.js"; // CHAT HISTORY

const restrictedRouter = express.Router();
restrictedRouter.use(jwtMiddleware);

// chat history
restrictedRouter.get("/api/v1/chat-history", getChatHistoryController);
restrictedRouter.post("/api/v1/chat-messages", saveChatMessagesController);
restrictedRouter.get("/api/v1/chat-sessions", getChatSessionsController);
restrictedRouter.post("/api/v1/chat-sessions", createChatSessionController);
restrictedRouter.delete("/api/v1/chat-sessions/:sessionId", deleteChatSessionController);

//user
/**
 * @swagger
 * /api/v1/user:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created
 */
restrictedRouter.post("/api/v1/user", userController.registerUserController);

/**
 * @swagger
 * /api/v1/user:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               username:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone_num:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.put("/api/v1/user", userController.updateUserController);
/**
 * @swagger
 * /api/v1/refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
restrictedRouter.post(
  "/api/v1/refresh-token",
  userController.refreshTokenController
);
/**
 * @swagger
 * /api/v1/activate-user:
 *   post:
 *     summary: Activate a user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post(
  "/api/v1/activate-user",
  userController.activateUserController
);

/**
 * @swagger
 * /api/v1/deactivate-user:
 *   post:
 *     summary: Deactivate a user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post(
  "/api/v1/deactivate-user",
  userController.deactivateUserController
);
/**
 * @swagger
 * /api/v1/administrator/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get(
  "/api/v1/administrator/users",
  userController.getAllUserController
);
/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
restrictedRouter.post("/api/v1/logout", userController.logoutUserController);

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard data for DC admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get("/api/v1/dashboard", userController.dashboardController);
/**
 * @swagger
 * /api/v1/administrator/dashboard:
 *   get:
 *     summary: Get dashboard data for super admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *       401:
 *         description: Unauthorized - Super admin only
 */
restrictedRouter.get(
  "/api/v1/administrator/dashboard",
  userController.dashboardAdminController
);

//delivery-order
/**
 * @swagger
 * /api/v1/administrator/delivery-orders:
 *   get:
 *     summary: Get all delivery orders (Admin)
 *     tags: [Delivery Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery orders
 */
restrictedRouter.get(
  "/api/v1/administrator/delivery-orders",
  getAllDOAdminController
);
/**
 * @swagger
 * /api/v1/delivery-orders:
 *   get:
 *     summary: Get all delivery orders for current DC
 *     tags: [Delivery Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery orders
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get("/api/v1/delivery-orders", getAllDOController);

/**
 * @swagger
 * /api/v1/delivery-orders:
 *   post:
 *     summary: Create a new delivery order
 *     tags: [Delivery Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Delivery Order Created
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post("/api/v1/delivery-orders", createDOController);

/**
 * @swagger
 * /api/v1/delivery-order/{doId}:
 *   get:
 *     summary: Get delivery order by ID
 *     tags: [Delivery Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery order ID
 *     responses:
 *       200:
 *         description: Delivery order details
 *       404:
 *         description: Delivery order not found
 */
restrictedRouter.get("/api/v1/delivery-order/:doId", getDOByIDController);
restrictedRouter.put("/api/v1/delivery-orders/:doId", updateDOController);

//locations
/**
 * @swagger
 * /api/v1/administrator/locations:
 *   get:
 *     summary: Get all locations (Admin)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all locations
 */
restrictedRouter.get(
  "/api/v1/administrator/locations",
  getAllLocationsAdminController
);

/**
 * @swagger
 * /api/v1/locations:
 *   get:
 *     summary: Get locations for current DC
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
 */
restrictedRouter.get("/api/v1/locations", getAllLocationsController);

/**
 * @swagger
 * /api/v1/location/{lokasiId}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lokasiId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location details
 *       404:
 *         description: Location not found
 */
restrictedRouter.get("/api/v1/location/:lokasiId", getLocationByIdController);

/**
 * @swagger
 * /api/v1/location:
 *   post:
 *     summary: Add a new location (Admin)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Location created successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post("/api/v1/location", createLocationController);

/**
 * @swagger
 * /api/v1/location:
 *   put:
 *     summary: Update an existing location (Admin)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.put("/api/v1/location", updateLocationController);

//trucks
/**
 * @swagger
 * /api/v1/administrator/trucks:
 *   get:
 *     summary: Get all trucks (Admin)
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all trucks
 */
restrictedRouter.get(
  "/api/v1/administrator/trucks",
  getAllTruckAdminController
);

/**
 * @swagger
 * /api/v1/trucks:
 *   get:
 *     summary: Get trucks for current DC
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trucks
 */
restrictedRouter.get("/api/v1/trucks", getAllTrucksController);

/**
 * @swagger
 * /api/v1/truck/{truckId}:
 *   get:
 *     summary: Get truck by ID
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: truckId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Truck ID
 *     responses:
 *       200:
 *         description: Truck details
 *       404:
 *         description: Truck not found
 */
restrictedRouter.get("/api/v1/truck/:truckId", getTruckByIDController);

/**
 * @swagger
 * /api/v1/truck-types:
 *   get:
 *     summary: Get all truck types
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of truck types
 */
restrictedRouter.get("/api/v1/truck-types", getAllTruckTypesController);

/**
 * @swagger
 * /api/v1/truck:
 *   post:
 *     summary: Add a new truck (Admin)
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Truck created successfully
 */
restrictedRouter.post("/api/v1/truck", createTruckController);

/**
 * @swagger
 * /api/v1/truck:
 *   put:
 *     summary: Update an existing truck
 *     tags: [Truck]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Truck updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Truck not found
 */
restrictedRouter.put("/api/v1/truck", updateTruckController);

//roles
/**
 * @swagger
 * /api/v1/administrator/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles
 */
restrictedRouter.get("/api/v1/administrator/roles", getAllRoleController);

//dc
/**
 * @swagger
 * /api/v1/dcs:
 *   get:
 *     summary: Get all distribution centers
 *     tags: [Distribution Center]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of distribution centers
 */
restrictedRouter.get("/api/v1/dcs", getAllDCController);

//product
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
restrictedRouter.get("/api/v1/products", getAllProductController);

//product-line
/**
 * @swagger
 * /api/v1/product-lines:
 *   get:
 *     summary: Get all product lines
 *     tags: [Product Line]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of product lines
 */
restrictedRouter.get("/api/v1/product-lines", getAllProductLineController);

//shipment
/**
 * @swagger
 * /api/v1/administrator/shipments:
 *   get:
 *     summary: Get all shipments (Admin)
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipments
 */
restrictedRouter.get(
  "/api/v1/administrator/shipments",
  getAllShipmentAdminController
);
/**
 * @swagger
 * /api/v1/shipments:
 *   get:
 *     summary: Get all shipments for current DC
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Paginated list of shipments
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get("/api/v1/shipments", getAllShipmentController);

/**
 * @swagger
 * /api/v1/mobile/shipments:
 *   get:
 *     summary: Get all shipments for mobile app
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of shipments
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get(
  "/api/v1/mobile/shipments",
  getAllMobileShipmentsController
);

/**
 * @swagger
 * /api/v1/mobile/shipment/search:
 *   get:
 *     summary: Search shipments for mobile app
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get(
  "/api/v1/mobile/shipment/search",
  searchAllMobileShipmentsController
);

/**
 * @swagger
 * /api/v1/mobile/shipment/{id}:
 *   get:
 *     summary: Get shipment details for mobile app
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipment not found
 */
restrictedRouter.get(
  "/api/v1/mobile/shipment/:id",
  getDetailMobileShipmentController
);

/**
 * @swagger
 * /api/v1/shipment/{id}:
 *   get:
 *     summary: Get shipment details for web app
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipment not found
 */
restrictedRouter.get("/api/v1/shipment/:id", getDetailShipmentWebController);

/**
 * @swagger
 * /api/v1/shipment/simpan/{shipmentNum}:
 *   patch:
 *     summary: Update shipment status to 'simpan'
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentNum
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipment number
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.patch(
  "/api/v1/shipment/simpan/:shipmentNum",
  simpanShipmentStatusController
);

/**
 * @swagger
 * /api/v1/priority-opt:
 *   post:
 *     summary: Run priority-based route optimization
 *     description: Optimizes delivery routes based on priority (distance, emission, or time)
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delivery_orders_id
 *               - priority
 *             properties:
 *               delivery_orders_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of delivery order IDs to optimize
 *               priority:
 *                 type: string
 *                 enum: [distance, emission, time]
 *                 description: Optimization priority mode
 *     responses:
 *       200:
 *         description: Optimization successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     shipments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failed_delivery_orders:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post("/api/v1/priority-opt", priorityOptimizationController);
restrictedRouter.post("/api/v1/priority-opt/bulk-save", bulkSaveShipmentController);

/**
 * @swagger
 * /api/v1/shipment/{id}/update-truck-type:
 *   post:
 *     summary: Update truck type for a shipment
 *     tags: [Shipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeId
 *             properties:
 *               typeId:
 *                 type: integer
 *                 description: Truck type ID (1 for Blind Van, 2 for CDE)
 *     responses:
 *       200:
 *         description: Truck updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post(
  "/api/v1/shipment/:id/update-truck-type",
  updateTruckTypeInShipmentController
);

//customers
/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
restrictedRouter.get("/api/v1/customers", getAllCustomersController);

/**
 * @swagger
 * /api/v1/customer/{customerId}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
restrictedRouter.get("/api/v1/customer/:customerId", getCustomerByIdController);

//box
/**
 * @swagger
 * /api/v1/delivery-order/{doId}/boxes:
 *   post:
 *     summary: Add boxes to a delivery order
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Box ID
 *                 quantity:
 *                   type: integer
 *                   default: 1
 *                   description: Quantity of boxes
 *     responses:
 *       201:
 *         description: Boxes linked successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post(
  "/api/v1/delivery-order/:doId/boxes",
  addBoxToDOController
);

/**
 * @swagger
 * /api/v1/box/{boxId}:
 *   delete:
 *     summary: Remove box from delivery order
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boxId
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID
 *       - in: query
 *         name: doId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery order ID
 *     responses:
 *       200:
 *         description: Box relation deleted successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.delete("/api/v1/box/:boxId", deleteBoxByIdController);

/**
 * @swagger
 * /api/v1/box/calculate:
 *   post:
 *     summary: Trigger box dimension calculation via ML service
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - box_id
 *             properties:
 *               box_id:
 *                 type: string
 *                 description: Box ID to calculate dimensions for
 *     responses:
 *       200:
 *         description: Dimension calculation triggered
 *       400:
 *         description: box_id is required
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post("/api/v1/box/calculate", boxDimensionCalculation);

/**
 * @swagger
 * /api/v1/box/search:
 *   get:
 *     summary: Search box by name
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Box name to search
 *     responses:
 *       200:
 *         description: Box found
 *       400:
 *         description: Parameter name required
 *       404:
 *         description: Box not found
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get("/api/v1/box/search", getBoxByNameController);

/**
 * @swagger
 * /api/v1/boxes:
 *   get:
 *     summary: Get all boxes
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all boxes
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.get("/api/v1/boxes", getAllBoxesController);

/**
 * @swagger
 * /api/v1/box:
 *   post:
 *     summary: Create a new box
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Box name
 *               length:
 *                 type: number
 *                 description: Box length in cm
 *               width:
 *                 type: number
 *                 description: Box width in cm
 *               height:
 *                 type: number
 *                 description: Box height in cm
 *               volume:
 *                 type: number
 *                 description: Box volume in cubic cm
 *               status:
 *                 type: string
 *                 description: Box status
 *     responses:
 *       201:
 *         description: Box created successfully
 *       401:
 *         description: Unauthorized
 */
restrictedRouter.post("/api/v1/box", createBoxController);

/**
 * @swagger
 * /api/v1/box-layouting/{idShipment}:
 *   post:
 *     summary: Get box layouting coordinates for a shipment
 *     description: Retrieves optimized 3D box layout coordinates for loading
 *     tags: [Box]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idShipment
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Box layouting coordinates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       502:
 *         description: Upstream optimization service error
 */
restrictedRouter.post(
  "/api/v1/box-layouting/:idShipment",
  getBoxLayoutingCoordinatesController
);

export { restrictedRouter };
