import { HTTPResponse } from "../utils/response.js";
import { getAllRoleService } from "../services/role-service.js";

const getAllRoleController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.is_allowed_user && type === "web") {
      const result = await getAllRoleService();
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

export { getAllRoleController };
