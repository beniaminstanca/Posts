const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  //let totalItems;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched successfuly",
      posts: posts,
      totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 404;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorect");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  // let creator;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save(); //const userSave =
    res.status(201).json({
      message: "Post created succesfully",
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // post
  //   .save()
  //   .then((result) => {
  //     return User.findById(req.userId);
  //   })
  //   .then((user) => {
  //     creator = user;
  //     user.posts.push(post);
  //     return user.save();
  //   })
  //   .then((result) => {
  //     res.status(201).json({
  //       message: "Post created succesfully",
  //       post: post,
  //       creator: { _id: creator._id, name: creator.name },
  //     });
  //   })
  // .catch((err) => {
  //   if (!err.statusCode) {
  //     err.statusCode = 500;
  //   }
  //   next(err);
  // });
  //create post in db
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // .then((post) => {
  //   if (!post) {
  //     const error = new Error("Could not find post");
  //     error.statusCode = 404;
  //     throw error;
  //   }
  //   res.status(200).json({ message: "Post fetched", post: post });
  // })
  // .catch((err) => {
  //   if (!err.statusCode) {
  //     err.statusCode = 500;
  //   }
  //   next(err);
  // });
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorect");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const resultPostSave = await post.save(); //const resultPostSave =
    res.status(200).json({ message: "Post updated", post: resultPostSave });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // Post.findById(postId)
  //   .then((post) => {
  //     if (!post) {
  //       const error = new Error("Could not find post");
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     if (post.creator.toString() !== req.userId) {
  //       const error = new Error("Not authorized");
  //       error.statusCode = 403;
  //       throw error;
  //     }
  //     if (imageUrl !== post.imageUrl) {
  //       clearImage(post.imageUrl);
  //     }
  //     post.title = title;
  //     post.content = content;
  //     post.imageUrl = imageUrl;

  //     return post.save();
  //   })
  //   .then((result) => {
  //     res.status(200).json({ message: "Post updated", post: result });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    //checked loged-in user
    clearImage(post.imageUrl);
    const postRemoveResult = await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    const resultUserSave = await user.save();
    res
      .status(200)
      .json({ message: "Post deleted successfuly!", post: resultUserSave });
  } catch (error) {
    console.log(error);
  }
  //  Post.findById(postId)
  //   .then((post) => {
  //     if (!post) {
  //       const error = new Error("Could not find post");
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     if (post.creator.toString() !== req.userId) {
  //       const error = new Error("Not authorized");
  //       error.statusCode = 403;
  //       throw error;
  //     }
  //     //checked loged-in user
  //     clearImage(post.imageUrl);
  //     return Post.findByIdAndRemove(postId);
  //   })
  //   .then((result) => {
  //     return User.findById(req.userId);
  //   })
  //   .then((user) => {
  //     user.posts.pull(postId);
  //     return user.save();
  //   })
  //   .then((result) => {
  //     res
  //       .status(200)
  //       .json({ message: "Post deleted successfuly!", post: result });
  //   })
  //   .catch((err) => console.log(err));
};

exports.getStatus = async (req, res, next) => {
  console.log("request body", req.body);
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "A mers", status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // User.findById(req.userId)
  //   .then((user) => {
  //     if (!user) {
  //       const error = new Error("User not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     res.status(200).json({ message: "A mers", status: user.status });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.updateStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    const resultUserSave = await user.save();
    res
      .status(200)
      .json({ message: "Update succesfuly", status: resultUserSave });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // User.findById(req.userId)
  //   .then((user) => {
  //     if (!user) {
  //       const error = new Error("User not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }
  //     user.status = newStatus;
  //     return user.save();
  //   })
  //   .then((result) => {
  //     res.status(200).json({ message: "Update succesfuly", status: result });
  //   })
  // .catch((err) => {
  //   if (!err.statusCode) {
  //     err.statusCode = 500;
  //   }
  //   next(err);
  // });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
