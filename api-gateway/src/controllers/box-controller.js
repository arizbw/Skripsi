import { HTTPResponse } from "../utils/response.js";
import {
  addBoxToDOService,
  deleteBoxByIdService,
  updateBoxDimensionAndStatus,
  findBoxByNameService,
  getAllBoxesService,
  createBoxService,
  processBoxByIdService,
} from "../services/box-service.js";

const addBoxToDOController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (!role.is_allowed_do) {
      return response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }

    const doId = parseInt(request.params.doId);
    const payloads = request.body;

    const savedRelations = [];
    for (const item of payloads) {
      const result = await addBoxToDOService(doId, item.id, item.quantity || 1);
      savedRelations.push(result);
    }

    response
      .status(201)
      .json(
        HTTPResponse(
          true,
          201,
          "Boxes linked successfully",
          savedRelations,
          null
        )
      );
  } catch (error) {
    next(error);
  }
};

const deleteBoxByIdController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;

    if (role.is_allowed_do) {
      const boxId = request.params.boxId;
      const doId = parseInt(request.query.doId);
      const result = await deleteBoxByIdService(boxId, doId);
      response
        .status(200)
        .json(
          HTTPResponse(
            true,
            200,
            "Relasi Box dengan DO berhasil dihapus",
            result,
            null
          )
        );
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const boxDimensionCalculation = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;

    if (!role?.is_allowed_do) {
      return response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }

    const { box_id } = request.body;

    if (!box_id) {
      return response
        .status(400)
        .json(HTTPResponse(false, 400, null, null, "box_id is required"));
    }

    await processBoxByIdService(box_id);

    return response
      .status(200)
      .json(
        HTTPResponse(true, 200, "Dimension calculation triggered", null, null)
      );
  } catch (error) {
    next(error);
  }
};

const returnBoxDimesionResultController = async (req, res, next) => {
  try {
    const { boxID, length, width, height, volume } = req.body;

    if (!boxID || !length || !width || !height || !volume) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payload from Machine Learning",
      });
    }

    const updatedBox = await updateBoxDimensionAndStatus(boxID, {
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      volume: parseFloat(volume),
      status: "done",
    });

    return res
      .status(200)
      .json(HTTPResponse(true, 200, updatedBox, null, null));
  } catch (error) {
    next(error);
  }
};

const getBoxByNameController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;

    if (role.is_allowed_do) {
      const { name } = request.query;

      if (!name) {
        return response
          .status(400)
          .json(
            HTTPResponse(false, 400, null, null, "Parameter name diperlukan")
          );
      }

      const box = await findBoxByNameService(name);

      if (!box) {
        return response
          .status(404)
          .json(HTTPResponse(false, 404, null, null, "Box tidak ditemukan"));
      }

      return response
        .status(200)
        .json(HTTPResponse(true, 200, "Box ditemukan", box, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const getAllBoxesController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;

    if (role.is_allowed_do) {
      const boxes = await getAllBoxesService();
      return response
        .status(200)
        .json(HTTPResponse(true, 200, "All boxes", boxes, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const createBoxController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;

    if (role.is_allowed_do) {
      const box = request.body;
      const result = await createBoxService(box);
      response
        .status(201)
        .json(HTTPResponse(true, 201, "Box created", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

export {
  addBoxToDOController,
  deleteBoxByIdController,
  boxDimensionCalculation,
  returnBoxDimesionResultController,
  getBoxByNameController,
  getAllBoxesController,
  createBoxController,
};
