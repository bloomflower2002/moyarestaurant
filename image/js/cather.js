window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {          // trigger after 50px scroll
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
})

    // Simple form validation
    document.getElementById('cateringForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if policy is agreed
      const policyAgreed = document.getElementById('policy-agree').checked;
      
      if (!policyAgreed) {
        alert('Please agree to the Privacy Policy and Terms and Conditions to continue.');
        return;
      }
      
      // If all validations pass
      alert('Thank you for your catering request! We will contact you within 24 hours.');
      this.reset();
    });

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;