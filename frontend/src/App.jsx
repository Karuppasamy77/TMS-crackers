
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../../logo.png';

export default function App(){
  const [products,setProducts] = useState([]);
  const [cart,setCart] = useState([]);
  const [checkoutData,setCheckoutData] = useState(null);
  const UPI_VPA = (import.meta.env.VITE_UPI_VPA) || 'tsm@upi';

  useEffect(()=>{
    axios.get('/api/products').then(r=>setProducts(r.data));
  },[]);

  function addToCart(p){
    setCart(c=>{
      const found = c.find(i=>i.id===p.id);
      if(found) return c.map(i=> i.id===p.id ? {...i, qty: Math.min((i.qty||0)+1, p.stock)} : i);
      return [...c, {id:p.id, name:p.name, price:p.price, qty:1}];
    });
  }

  async function placeOrder(customer){
    const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const total = subtotal;
    const items = cart;
    const payload = {...customer, items, subtotal, total};
    const res = await axios.post('/api/orders', payload);
    if(res.data.ok) {
      setCheckoutData({ ok:true, id: res.data.id, upi:`upi://pay?pa=${UPI_VPA}&pn=tsm+crackers&am=${total}&cu=INR` });
      setCart([]);
    }
  }

  return (
    <div style={{fontFamily:'Arial, sans-serif',padding:20}}>
      <header style={{display:'flex',alignItems:'center',gap:20}}>
        <img src={logo} alt="logo" style={{height:60}} />
        <div>
          <h1>TMS crackers</h1>
          <div style={{color:'#6b21a8'}}>Violet • Local UPI checkout demo</div>
        </div>
      </header>

      <main style={{display:'flex',gap:20,marginTop:20}}>
        <div style={{flex:2}}>
          <h2>Products</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {products.map(p=>(
              <div key={p.id} style={{border:'1px solid #eee',padding:10,borderRadius:8}}>
                <img src={p.image} alt="" style={{width:'100%',height:140,objectFit:'cover'}}/>
                <h3>{p.name}</h3>
                <div style={{color:'#555'}}>{p.description}</div>
                <div style={{marginTop:6,fontWeight:700}}>₹{p.price}</div>
                <div style={{marginTop:8}}>
                  <button onClick={()=>addToCart(p)}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{width:320}}>
          <h3>Cart</h3>
          {cart.length===0 && <div>No items</div>}
          {cart.map(i=>(
            <div key={i.id} style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              <div>{i.name} x {i.qty}</div>
              <div>₹{i.qty * i.price}</div>
            </div>
          ))}

          <div style={{marginTop:12}}>
            <strong>Subtotal: ₹{cart.reduce((s,i)=>s+i.price*i.qty,0)}</strong>
          </div>

          <Checkout cart={cart} onPlaceOrder={placeOrder} />
        </aside>
      </main>

      {checkoutData && (
        <div style={{position:'fixed',right:20,bottom:20,background:'#fff',padding:12,borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.08)'}}>
          <div>Order {checkoutData.id} created.</div>
          <div style={{marginTop:8}}>UPI deeplink (scan or click on mobile):</div>
          <div style={{marginTop:6,wordBreak:'break-all'}}>{checkoutData.upi}</div>
          <div style={{marginTop:8}}><small>After paying with GPay/PhonePe click "I have paid" in the admin to mark order paid.</small></div>
        </div>
      )}
    </div>
  );
}

function Checkout({cart,onPlaceOrder}){
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [address,setAddress]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(){
    setLoading(true);
    await onPlaceOrder({customer_name:name, phone, address});
    setLoading(false);
  }

  return (
    <div style={{marginTop:12}}>
      <div><input placeholder='Full name' value={name} onChange={e=>setName(e.target.value)} /></div>
      <div><input placeholder='Phone' value={phone} onChange={e=>setPhone(e.target.value)} /></div>
      <div><input placeholder='Address' value={address} onChange={e=>setAddress(e.target.value)} /></div>
      <div style={{marginTop:8}}>
        <button onClick={submit} disabled={loading || cart.length===0}>{loading ? 'Placing...' : 'Place Order & Show UPI'}</button>
      </div>
    </div>
  );
}
