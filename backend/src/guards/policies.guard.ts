import lodash, { includes } from "lodash";
import { Role } from "@app/modules/role/entities/role.entity";
import { User } from "@app/modules/user/entities/user.entity";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { HttpUnauthorizedError } from "@app/errors/unauthorized.error";
import { Ref } from "@typegoose/typegoose";

export enum MethodList {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  PATH = "path",
}

export interface RoutePayloadInterface {
  path: string;
  method: MethodList;
  resource?: string;
  description?: string;
  isDefault?: boolean;
}

export const MapMethodsActions = {
  manage: [MethodList.GET, MethodList.POST, MethodList.PUT, MethodList.DELETE],
  create: [MethodList.POST],
  read: [MethodList.GET],
  update: [MethodList.PUT, MethodList.PATH],
  delete: [MethodList.DELETE],
};

@Injectable()
export class PoliciesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route.path;
    const method = request.method.toLowerCase();
    const user = request.user;
    const permissionPayload: RoutePayloadInterface = {
      path,
      method,
    };
    return this.checkIfUserHavePermission(user, permissionPayload);
  }

  /**
   * check if user have necessary permission to view resource
   * @param user
   */
  checkIfUserHavePermission(
    user: User,
    permissionAgainst: RoutePayloadInterface
  ) {
    const { path, method } = permissionAgainst;
    if (typeof user === "undefined") {
      throw new HttpUnauthorizedError();
    }
    if (user.isSuperAdmin) {
      return true;
    }
    try {
      const modules = lodash.split(path, "/", 2);
      const roles: Role[] = user.roles as Role[];
      if (user && roles.length > 0) {
        // loop through all roles
        for (let role of roles) {
          const permissions = role.permissions;
          // loop through all permissions
          for (let permission of permissions) {
            // check if the permission is allowed
            if (modules.some((v) => permission.name === v)) {
              const actions = permission.actions;
              // loop through all actions
              for (const action of actions) {
                const hasAction = MapMethodsActions[action];
                // check if the action is allowed
                if (hasAction.includes(method)) {
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
