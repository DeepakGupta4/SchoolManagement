/**
 * Talks to the SchoolDeck backend. The base URL comes from VITE_API_URL at
 * build time, falling back to the deployed API so the marketing site works out
 * of the box. The one call the public site makes is submitting a demo request.
 */

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'https://schoolmanagement-ra6d.onrender.com'

export interface SchoolRegistration {
  schoolName: string
  ownerName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  studentCount: number
  teacherCount: number
  schoolType: string
  website: string
  message: string
}

export async function submitSchoolRegistration(payload: SchoolRegistration): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/school-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `Something went wrong (${res.status}).`)
  }
}
