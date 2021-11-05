const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const { auth } = require("./middleware/auth");

const User = require("./models/User");
const Blog = require("./models/Blog");

mongoose.connect(process.env.dbURI);

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "build")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

//routes whhich can only be accessed when authenticated
app.use("/user", auth);
app.use("/blog", auth);
app.use("/userblogs", auth);

app.listen(process.env.port, () => {
  console.log(`Server is listening on port: ${process.env.port}`);
});

//helper function
function sendResponse(res, err, data) {
  if (err) {
    res.json({
      success: false,
      message: err,
    });
  } else if (!data || data.length == 0) {
    res.json({
      success: false,
      message: "Not Found",
    });
  } else {
    res.json({
      success: true,
      data: data,
    });
  }
}

//Create New User or Signup route
app.post("/signup", (req, res) => {
  User.create(
    {
      ...req.body.data,
      password: bcrypt.hashSync(req.body.data.password, 10),
    },
    (err, data) => {
      if (err) {
        res.json({
          success: false,
          message: err,
        });
      } else if (!data || data.length == 0) {
        res.json({
          success: false,
          message: "Not Found",
        });
      } else {
        data.password = undefined;
        jwt.sign(
          data.toJSON(),
          process.env.secretkey,
          { expiresIn: "1h" },
          (error, token) => {
            if (error) {
              res.json({
                success: false,
                message: error,
              });
            } else {
              res.json({
                success: true,
                data: data,
                token,
              });
            }
          }
        );
      }
    }
  );
});

//Login route
app.post("/login", (req, res) => {
  User.findOne(
    {
      roll: req.body.data.roll,
    },
    (err, data) => {
      if (err) {
        res.json({
          success: false,
          message: err,
        });
      } else if (!data || data.length == 0) {
        res.json({
          success: false,
          message: "Not Found",
        });
      } else {
        bcrypt.compare(
          req.body.data.password,
          data.password,
          (er, comparison) => {
            if (er) {
              res.json({
                success: false,
                message: er,
              });
            }

            if (!comparison) {
              res.json({
                success: false,
                message: "Wrong Password",
              });
            } else {
              data.password = undefined;
              jwt.sign(
                data.toJSON(),
                process.env.secretkey,
                { expiresIn: "1h" },
                (error, token) => {
                  if (error) {
                    res.json({
                      success: false,
                      message: error,
                    });
                  } else {
                    res.json({
                      success: true,
                      data: data,
                      token,
                    });
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

//Read User info
app.get("/user/:roll", (req, res) => {
  if (req.params.roll != res.user.roll) {
    res.json({
      success: false,
      message: "You cannot read other user's information",
    });
  } else {
    User.findOne(
      {
        roll: res.user.roll,
      },
      (err, data) => {
        data.password = undefined;
        sendResponse(res, err, data);
      }
    );
  }
});

//Update User info
app.put("/user/:roll", (req, res) => {
  if (req.params.roll != res.user.roll) {
    res.json({
      success: false,
      message: "You cannot modify other user's information",
    });
  } else {
    var updation;
    if (req.body.data.password) {
      updation = {
        ...req.body.data,
        password: bcrypt.hashSync(req.body.data.password, 10),
      };
    } else {
      updation = {
        ...req.body.data,
      };
    }
    User.findOneAndUpdate(
      {
        roll: req.params.roll,
      },
      {
        ...updation,
      },
      {
        new: true,
      },
      (err, data) => {
        data.password = undefined;
        sendResponse(res, err, data);
      }
    );
  }
});

//Delete User
app.delete("/user/:roll", (req, res) => {
  if (req.params.roll != res.user.roll) {
    res.json({
      success: false,
      message: "You cannot delete other user's information",
    });
  } else {
    User.deleteOne(
      {
        roll: req.params.roll,
      },
      (err, data) => {
        sendResponse(res, err, data);
      }
    );
  }
});

//Create Post
app.post("/blog", (req, res) => {
  Blog.create(
    {
      ...req.body.data,
      authorName: res.user.name,
      authorRoll: res.user.roll,
    },
    (err, data) => {
      sendResponse(res, err, data);
    }
  );
});

//Read Posts
app.get("/blog", (req, res) => {
  Blog.find({}, (err, data) => {
    sendResponse(res, err, data);
  });
});

//Read Post
app.get("/blog/:id", (req, res) => {
  Blog.find(
    {
      _id: req.params.id,
    },
    (err, data) => {
      sendResponse(res, err, data);
    }
  );
});

//Update Post
app.put("/blog/:id", (req, res) => {
  Blog.findOne(
    {
      _id: req.params.id,
    },
    (err, data) => {
      if (err || data.authorRoll != res.user.roll) {
        res.json({
          success: false,
          message: "Cannot update post created by others or blog not found",
        });
      } else {
        Blog.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            ...req.body.data,
          },
          {
            new: true,
          },
          (err, data) => {
            sendResponse(res, err, data);
          }
        );
      }
    }
  );
});

//Delete Post
app.delete("/blog/:id", (req, res) => {
  Blog.findOne(
    {
      _id: req.params.id,
    },
    (err, data) => {
      if (err || data.authorRoll != res.user.roll) {
        res.json({
          success: false,
          message: "Cannot delete post created by others or blog not found",
        });
      } else {
        Blog.findOneAndDelete(
          {
            _id: req.params.id,
          },
          (err, data) => {
            sendResponse(res, err, data);
          }
        );
      }
    }
  );
});

//Read blogs of a particular User
app.get("/userblogs", (req, res) => {
  Blog.find(
    {
      authorRoll: res.user.roll,
    },
    (err, data) => {
      sendResponse(res, err, data);
    }
  );
});
