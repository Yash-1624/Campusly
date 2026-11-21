const express = require("express");

const router =
    express.Router();

const {
    getCategories,
    createCategory,
    activateCategory,
    deactivateCategory
} =
    require("../controllers/categoryController");

const {
    protect
} =
    require("../middleware/authMiddleware");

const {
    adminOnly
} =
    require("../middleware/adminMiddleware");


router.get(
    "/",
    protect,
    adminOnly,
    getCategories
);

router.post(
    "/",
    protect,
    adminOnly,
    createCategory
);


router.patch(
    "/:id/activate",
    protect,
    adminOnly,
    activateCategory
);


router.patch(
    "/:id/deactivate",
    protect,
    adminOnly,
    deactivateCategory
);


module.exports = router;
