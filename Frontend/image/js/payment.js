// Load total from cart.html
    const total = localStorage.getItem('cartTotal') || '0.00';
    document.getElementById('amount').textContent = parseFloat(total).toFixed(2);
    document.getElementById('payButton').innerHTML = `<i class="fas fa-lock"></i> Pay $${parseFloat(total).toFixed(2)}`;

    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    const cardForm = document.getElementById('cardForm');
    const paypalSection = document.getElementById('paypalSection');
    const payButton = document.getElementById('payButton');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            handlePaymentMethodChange(method.getAttribute('data-method'));
        });
    });

    function handlePaymentMethodChange(method) {
        cardForm.style.display = 'none';
        paypalSection.style.display = 'none';
        if(method === 'card'){ cardForm.style.display='block'; payButton.style.display='flex'; }
        else if(method === 'paypal'){ paypalSection.style.display='block'; payButton.style.display='none'; }
        else { payButton.innerHTML = `<i class="fas fa-lock"></i> Pay with ${method.charAt(0).toUpperCase() + method.slice(1)}`; payButton.style.display='flex'; }
    }

    // Card input formatting
    document.getElementById('cardNumber').addEventListener('input', e=>{
        let value = e.target.value.replace(/\s+/g,'').replace(/[^0-9]/gi,'');
        e.target.value = value.match(/.{1,4}/g)?.join(' ') || value;
    });
    document.getElementById('expiryDate').addEventListener('input', e=>{
        let value = e.target.value.replace(/\s+/g,'').replace(/[^0-9]/gi,'');
        if(value.length>=2) value = value.substring(0,2)+'/'+value.substring(2,4);
        e.target.value=value;
    });
    document.getElementById('zipCode').addEventListener('input', e=>{
        let value=e.target.value.replace(/\D/g,'');
        if(value.length>5)value=value.substring(0,5)+'-'+value.substring(5,9);
        e.target.value=value;
    });

    // Form submission
    document.getElementById('paymentForm').addEventListener('submit', async e=>{
        e.preventDefault();
        const selectedMethod = document.querySelector('.payment-method.active').getAttribute('data-method');
        if(selectedMethod==='paypal'){ processPayPalPayment(); return; }
        if(validateForm()){ await processPayment(selectedMethod); }
    });

    function validateForm(){
        let isValid=true;
        const selectedMethod = document.querySelector('.payment-method.active').getAttribute('data-method');
        document.querySelectorAll('.error-message').forEach(e=>e.style.display='none');

        const email=document.getElementById('email').value;
        if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ document.getElementById('emailError').style.display='block'; isValid=false; }

        const address=document.getElementById('address').value; if(!address){ document.getElementById('addressError').style.display='block'; isValid=false; }
        const city=document.getElementById('city').value; if(!city){ document.getElementById('cityError').style.display='block'; isValid=false; }
        const state=document.getElementById('state').value; if(!state){ document.getElementById('stateError').style.display='block'; isValid=false; }
        const zip=document.getElementById('zipCode').value; if(!zip){ document.getElementById('zipCodeError').style.display='block'; isValid=false; }

        if(selectedMethod==='card'){
            const cardNumber=document.getElementById('cardNumber').value.replace(/\s/g,'');
            const expiry=document.getElementById('expiryDate').value;
            const cvv=document.getElementById('cvv').value;
            const name=document.getElementById('cardholderName').value;
            if(cardNumber.length<13 || cardNumber.length>19){ document.getElementById('cardNumberError').style.display='block'; isValid=false; }
            if(!/^\d{2}\/\d{2}$/.test(expiry)){ document.getElementById('expiryDateError').style.display='block'; isValid=false; }
            if(cvv.length<3 || cvv.length>4){ document.getElementById('cvvError').style.display='block'; isValid=false; }
            if(!name){ document.getElementById('cardholderNameError').style.display='block'; isValid=false; }
        }

        return isValid;
    }

    async function processPayment(method){
        payButton.classList.add('loading');
        payButton.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Processing...`;
        await new Promise(r=>setTimeout(r,1500));
        document.getElementById('successMessage').style.display='block';
        payButton.style.display='none';
        payButton.classList.remove('loading');
    }

    function processPayPalPayment(){
        alert('Redirecting to PayPal...');
    }