import assert from 'node:assert/strict'
import {parseReceiptFields} from '../src/lib/receipt-fields.ts'
assert.deepEqual(parseReceiptFields({vendor:'Hardware shop',amount:'42.50',description:'Materials'}),{vendor:'Hardware shop',amount:42.5,description:'Materials'})
assert.throws(()=>parseReceiptFields({vendor:{html:'untrusted'},amount:10}))
assert.throws(()=>parseReceiptFields({amount:-1}))
assert.throws(()=>parseReceiptFields({amount:'Infinity'}))
assert.throws(()=>parseReceiptFields({description:'x'.repeat(201)}))
console.log('✓ untrusted receipt-extraction output is validated')
