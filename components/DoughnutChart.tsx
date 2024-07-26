'use client'
import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);


const DoughnutChart = ({accounts }: DoughnutChartProps ) => {
  const data = {
    datasets: [
        {
            label: 'Banks',
            data: [1444,2314,234,555],
            backgroundColor: ['#0747b6', '#2265d8', '#2f91fa', '#2f91fc']
        }
    ],
    labels: ['Bank one', 'Bank two', 'Bank three', 'Bank four']
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