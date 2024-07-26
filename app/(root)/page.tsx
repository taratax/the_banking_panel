import HeaderBox from '@/components/HeaderBox'
import RightSideBar from '@/components/RightSideBar'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import React from 'react'

const Home = () => {
    const loggedIn = { firstName: 'User', lastName: 'Surname', email: 'username@email.com'}
  return (
    <section className='home'>
        <div className='home-content'>
            <header className='home-header'>
                <HeaderBox 
                  type="greeting"
                  title="Welcome"
                  user={loggedIn?.firstName || 'Guest'}
                  subtext="Access and manage your account and transactions efficiently"
                />
                <TotalBalanceBox 
                accounts={[]}
                totalBanks={1}
                totalCurrentBalance={1900.55}
                />
            </header>


            RECENT TRANSACTION
        </div>

        <RightSideBar 
        user={loggedIn}
        transactions={[]}
        banks={[{currentBalance: 3420.44},{ currentBalance: 55768.00}]}
        />
    </section>
  )
}

export default Home