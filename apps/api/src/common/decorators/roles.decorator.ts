import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../enums/admin-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AdminRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
