'use server'

import { cookies } from "next/headers"
import { createAdminClient, createSessionClient } from "../appwrite"
import { Databases, ID, Query } from "node-appwrite"
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils"
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid"
import { plaidClient } from "@/lib/plaid"
import { revalidatePath } from "next/cache"
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions"


export const getUserInfo = async ({userId}: getUserInfoProps ) => {
    try {
        const { database } = await createAdminClient();
    
        const user = await database.listDocuments(process.env.APPWRITE_DB_ID!, process.env.APPWRITE_USER_COLLECTION_ID!, [Query.equal('userId', [userId])] )
        return parseStringify(user.documents[0])
    } catch (error) {
        console.log("GK error fetching documents for given bank in getBank")
    }
}
export const signIn = async (data: signInProps) => {
    try {
        const { account } = await createAdminClient();

        let session;
        try {
          session = await account.createEmailPasswordSession(data.email1, data.password);
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

        // const response = await account.createEmailPasswordSession(data.email1, data.password)
        const user = await getUserInfo({userId: session.userId})
        return parseStringify(user)
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
            data.email1, 
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
      const ommitedKey = "email1"
      const {[ommitedKey]: email , ...newData } = data
  
      const _dwollaData = {email, ...newData}
        dwollaCustomerUrl = await createDwollaCustomer({
           ..._dwollaData,
           type: 'personal'
       })
       console.log("GK after calling createDwollaCustomer dwollaCustomerUrl: ", dwollaCustomerUrl)
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
            console.log("GK before  calling _database.createDocument ")
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

            console.log("GK afetr  calling _database.createDocument newUser: ",newUser)
        } catch (error) {
            console.log(`GK error creating user document in database: <${error}>`);
            throw new Error('Error creating user document'); // Re-throw the error to propagate it upwards in your call stack
        }
        
        let session;
        try {
            console.log("GK before  calling _account.createEmailPasswordSession ")
          session = await _account.createEmailPasswordSession(data.email1, password);
        } catch (error) {
            console.log(`GK error creating email password session: <${error}>`);
            throw new Error('Error creating email password session'); // Re-throw the error to propagate it upwards in your call stack
        }
        console.log("GK after  calling _account.createEmailPasswordSession ")
        try {

            console.log("GK before  calling cookies().set session.secret: ",session.secret)
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

export const getLoggedInUser =  async () => {
    try {
        // Create a session client and extract the account property
      const { account } = await createSessionClient();
      // Get detailed user information using the user ID from the account
      const user = await getUserInfo({userId: (await account.get()).$id})
       // Process and return the user information
      return parseStringify(user);
    } catch (error) {
            // If any error occurs, return null
            console.log("GK getLoggedInUser cath error: ", error)
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
    shareableId,
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
    shareableId,
       }

 )
 return parseStringify(bankAccount)

 } catch (error) {
    console.log("GK creating Bank account ERROR: ", error);
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

    if (!fundingSourceUrl) throw new Error("GK fundingSourceUrl Error: ")
    //Create a babnk account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
    
    console.log("GK in exchangePublicToken before createBankAccount:  ", { userId: user.$id,
        bankId: itemId,
        accountId: accounData.account_id,
        accessToken,
        fundingSourceUrl,
        shareableId: encryptId(accounData.account_id),})

    await createBankAccount({
        userId: user.$id,
        bankId: itemId,
        accountId: accounData.account_id,
        accessToken,
        fundingSourceUrl,
        shareableId: encryptId(accounData.account_id),
        
    })

    console.log(`GK After calling createBankAccount `)

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

export const getBanks = async ( {userId }: getBanksProps ) => {
try {
    const { database } = await createAdminClient();
    console.log(`GK in getBanks userId: ${userId}`)
    console.log(`GK in getBanks process.env.APPWRITE_DB_ID: ${process.env.APPWRITE_DB_ID}`)
    console.log(`GK in getBanks process.env.APPWRITE_BANK_COLLECTION_ID: ${process.env.APPWRITE_BANK_COLLECTION_ID}`)
    const banks = await database.listDocuments(`${process.env.APPWRITE_DB_ID!}`, `${process.env.APPWRITE_BANK_COLLECTION_ID!}`, [Query.equal('userId', [userId])] )
    console.log("GK in XXX getBanks banks: ", banks)
    return parseStringify(banks.documents)
} catch (error) {
    console.log("GK error fetching banks data in getBanks", error)
}
}

export const getBank = async ( { documentId }: getBankProps ) => {
    try {
        const { database } = await createAdminClient();
    
        const bank = await database.listDocuments(process.env.APPWRITE_DB_ID!, process.env.APPWRITE_BANK_COLLECTION_ID!, [Query.equal('$id', [documentId])] )
        return parseStringify(bank.documents[0])
    } catch (error) {
        console.log("GK error fetching documents for given bank in getBank error: ", error)
        console.log("GK error fetching documents for given bank in getBank documentId: ", documentId)
    }
    }

    // get specific bank from bank collection by account id
export const getBankByAccountId = async ({
    accountId,
  }: getBankByAccountIdProps) => {
    try {
      const { database } = await createAdminClient();
  
      const bank = await database.listDocuments(
        process.env.APPWRITE_DB_ID!,
        process.env.APPWRITE_BANK_COLLECTION_ID!,
        [Query.equal("accountId", [accountId])]
      );
  
      if (bank.total !== 1) return null;
  
      return parseStringify(bank.documents[0]);
    } catch (error) {
      console.error("Error", error);
      return null;
    }
  };

