'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CustomInputFormField from './CustomInputFormField'
import { authFormSchema } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getLoggedInUser, signIn, signUp } from '@/lib/actions/user.actions'




const AuthForm = ({type} : { type: string }) => {

    const router =  useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setisLoading] = useState(false);


    const formSchema = authFormSchema(type);

     // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ''
    },
  })
 
  // 2. Define a submit handler.
  const onSubmit = async (data: z.infer<typeof formSchema>) =>  {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setisLoading(true)
    try {
      console.log(data) 
      setisLoading(false)  
      console.log(`GK type: ${type}`)
      //sign up with the service & cretate token
      if ( type === 'sign-up') {
        console.log(`GK type: ${type} #002`)
       const newUser = await signUp(data);
       setUser(newUser)

        return
      }

      //sign-in logic
      const response = await signIn({
        email: data.email,
        password: data.password,
      })

      if (response) {
        router.push("/")
      }

    } catch ( error ) {
        console.log(`GK error: <${error}>`)
    } finally {
        setisLoading(false)
    }
  }

  return (
    <section className='auth-form'>
        <header className='flex flex-col gap-5 md:gap-8'>
       
        <Link href="/" className='cursor-pointer flex items-center gap-1'>
        <Image 
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Banking logo"
          
        />
        <h1 className='text-26 font-ibm-plex-serif font-bold text-black-1'>the Banking system</h1>
        </Link>
        <div className='flex flex-col gap-1 md:gap-3'>
            <h1 className='text-24 lg:text-36 font-semibold text-gray-900'>
                {user ? 'Link Account' : type === 'sign-in' ? 'Sign In' : 'Sign Up'}
                <p className='text-16 font-normal text-gray-600'>
                    {user ? 'Link your account to get started' : 'Please enter your details' }
                </p>
            </h1>
        </div>
        </header>
        {user ? (
            <div className='flex flex-col gap-4'>
                {/* PlaidLink */}
            </div>
        ) : (
            <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
      {type === 'sign-up' && (
            <>
            <div className='flex gap-4'>
              <CustomInputFormField control={form.control} label="First Name" name="firstName" placeholder="Please enter your first name" />
              <CustomInputFormField control={form.control} label="Last Name" name="lastName" placeholder="Please enter your last name" />
            </div>
              <CustomInputFormField control={form.control} label="Address" name="address" placeholder="Please enter address" />
              <CustomInputFormField control={form.control} label="City" name="city" placeholder="Please enter your city" />
            <div className='flex gap-4'>
                <CustomInputFormField control={form.control} label="State" name="state" placeholder="ex: NY" />
                <CustomInputFormField control={form.control} label="Postal Code" name="postalcode" placeholder="ex: 1101" />
            </div>
            <div className='flex gap-4'>
              <CustomInputFormField control={form.control} label="Date of Birth" name="dob" placeholder="yyyy-mm-dd" />
              <CustomInputFormField control={form.control} label="SSN" name="ssn" placeholder="ex: 1234" />
            </div> 
            </>
        )}

            <CustomInputFormField control={form.control} label="Email" name="email" placeholder="Please enter email address" />
            <CustomInputFormField control={form.control} label="Password" name="password" placeholder="Please enter password" />
       <div className='flex flex-col gap-4'>
       <Button type="submit" disabled={isLoading} className='form-btn'>
            {isLoading ? (
                <>
                 <Loader2 size={20} className='animate-spin' /> &nbsp;
                 Loading...
                </>
            ) : type === 'sign-in' ? 'Sign in' : 'Sign up' }
            </Button>
       </div>
      </form>
    </Form>
        <footer className='flex justify-center gap-1'>
            <p className='text-14 font-normal text-gray-600'>{type === 'sign-in'
                ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in' } className='form-link'>
            {type === 'sign-in' ? 'sign-up' : 'sign-in' }
            </Link>
        </footer>
            </>
        )
    }
    </section>
  )
}

export default AuthForm