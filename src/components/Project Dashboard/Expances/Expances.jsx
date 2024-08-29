import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from '../../../app/slices/modalSlice'
import AmountCard from '../../Cards/AmountCard/AmountCard'

function DashboardExpances({project}){
  const dispatch = useDispatch()
  return (<div className="payments expenses">
    <div className="heading-shoots heading-section">
        <h3 className='heading '>Expenses <span>{project.expenses?.length}</span></h3>
        {project.expenses?.length>0&&<div className="new-shoot button tertiary l2 outline icon new"
          onClick={()=>project.expenses && dispatch(openModal('addExpense'))}
          >New</div>}
      </div>
      <div className={`card ${project.expenses ? '':'single'}`}>
        <div className={`chart box `}>
            <div className="status large">
              <div className="signal"></div>
            </div>
            <div className={`circle ${ !project.budgets?.length>0?'gray':'green'}`}>
             
            </div>
          <div className="message">

          {
              project.expenses || project.expenses?.amount !==0? (
                <div className="button primary outline"
                onClick={()=>dispatch(openModal('addExpense'))}
                >
                  Add Expense
                </div>
              ) :
              (
                project.expenses?.length === 0 &&
                <p>Add project expenses</p>
              )
            }
          </div>
        </div>
        {project.expenses&&project.expenses[0]?.amount&&<div className="payments-list">
          {
            project.expenses?.length === 0? (
              <div className="no-payments">
                <div className="button secondary outline"
                onClick={()=>project.budgets && dispatch(openModal('addExpense'))}>Add Expense</div>
              </div>
            ) : (
              <>
              {
              project.expenses?.map((payment, index) => (
                <AmountCard amount={`₹${payment.amount/1000}K`} 
                project={project}
                  direction="+ " 
                  percentage={payment.name} 
                    status={'confirmed'}/>
              ))}
              {/* Filler Cards */}
              {
                project.expenses?.length<5 && (
                  Array(5-project.expenses.length).fill(0).map((item, index) => (
                    <AmountCard amount={''} direction={''} percentage={''} status={'draft'}/>
                  ))
                )
              }
              </>
            )
          }
        </div>}
      </div>
    </div>
  )
}

export default DashboardExpances
// Line Complexity  1.0 -> 0.9