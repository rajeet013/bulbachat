import { auth } from '@/lib/auth'
import { currentUser } from '@/modules/authentication/actions'
import ChatSidebarWrapper from '@/modules/chat/components/chat_sidebar_wrapper'
import Header from '@/modules/chat/components/header'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'
import db from '@/lib/db'

type Props = {
    children: React.ReactNode
}

const layout = async ({ children }: Props) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const user = await currentUser()

    if (!session || !user) {
        return redirect('/sign-in')
    }

    const chats = await db.chat.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: { messages: { take: 1 } }
    })

    return (
        <div className="flex h-screen overflow-hidden">
            <ChatSidebarWrapper user={user} chats={chats} />
            <main className="flex-1 overflow-hidden min-w-0">
                <Header />
                {children}
            </main>
        </div>
    )
}

export default layout