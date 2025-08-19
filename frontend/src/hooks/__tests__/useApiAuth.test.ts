import { renderHook, act } from '@testing-library/react';
import { useAuth } from 'react-oidc-context';
import { useApiAuth } from '../useApiAuth';

// Mock react-oidc-context
jest.mock('react-oidc-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useApiAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return auth token when user is authenticated', () => {
    const mockUser = {
      access_token: 'mock-access-token',
      profile: {
        sub: 'user-123',
        email: 'test@example.com'
      }
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.token).toBe('mock-access-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should return null token when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle authentication error', () => {
    const mockError = new Error('Authentication failed');

    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: mockError,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.error).toBe(mockError);
  });

  it('should provide auth headers for API calls', () => {
    const mockUser = {
      access_token: 'mock-access-token',
      profile: {
        sub: 'user-123',
        email: 'test@example.com'
      }
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.getAuthHeaders()).toEqual({
      Authorization: 'Bearer mock-access-token'
    });
  });

  it('should return empty headers when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signinRedirect: jest.fn(),
      signoutRedirect: jest.fn(),
      removeUser: jest.fn(),
      signinSilent: jest.fn(),
      signinPopup: jest.fn(),
      signoutPopup: jest.fn(),
      signoutSilent: jest.fn(),
      querySessionStatus: jest.fn(),
      revokeTokens: jest.fn(),
      startSilentRenew: jest.fn(),
      stopSilentRenew: jest.fn(),
      clearStaleState: jest.fn(),
      events: {} as any,
      settings: {} as any
    });

    const { result } = renderHook(() => useApiAuth());

    expect(result.current.getAuthHeaders()).toEqual({});
  });
});