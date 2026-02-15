let accessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const setAccessToken = (token: string): void => {
  accessToken = token;
};

export const removeAccessToken = (): void => {
  accessToken = null;
};

export const hasAccessToken = (): boolean => {
  return !!accessToken;
};
