import {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
} from './authJwt';
import {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
} from './verifySignUp';
export default {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};
