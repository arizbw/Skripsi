import userService from "../services/user-service.js";
import { HTTPResponse } from "../utils/response.js";

const loginUserWebController = async (request, response, next) => {
  try {
    const result = await userService.loginUserWebService(request);
    response
      .status(200)
      .json(HTTPResponse(true, 200, "Success", { token: result }, null));
  } catch (error) {
    next(error);
  }
};

const loginUserMobileController = async (request, response, next) => {
  try {
    const result = await userService.loginUserMobileService(request);
    response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
  } catch (error) {
    next(error);
  }
};

const registerUserController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_user) {
      const result = await userService.registerUserService(request);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const updateUserController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_user) {
      const result = await userService.updateUserService(request);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const refreshTokenController = async (request, response, next) => {
  try {
    const result = await userService.refreshTokenService(request);
    response
      .status(200)
      .json(
        HTTPResponse(true, 200, "Success", { refresh_token: result }, null)
      );
  } catch (error) {
    next(error);
  }
};

const activateUserController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_user) {
      const result = await userService.activateUserService(request);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const deactivateUserController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_user) {
      const result = await userService.deactivateUserService(request);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const getAllUserController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_user) {
      const result = await userService.getAllUsersService();
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const logoutUserController = async (request, response, next) => {
  try {
    const result = await userService.logoutUserService(request);
    response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
  } catch (error) {
    next(error);
  }
};

const dashboardController = async (request, response, next) => {
  try {
    if (!["Admin DC Jakarta", "Admin DC Banten", "Super"].includes(request.decodedToken.role.name)) {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    } else {
      const result = await userService.dashboardService(
        request.decodedToken.role.dc_id
      );
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    }
  } catch (error) {
    next(error);
  }
};

const dashboardAdminController = async (request, response, next) => {
  try {
    if (request.decodedToken.role.name !== "Super") {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    } else {
      const result = await userService.dashboardServiceAdmin();
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    }
  } catch (error) {
    next(error);
  }
};

export default {
  loginUserWebController,
  loginUserMobileController,
  registerUserController,
  updateUserController,
  refreshTokenController,
  activateUserController,
  deactivateUserController,
  getAllUserController,
  logoutUserController,
  dashboardController,
  dashboardAdminController,
};
