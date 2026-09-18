import StatStrip from '@/components/Dashboard/StatStrip'
import Patient_Table_Component from '@/components/Patient_Table_Component'
import React from 'react'

const Patients = () => {
  return (
    <>
      <StatStrip page="patients" />
      <Patient_Table_Component renderType='all' />
    </>
  )
}

export default Patients
