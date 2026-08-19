export function redirectFor(hasProfile: boolean, path: string): string | undefined {
  if (!hasProfile && path !== '/onboarding') {
    return '/onboarding';
  }

  if (hasProfile && path === '/onboarding') {
    return '/';
  }

  return undefined;
}
