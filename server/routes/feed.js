const express = require("express");
const { check, body } = require("express-validator/check");

const feedControler = require("../controlers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//GET /feed/posts
router.get("/posts", isAuth, feedControler.getPosts);

//POST feed/post
router.post(
  "/post",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  isAuth,
  feedControler.createPost
);

router.get("/post/:postId", isAuth, feedControler.getPost);

router.put(
  "/post/:postId",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  isAuth,
  feedControler.updatePost
);

router.delete("/post/:postId", isAuth, feedControler.deletePost);

router.get('/status', isAuth, feedControler.getStatus);

router.put('/status', isAuth, feedControler.updateStatus);

module.exports = router;
