const router = require("express").Router();

const {
    protect
} = require("../middleware/authMiddleware");

const { staffOnly } = require("../middleware/staffMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const {
    getMyTickets,
    getMyTicket,
    getTicketById,
    scanTicket,
    resetTicketEntry
} = require("../controllers/ticketController");


// =====================================================
// SPECIFIC ROUTES FIRST
// =====================================================

router.get("/my", protect, getMyTickets);

router.get(
    "/registration/:registrationId",
    protect,
    getMyTicket
);

router.post(
    "/scan",
    protect,
    staffOnly,
    scanTicket
);

router.patch(
    "/:ticketId/reset",
    protect,
    adminOnly,
    resetTicketEntry
);


// =====================================================
// DYNAMIC ROUTE LAST
// =====================================================

router.get(
    "/:ticketId",
    protect,
    getTicketById
);


module.exports = router;
