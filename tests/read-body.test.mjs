import assert from 'node:assert/strict'
import {readLimitedBody} from '../src/lib/read-body.ts'
const input=new TextEncoder().encode('Чек receipt')
const stream=new ReadableStream({start(c){c.enqueue(input.slice(0,1));c.enqueue(input.slice(1));c.close()}})
assert.equal(await readLimitedBody(new Request('http://localhost',{method:'POST',body:stream,duplex:'half'}),100),'Чек receipt')
await assert.rejects(()=>readLimitedBody(new Request('http://localhost',{method:'POST',body:'x'.repeat(101),headers:{'content-length':'1'}}),100),e=>e.status===413)
await assert.rejects(()=>readLimitedBody(new Request('http://localhost',{method:'POST',body:new Uint8Array([255])}),100),e=>e.status===400)
console.log('✓ streamed webhook input is bounded and UTF-8 validated')
