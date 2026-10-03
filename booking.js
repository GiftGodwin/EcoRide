(() => {
  const $ = id => document.getElementById(id);
  const show = id => document.querySelectorAll('.state').forEach(el => el.classList.toggle('hidden', el.id !== id));
  const notify = message => { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(el.timer); el.timer=setTimeout(()=>el.classList.remove('show'),3600); };
  let selectedSeat = 2;
  document.querySelectorAll('.seat.open,.seat.yours').forEach(button => button.addEventListener('click', () => {
    if (button.classList.contains('taken') || button.classList.contains('wheel')) return;
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('yours'));
    button.classList.add('yours'); selectedSeat = button.textContent.match(/Seat (\d)/)?.[1] || 2;
  }));
  $('fee').textContent = '₦ 200'; $('total').textContent = '₦ 3,400';
  $('request-seat').onclick = () => {
    $('requested-seat').textContent = selectedSeat; show('request-state'); notify('Seat request sent.');
  };
  $('cancel-request').onclick = () => { show('choose-state'); notify('Request cancelled.'); };
  $('accept-preview').onclick = () => { show('confirmed-state'); notify('Driver accepted your request.'); };
  $('decline-preview').onclick = () => { show('choose-state'); notify('The driver declined this request. Choose another seat.'); };
  $('pay-now').onclick = () => location.href='checkout.html';
})();
