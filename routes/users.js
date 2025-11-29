import express from "express";
import { getAllUsers, getUserById } from "../data/users.js";
import { ObjectId } from "mongodb";

const router = express.Router();
router.use((req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
});

router.get("/", async (req, res) => {
    try {

        const uid = req.session.user
        let users = await getAllUsers();
        const user = await getUserById(uid._id)
        console.log(uid)
        if (uid) {
            users = users.filter(user => user._id.toString() !== uid._id);
        }

        res.render("users", {
            users,
            style: "/public/css/profile.css",
            title: "Userlist",
            user
        });
    } catch (e) {
        res.status(500).json(e);
    }
});

export default router;
