'use client'
import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);


const DoughnutChart = ({accounts }: DoughnutChartProps ) => {

  const accountNames = accounts.map( elem => elem.name)  
  const balances = accounts.map( elem => elem.currentBalance) 

  const data = {
    datasets: [
        {
            label: 'Banks',
            data: balances,
            backgroundColor: ['#0747b6', '#2265d8', '#2f91fa', '#2f91fc']
        }
    ],
    labels: accountNames
   }
    return (
   <Doughnut 
   data={data} 
   options={{
    cutout: '60%',
    plugins: {
        legend: {
            display: false
        }
    }
   }}
   />
  )
}

export default DoughnutChart