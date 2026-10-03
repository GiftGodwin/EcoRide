(() => {
  const $ = id => document.getElementById(id);
  const show = id => document.querySelectorAll('.checkout-state').forEach(el => el.classList.toggle('hidden', el.id !== id));
  const notify = message => { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(el.timer); el.timer=setTimeout(()=>el.classList.remove('show'),3600); };
  const selectedMethod = () => document.querySelector('input[name=method]:checked')?.value || null;
  const setPaymentMode = method => { const card=method==='card'; $('payment-heading').textContent=card?'Pay with card':'Pay with bank transfer'; $('card-fields').classList.toggle('hidden',!card); $('bank-fields').classList.toggle('hidden',card); $('switch-payment').textContent=card?'Use bank transfer instead':'Use card instead'; };
  document.querySelectorAll('input[name=method]').forEach(input => input.onchange=()=>{});
  $('continue-payment').onclick = () => { const method = selectedMethod(); if (!method) { notify('Choose a payment method.'); return; } setPaymentMode(method); show('payment-state'); };
  $('back-fare').onclick = () => show('fare-state');
  $('switch-payment').onclick = () => setPaymentMode($('card-fields').classList.contains('hidden')?'card':'bank');
  $('payment-form').onsubmit = event => {
    event.preventDefault();
    const method = $('card-fields').classList.contains('hidden') ? 'bank_transfer' : 'card';
    $('receipt-method').textContent = method === 'card' ? 'Card payment' : 'Bank transfer'; show('success-state');
  };
  $('try-again').onclick = () => show('payment-state');
})();
