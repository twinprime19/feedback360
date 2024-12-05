export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EDIT = 'edit',
  ADD = 'add',
  VIEW = 'view',
}

export enum FormTypes {
  UPDATE = Action.UPDATE,
  CREATE = Action.CREATE,
  READ = Action.READ,
  EDIT = Action.EDIT,
  ADD = Action.ADD,
  VIEW = Action.VIEW,
  DELETE = Action.DELETE,
}
