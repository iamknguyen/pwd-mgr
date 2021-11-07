import config from '../config/db.config'

import {
  Sequelize,
  Model,
  Dialect,
  DataTypes,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyHasAssociationMixin,
  Association,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  
} from "sequelize";

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect as Dialect,
    // operatorsAliases: false,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

let db: {[key: string]: any}= {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// db.role.belongsToMany(db.user, {
//   through: "user_roles",
//   foreignKey: "roleId",
//   otherKey: "userId"
// });
// db.user.belongsToMany(db.role, {
//   through: "user_roles",
//   foreignKey: "userId",
//   otherKey: "roleId"
// });

// db.ROLES = ["user", "admin", "moderator"];

// These are all the attributes in the User model
interface UserAttributes {
  id: number;
  email: string;
  password: string | null;
}

// Some attributes are optional in `User.build` and `User.create` calls
// interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}
interface UserCreationAttributes {}
interface RoleAttributes {
  id: number;
  ownerId: number;
  name: string;
}

interface RoleCreationAttributes {}

class Role extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes {
  public id!: number;
  public ownerId!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}


class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.
  public email!: string;
  public password!: string | null; // for nullable fields

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Since TS cannot determine model association at compile time
  // we have to declare them here purely virtually
  // these will not exist until `Model.init` was called.
  public getRoles!: HasManyGetAssociationsMixin<Role>; // Note the null assertions!
  public addRole!: HasManyAddAssociationMixin<Role, number>;
  public hasRole!: HasManyHasAssociationMixin<Role, number>;
  public countRoles!: HasManyCountAssociationsMixin;
  public createRole!: HasManyCreateAssociationMixin<Role>;

  // You can also pre-declare possible inclusions, these will only be populated if you
  // actively include a relation.
  public readonly roles?: Role[]; // Note this is optional since it's only populated when explicitly requested in code

  public static associations: {
    roles: Association<User, Role>;
  };
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "roles",
  }
);

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    password: {
      type: new DataTypes.STRING(128),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    sequelize, // passing the `sequelize` instance is required
  }
);
export default db;
