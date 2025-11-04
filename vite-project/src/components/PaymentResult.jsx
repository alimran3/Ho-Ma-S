import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const PaymentResult = ({ type }) => {
  const location = useLocation();
  const [tranId, setTranId] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      setTranId(params.get('tran_id') || '');
    } catch {}
  }, [location.search]);

  const title = type === 'success' ? 'Payment Successful' : type === 'fail' ? 'Payment Failed' : 'Payment Cancelled';
  const color = type === 'success' ? '#16a34a' : type === 'fail' ? '#b91c1c' : '#6b7280';

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', padding:16}}>
      <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:24, maxWidth:560, width:'100%', textAlign:'center', boxShadow:'0 6px 14px rgba(0,0,0,0.06)'}}>
        <h1 style={{marginTop:0, color}}>{title}</h1>
        {tranId && (
          <div style={{marginTop:8, color:'#4b5563'}}>Transaction ID: <strong>{tranId}</strong></div>
        )}
        <div style={{marginTop:16, color:'#6b7280'}}>
          {type === 'success' && 'Thank you! Your payment was completed. The manager can now verify and mark it as received.'}
          {type === 'fail' && 'The payment could not be completed.'}
          {type === 'cancel' && 'You cancelled the payment process.'}
        </div>
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:20, flexWrap:'wrap'}}>
          <Link to="/student/dashboard" className="toggle-meal-btn" style={{textDecoration:'none'}}>
            Back to Student Dashboard
          </Link>
          <Link to="/manager/dashboard" className="toggle-meal-btn" style={{textDecoration:'none'}}>
            Go to Manager Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
