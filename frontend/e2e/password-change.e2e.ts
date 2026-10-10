import { expect, test } from '@playwright/test'
import { apiLogin, apiUrl, uniqueEmail } from './support'

const OLD_PASSWORD = 'E2e-Old-Password-2026!'
const NEW_PASSWORD = 'E2e-New-Password-2026!'

test('a password change ends the other sessions and keeps this one signed in', async ({
  page,
  request,
}) => {
  // A customer registers through the API.
  const email = uniqueEmail()
  const register = await request.post(apiUrl('/api/auth/register'), {
    data: { email, password: OLD_PASSWORD, full_name: 'E2E Session' },
  })
  expect(register.status()).toBe(201)

  // Session A: the customer logs in through the login page.
  await page.goto('/login')
  await page.getByLabel('E-posta', { exact: true }).fill(email)
  await page.getByLabel('Şifre', { exact: true }).fill(OLD_PASSWORD)
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Hesabım', exact: true })).toBeVisible()

  // Session B: a second login of the same customer, made through the API.
  const otherToken = await apiLogin(request, email, OLD_PASSWORD)

  // Session A changes the password on the profile page.
  await page.getByRole('link', { name: 'Hesabım', exact: true }).click()
  await page.getByLabel('Mevcut şifre', { exact: true }).fill(OLD_PASSWORD)
  await page.getByLabel('Yeni şifre', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Yeni şifre (tekrar)', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Şifreyi güncelle', exact: true }).click()
  await expect(
    page.getByText('Şifreniz güncellendi. Diğer cihazlardaki oturumlar kapatıldı.'),
  ).toBeVisible()

  // Session A is still signed in: after a reload the account link is still there.
  await page.reload()
  await expect(page.getByRole('link', { name: 'Hesabım', exact: true })).toBeVisible()

  // Session B has ended: its old token is refused.
  const oldSession = await request.get(apiUrl('/api/auth/me'), {
    headers: { Authorization: `Bearer ${otherToken}` },
  })
  expect(oldSession.status()).toBe(401)

  // Session A works with the token that the password change stored in the browser.
  const newToken = await page.evaluate(() => localStorage.getItem('ecommerce.token'))
  const me = await request.get(apiUrl('/api/auth/me'), {
    headers: { Authorization: `Bearer ${newToken}` },
  })
  expect(me.status()).toBe(200)

  // The old password no longer logs in; the new password does.
  const oldLogin = await request.post(apiUrl('/api/auth/login'), {
    data: { email, password: OLD_PASSWORD },
  })
  expect(oldLogin.status()).toBe(401)
  expect(await oldLogin.json()).toMatchObject({ detail: 'invalid_credentials' })
  await apiLogin(request, email, NEW_PASSWORD)
})
