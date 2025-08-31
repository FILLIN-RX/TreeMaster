const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateUser");
const { listBets, createBet, getBet, cancelBet } = require("../controllers/bet.controller");

router.get("/", authenticateUser, listBets);
router.post("/create", authenticateUser, createBet);
router.get("/:id", authenticateUser, getBet);
router.post("/:id/cancel", authenticateUser, cancelBet);

module.exports = router;
