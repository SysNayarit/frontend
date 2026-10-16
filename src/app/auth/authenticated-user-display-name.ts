import { personDisplayName } from '../shared/utils/person-display-name';
import { AuthenticatedUser } from './auth.models';

export function authenticatedUserDisplayName(
  user: AuthenticatedUser | null,
): string {
  if (user === null) {
    return '';
  }

  if (user.person === null) {
    return user.name;
  }

  return personDisplayName(user.person);
}
