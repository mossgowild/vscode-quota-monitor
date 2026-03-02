import { createHash, randomBytes } from 'node:crypto'

export interface PkceChallenge {
  verifier: string
  challenge: string
  method: 'S256'
}

export function generatePkce(): PkceChallenge {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge, method: 'S256' }
}
