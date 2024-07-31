'use server'

import { cookies } from "next/headers"
import { createAdminClient, createSessionClient } from "../appwrite"
import { Databases, ID } from "node-appwrite"
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils"
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid"
import { plaidClient } from "@/lib/plaid"
import { revalidatePath } from "next/cache"
import { addFundingSource, createDwollaCustomer } from "../dwolla.actions"


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

export const signUp = async ({password, ...data}: SignUpParams) => {
    console.log(`GK in signUp in user.actions.ts #000`)
    try {
    let newUserAccount 
    let _database: Databases
    let _account: any
    
     
       try {
        console.log(`GK in signUp in user.actions.ts`)
         const { account, database}  = await createAdminClient();
         _database = database
         _account = account
        
        newUserAccount = await account.create(
            ID.unique(), 
            data.email, 
            password, 
            `${data.firstName} ${data.lastName}`
        );
       } catch (error) {
        console.log(`GK error creating admin client or user account: <${error}>`);
            throw new Error('Error creating user'); // Re-throw the error to propagate it upwards in your call stack
       }
       
       let dwollaCustomerUrl; 
     
       try {
      console.log("GK before calling createDwollaCustomer data: ", data)
        dwollaCustomerUrl = await createDwollaCustomer({
           ...data,
           type: 'personal'
       })

      } catch (error) {
        console.log(`GK error creating Dwolla customer: <${error}>`);
        throw new Error('Error creating Dwolla customer'); // Re-throw the error to propagate it upwards in your call stack
      }
        if (!dwollaCustomerUrl) {
            throw new Error(`Dwolla customer URL is required <>: ${dwollaCustomerUrl}`)
        }

        if (!_database) {
            throw new Error('database appwrite is needed!')
        }

        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl)
        let newUser;
        try {
             newUser = await _database.createDocument(
                process.env.APPWRITE_DB_ID!,
                process.env.APPWRITE_USER_COLLECTION_ID!,
                ID.unique(),
                {
                    ...data,
                    userId: newUserAccount.$id,
                    dwollaCustomerId,
                    dwollaCustomerUrl
                }
    
    
            )
        } catch (error) {
            console.log(`GK error creating user document in database: <${error}>`);
            throw new Error('Error creating user document'); // Re-throw the error to propagate it upwards in your call stack
        }
        
        let session;
        try {
          session = await _account.createEmailPasswordSession(data.email, password);
        } catch (error) {
            console.log(`GK error creating email password session: <${error}>`);
            throw new Error('Error creating email password session'); // Re-throw the error to propagate it upwards in your call stack
        }
      
        try {
            cookies().set(`${process.env.APPWRITE_SESSION_NAME}`, session.secret, {
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                secure: true,
              });
        } catch (error) {
            console.log(`GK error setting cookie for email password session: <${error}>`);
            throw new Error('Error setting cookie for email password session'); // Re-throw the error to propagate it upwards in your call stack
        }

        return parseStringify(newUser)

    } catch ( error ) {
        console.log(`GK overall signUp function error: <${error}>`);
        // throw new Error('Error during signUp process'); // Re-throw the error to propagate it upwards in your call stack
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

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
        user: {
            client_user_id : user.$id
        },
        client_name: `${user.firstName} ${user.lastName}`,
        products: ['auth'] as Products[],
        language: 'en',
        country_codes: ['US'] as CountryCode[],
     }
     const response = await plaidClient.linkTokenCreate(tokenParams)
     return parseStringify({linkToken: response.data.link_token})
  } catch (error) {
    console.log(`GK error in createLinkToken error: `)
  }
}


export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    sharableId,
}: createBankAccountProps ) => {
 try {
    const { database} = await createAdminClient();
    const bankAccount = await database.createDocument(
        process.env.APPWRITE_DB_ID!, //DATABASE_ID:
        process.env.APPWRITE_BANK_COLLECTION_ID!, //BANK_COLLECTION_ID:
        ID.unique(),
       {
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    sharableId,
       }

 )
 return parseStringify(bankAccount)

 } catch (error) {
    
 }
}

export const exchangePublicToken = async ({
    publicToken,
    user
}: exchangePublicTokenProps) => {
 try {
    const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
    })

    const { access_token: accessToken, item_id: itemId } = response.data;
    const accountsRespone = await plaidClient.accountsGet({
        access_token: accessToken,

    })

    const accounData = accountsRespone.data.accounts[0]

    const request: ProcessorTokenCreateRequest = {
        access_token: accessToken,
        account_id: accounData.account_id,
        processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,

    }

    const processorTokenReponse = await plaidClient.processorTokenCreate(request)
    const processorToken = processorTokenReponse.data.processor_token
    
    const fundingSourceUrl = await addFundingSource({
        dwollaCustomerId: user.dwollaCustomerId,
        processorToken,
        bankName: accounData.name
    })

    if (!fundingSourceUrl) throw Error
    //Create a babnk account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
    await createBankAccount({
        userId: user.$id,
        bankId: itemId,
        accountId: accounData.account_id,
        accessToken,
        fundingSourceUrl,
        sharableId: encryptId(accounData.account_id),
        
    })

  //Revalidate the path to reflect the changes
  revalidatePath("/");

  //Return a success message
  return parseStringify({
    publicTokenExchange: "complete",
  });
 } catch (error) {
    console.log("GK exchangePublicToken catch error: ", error)
 }
}