import middleware from "../middleware";

const controller = require("../controllers/user.controller");

export default (app) => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get(
    "/api/test/user",
    [middleware.verifyToken],
    controller.userBoard
  );

  app.get(
    "/api/test/mod",
    [middleware.verifyToken, middleware.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [middleware.verifyToken, middleware.isAdmin],
    controller.adminBoard
  );
};
