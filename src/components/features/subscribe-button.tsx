'use client'
import {useState} from 'react'
import {initializePaddle} from '@paddle/paddle-js'
import {startCheckout} from '@/app/actions/billing'
import {Button} from '@/components/ui/button'
export function SubscribeButton(){const [busy,setBusy]=useState(false);const [error,setError]=useState('');const token=process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;return <div><Button disabled={busy||!token} onClick={async()=>{setBusy(true);setError('');try{const result=await startCheckout();if(result.error){setError(result.error);return}const paddle=await initializePaddle({token:token!,environment:process.env.NEXT_PUBLIC_PADDLE_ENV==='production'?'production':'sandbox'});if(!paddle)throw new Error('Checkout could not load.');paddle.Checkout.open({transactionId:result.transactionId!,settings:{successUrl:window.location.origin+'/billing?status=success'}})}catch{setError('Checkout could not be opened. Please try again.')}finally{setBusy(false)}}}>{busy?'Opening checkout…':'Subscribe'}</Button>{!token&&<p className="mt-2 text-sm text-ink-muted">Subscription checkout is not configured.</p>}<p role="status" className="mt-2 text-sm text-rejected">{error}</p></div>}
