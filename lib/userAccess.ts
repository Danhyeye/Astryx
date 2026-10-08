import {hasSessionEmail} from './authPolicy.ts';

export async function checkUserAccess(
  email: unknown,
  lookup: (email: string) => Promise<{is_active: boolean} | null>,
): Promise<boolean> {
  if (!hasSessionEmail(email)) return false;
  try {
    const user = await lookup(email.toLowerCase());
    return user?.is_active === true;
  } catch {
    return false;
  }
}
