"use client"
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'

const Page = () => {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-16 md:py-32">
      <div className="flex flex-row justify-center items-center gap-x-2">
        <h1 className="text-3xl font-extrabold text-foreground">Welcome to</h1>
        <div className="flex flex-col items-center">
          <Image src="/bulbasaur.png" alt="bulbasaur" width={100} height={100} />
          <p className="text-[#468D53] text-xl">BulbaChat</p>
        </div>
      </div>

      <p className="mt-2 text-lg text-muted-foreground font-semibold">
        Sign in below to chat with Bulba AI
      </p>

      <Button 
      variant={"default"} 
      className={"max-w-sm mt-5 w-full p-7 flex flex-row justify-center items-center cursor-pointer"}
      onClick={() => signIn.social({
        provider: "github",
        callbackURL: "/"
      })}
      >
        <Image src="/github.svg" alt="github" width={24} height={24} />
          <span className="font-bold ml-2">
            Sign in with GitHub
          </span>
      </Button>

      <Button 
      variant={"default"} 
      className={"max-w-sm mt-5 w-full p-7 flex flex-row justify-center items-center cursor-pointer"}
      onClick={() => signIn.social({
        provider: "google",
        callbackURL: "/"
      })}
      >
        <Image src="/google.svg" alt="google" width={24} height={24} />
          <span className="font-bold ml-2">
            Sign in with Google
          </span>
      </Button>
    </section>
  )
}

export default Page