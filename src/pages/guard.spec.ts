import { redirectFor } from './guard';

describe('redirectFor', () => {
  it('redirects to onboarding without a profile', () => {
    expect(redirectFor(false, '/')).toBe('/onboarding');
    expect(redirectFor(false, '/add')).toBe('/onboarding');
    expect(redirectFor(false, '/stats')).toBe('/onboarding');
  });

  it('allows onboarding itself without a profile', () => {
    expect(redirectFor(false, '/onboarding')).toBeUndefined();
  });

  it('redirects from onboarding to home with a profile', () => {
    expect(redirectFor(true, '/onboarding')).toBe('/');
  });

  it('allows other routes with a profile', () => {
    expect(redirectFor(true, '/')).toBeUndefined();
    expect(redirectFor(true, '/settings')).toBeUndefined();
  });

  it('never redirects from a redirect target', () => {
    expect(redirectFor(false, redirectFor(false, '/') as string)).toBeUndefined();
    expect(redirectFor(true, redirectFor(true, '/onboarding') as string)).toBeUndefined();
  });
});
