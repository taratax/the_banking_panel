import Link from 'next/link'
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {BankTabItem} from './BankTabItem'
import BankInfo from './BankInfo'
import TransactionsTable from './TransactionsTable'
import { Pagination } from './Pagination'


const RecentTransactions = ({
    accounts,
    transactions =[],
    appwriteItemId,
    page=1,
}:RecentTransactionsProps) => {
  
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions?.length / rowsPerPage)
  const indexOfLastTransaction = page * rowsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction)

  console.log(`GK in RecentTransactions component the transactions: ${transactions.length} `)
  return (
    <section className='recent-transactions'>
        <header className='flex items-center justify-between'>
            <h2 className='recent-transactions-label'>
                Recent transactions
            </h2>
            <Link href={`/transaction-history/?id=${appwriteItemId}`} className='view-all-btn'>
                View all
            </Link>
        </header>
        <Tabs defaultValue={appwriteItemId} className="w-full">
            <TabsList className='recent-transactions-tablist'>
              {accounts.map((acc: Account) => (
                <TabsTrigger key={acc.id} value={acc.appwriteItemId}>
                  <BankTabItem  key={acc.id} account={acc} appwriteItemId={appwriteItemId}/>
                </TabsTrigger>
              ))}
            </TabsList>
           {accounts.map((acc:Account) => (
            <TabsContent
            key={acc.id}
            value={acc.appwriteItemId}
            className='space-y-4'
            >
                <BankInfo account={acc} appwriteItemId={appwriteItemId} type="full"/>
                <TransactionsTable transactions={currentTransactions}/>
                
                {totalPages > 1 && (
                  <div className='my-4 w-full'>
                     <Pagination page={page}  totalPages={totalPages}/>
                  </div>
                )}
              
            </TabsContent>
           )
            
           )}
        </Tabs>

    </section>
  )
}

export default RecentTransactions