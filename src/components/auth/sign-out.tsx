'use server'

import { signOut } from '@/auth'
import { Button } from '../ui/Button'

export async function SignOut() {
    return (
        <form
            action={async () => {
                // 'use server'
                await signOut()
            }}
        >
            <Button type="submit">Sign Out</Button>
        </form>
    )
}
