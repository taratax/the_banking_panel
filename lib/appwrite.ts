// src/lib/server/appwrite.js
"use server";
import { Client, Account, Databases, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT!);

  const session = cookies().get(`${process.env.APPWRITE_SESSION_NAME}`);
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_SECRET_API_KEY!);
 console.log(`GK in createAdminClient  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`)
 console.log(`GK in createAdminClient  process.env.APPWRITE_PROJECT: ${process.env.APPWRITE_PROJECT}`)
 console.log(`GK in createAdminClient  process.env.APPWRITE_SECRET_API_KEY: ${process.env.APPWRITE_SECRET_API_KEY}`)
  return {
    get account() {
      return new Account(client);
    },
    get database() {
        return new Databases(client);
    },
    get users() {
        return new Users(client);
    }
  };
}
