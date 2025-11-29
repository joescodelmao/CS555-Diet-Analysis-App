import express from "express";
import { follow, getAllUsers, getUserById, unfollow } from "../data/users.js";
import { ObjectId } from "mongodb";
import { getProfileByUserId } from "../data/profiles.js";
import { checkId } from "../helpers.js";
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
        //const profile = await getProfileByUserId(uid._id)
        //const profiles = [];
        for (let u of users){
            let p = await getProfileByUserId(u._id)
            //console.log(p)
            if(!p) p = {goal: "No goal entered yet."}
            u.profile = p;
        }
        //console.log(users)
        //console.log(user)

        if (uid) {
            users = users.filter(user => user._id.toString() !== uid._id);
        }

        for (let u of users){
            u.follow_or_unfollow = "follow"
            if (u.followers){
                for(let follower of u.followers){
                    if (user._id === follower){
                        u.follow_or_unfollow = "unfollow"
                        break;
                    }
                }
            }
        }
        res.render("users", {
            users,
            style: "/public/css/profile.css",
            title: "Userlist",
            user,
        });
    } catch (e) {
        res.status(500).json(e);
    }
});

router.post("/follow/:id", async (req,res) => {
    try {
        const id = checkId(req.params.id);
        if(!req.session.user || req.session.user._id === id){
            throw 'Following error'
        }
    } catch (e){
        return res.status(403).json("Permission denied.")
    }
    try {
        const id = checkId(req.params.id)
        //console.log(req.session.user._id + " " + id)
        await follow(req.session.user._id, id);
        
        res.redirect('/users')
    } catch (e) {
        return res.status(400).json(e)
    }
});

router.post("/unfollow/:id", async (req,res) => {
    try {
        const id = checkId(req.params.id);
        if(!req.session.user || req.session.user._id === id){
            throw 'Following error'
        }
    } catch (e){
        return res.status(403).json("Permission denied.")
    }
    try {
        const id = checkId(req.params.id)
        //console.log(req.session.user._id + " " + id)
        await unfollow(req.session.user._id, id);
        
        res.redirect('/users')
    } catch (e) {
        return res.status(400).json(e)
    }
});

export default router;
