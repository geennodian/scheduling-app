import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  )
}

/**
 * Create an authenticated OAuth2 client with automatic token refresh persistence.
 *
 * @param connectedGoogleAccountId - The database ID of the ConnectedGoogleAccount.
 *   When provided, refreshed tokens are automatically saved back to the database.
 */
export function createAuthenticatedClient(
  accessToken: string,
  refreshToken: string,
  expiryDate?: Date | null,
  connectedGoogleAccountId?: string
) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate ? expiryDate.getTime() : undefined,
  })

  // Persist refreshed tokens back to the database
  if (connectedGoogleAccountId) {
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updateData: { accessToken?: string; refreshToken?: string; expiryDate?: Date | null } = {}
        if (tokens.access_token) {
          updateData.accessToken = tokens.access_token
        }
        if (tokens.refresh_token) {
          updateData.refreshToken = tokens.refresh_token
        }
        if (tokens.expiry_date) {
          updateData.expiryDate = new Date(tokens.expiry_date)
        }
        if (Object.keys(updateData).length > 0) {
          await prisma.connectedGoogleAccount.update({
            where: { id: connectedGoogleAccountId },
            data: updateData,
          })
          console.log('[OAuth] Tokens refreshed and saved for account:', connectedGoogleAccountId)
        }
      } catch (err) {
        console.error('[OAuth] Failed to persist refreshed tokens:', err)
      }
    })
  }

  return oauth2Client
}
