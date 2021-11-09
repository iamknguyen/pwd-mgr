import pwdController from "../controllers/pwd.controller";
import middleware from "../middleware";

export default (app) => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/pwd/getPassword",
    [middleware.verifyToken],
    pwdController.getPwd
  );

  app.post(
    "/api/pwd/user",
    [middleware.verifyToken],
    pwdController.addPwd
  );

  app.delete(
    "/api/pwd/user",
    [middleware.verifyToken],
    pwdController.removePwd
  );

};
