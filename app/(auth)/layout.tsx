import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

type children = {
    children: React.ReactNode
}

const Authlayout = async ({ children }: children) => {

  const session = await auth.api.getSession({
    headers:await headers()
  })

  if(session) {
    return redirect("/")
  }
  return (
    <>
        {children}
    </>
  )
}

export default Authlayout