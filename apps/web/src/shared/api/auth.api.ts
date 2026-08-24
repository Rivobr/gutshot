import { apiPost } from '@/shared/api/client';
import type { OtpRequestResponse, WebAuthResponse } from '@gutshot/types';

export interface RegisterInput {
  nickname: string;
  email: string;
  password: string;
  consents: { offer: boolean; rules: boolean; pdn: boolean; media: boolean };
}

export const authApi = {
  register: (input: RegisterInput) => apiPost<WebAuthResponse>('/auth/register', input),
  login: (login: string, password: string) =>
    apiPost<WebAuthResponse>('/auth/login', { login, password }),
  phoneRequestCode: (phone: string) =>
    apiPost<OtpRequestResponse>('/auth/phone/request-code', { phone }),
  phoneVerify: (phone: string, code: string) =>
    apiPost<WebAuthResponse>('/auth/phone/verify', { phone, code }),
  telegramWidget: (fields: Record<string, string>) =>
    apiPost<WebAuthResponse>('/auth/telegram/widget', fields),
  forgot: (email: string) => apiPost<{ sent: true }>('/auth/forgot', { email }),
  reset: (token: string, password: string) =>
    apiPost<{ ok: true }>('/auth/reset', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<{ ok: true }>('/auth/password/change', { currentPassword, newPassword }),
  telegramLinkCode: () => apiPost<{ code: string }>('/auth/telegram/link-code'),
};
