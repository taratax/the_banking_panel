'use server'

import { cookies } from "next/headers"
import { createAdminClient, createSessionClient } from "../appwrite"
import { ID } from "node-appwrite"
import { parseStringify } from "../utils"

export const signIn = async (data: SignUpParams) => {
    try {
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(data.email, data.password)
        return parseStringify(response)
    } catch ( error ) {
        console.log(`GK error action 001 <${error}>`)
    } finally {
        console.log(`GK finally of action 001 running`)
    }
}

export const signUp = async (data: SignUpParams) => {
    console.log(`GK in signUp in user.actions.ts #000`)
    try {
        console.log(`GK in signUp in user.actions.ts`)
        const { account } = await createAdminClient();
        
        const newAccount = await account.create(
            ID.unique(), 
            data.email, 
            data.password, 
            `${data.firstName} ${data.lastName}`
        );
        const session = await account.createEmailPasswordSession(data.email, data.password);
      
        cookies().set(`${process.env.APPWRITE_SESSION_NAME}`, session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });
        return parseStringify(newAccount)
    } catch ( error ) {
        console.log(`GK error action 002 <${error}>`)
    } finally {
        console.log(`GK finally of action 002 running`)
    }
}

// ... your initilization functions

export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      return parseStringify(await account.get());
    } catch (error) {
      return null;
    }
  }
  
export const logoutAction = async () => {
    try {
        const { account } =  await createSessionClient()
        cookies().delete(`${process.env.APPWRITE_SESSION_NAME}`)
        await account.deleteSession('current')
    } catch ( error ) {
        return null;
    }
}