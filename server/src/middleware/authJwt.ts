import jwt from 'jsonwebtoken'
import authConfig from '../config/auth.config';
import {
  StatusCodes,
} from 'http-status-codes';
// todo get user
// const User = db.user;
export const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  res.json(StatusCodes.METHOD_NOT_ALLOWED)
};

export const isModerator = (req, res, next) => {
  res.json(StatusCodes.METHOD_NOT_ALLOWED)

};

export const isModeratorOrAdmin = (req, res, next) => {
  res.json(StatusCodes.METHOD_NOT_ALLOWED)
};

