(function(){
  const form = document.getElementById('signupForm');
  const liveRegion = document.getElementById('live-region');
  const successPanel = document.getElementById('successPanel');
  const payloadOutput = document.getElementById('payloadOutput');
  const card = document.querySelector('.card');
  const banner = document.getElementById('errorBanner');
  const successBanner = document.getElementById('successBanner');
  const toggleModeBtn = document.getElementById('toggleModeBtn');
  const footnoteText = document.getElementById('footnoteText');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const submitBtn = document.getElementById('submitBtn');
  const signupFields = document.getElementById('signupFields');
  const loginFields = document.getElementById('loginFields');
  const resetBtn = document.getElementById('resetBtn');

  let isLoginMode = false;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_RE = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

  // Signup validation gates
  const signupGates = {
    fullName: {
      test: (v) => v.trim().length > 0,
      message: 'Enter your name to continue.'
    },
    email: {
      test: (v) => EMAIL_RE.test(v.trim()),
      message: 'Enter a valid email address, e.g. name@example.com.'
    },
    password: {
      test: (v) => PASSWORD_RE.test(v),
      message: 'Password must be 8+ characters with upper, lower, number, and a symbol.'
    },
    confirmPassword: {
      test: (v) => v === document.getElementById('password').value && v.length > 0,
      message: function(v) {
        return v.length === 0 ? 'Confirm your password.' : 'This does not match the password above.';
      }
    }
  };

  // Login validation gates
  const loginGates = {
    loginEmail: {
      test: (v) => EMAIL_RE.test(v.trim()),
      message: 'Enter a valid email address, e.g. name@example.com.'
    },
    loginPassword: {
      test: (v) => v.length > 0,
      message: 'Please enter your password.'
    }
  };

  const signupFieldIds = Object.keys(signupGates);
  const loginFieldIds = Object.keys(loginGates);

  const fieldLabels = {
    fullName: 'Full name',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    loginEmail: 'Email address',
    loginPassword: 'Password'
  };

  function setStatus(id, state, message){
    const input = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    const errorEl = document.getElementById(id + '-error');

    if(!input || !icon || !errorEl) return;

    // Reset previous states
    input.classList.remove('is-valid');
    icon.classList.remove('show', 'pass', 'fail');
    errorEl.classList.remove('show');
    errorEl.textContent = '';

    if(state === 'pass'){
      input.setAttribute('aria-invalid', 'false');
      input.classList.add('is-valid');
      icon.textContent = '✓';
      icon.classList.add('show', 'pass');
    } else if(state === 'fail'){
      input.setAttribute('aria-invalid', 'true');
      icon.textContent = '✕';
      icon.classList.add('show', 'fail');
      errorEl.textContent = message;
      errorEl.classList.add('show');
    } else {
      input.setAttribute('aria-invalid', 'false');
    }
  }

  function joinWithAnd(items){
    if(items.length === 0) return '';
    if(items.length === 1) return items[0];
    if(items.length === 2) return items[0] + ' and ' + items[1];
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
  }

  function resolveMessage(gate, value){
    return typeof gate.message === 'function' ? gate.message(value) : gate.message;
  }

  function validateField(id, gates, announce){
    const input = document.getElementById(id);
    if(!input) return true;
    
    const value = input.value;
    const gate = gates[id];
    if(!gate) return true;
    
    const passed = gate.test(value);
    const message = resolveMessage(gate, value);
    setStatus(id, passed ? 'pass' : 'fail', message);
    
    if(announce){
      liveRegion.textContent = passed
        ? (fieldLabels[id] || id) + ' looks good.'
        : message;
    }
    return passed;
  }

  function validateAllFields(announce){
    let allPassed = true;
    const gates = isLoginMode ? loginGates : signupGates;
    const fieldIds = isLoginMode ? loginFieldIds : signupFieldIds;
    const invalidFields = [];

    fieldIds.forEach((id) => {
      const passed = validateField(id, gates, false);
      if(!passed) {
        allPassed = false;
        invalidFields.push(id);
      }
    });

    // Check terms (only for signup)
    if(!isLoginMode){
      const terms = document.getElementById('terms');
      const termsError = document.getElementById('terms-error');
      if(!terms.checked){
        termsError.textContent = 'You need to accept the terms to continue.';
        termsError.classList.add('show');
        allPassed = false;
      } else {
        termsError.classList.remove('show');
        termsError.textContent = '';
      }
    }

    if(announce && !allPassed){
      const emptyIds = invalidFields.filter(id => document.getElementById(id).value.length === 0);
      const filledButInvalidIds = invalidFields.filter(id => document.getElementById(id).value.length > 0);

      const parts = [];
      if(emptyIds.length){
        parts.push('fill in ' + joinWithAnd(emptyIds.map(id => fieldLabels[id])));
      }
      if(filledButInvalidIds.length){
        parts.push('fix ' + joinWithAnd(filledButInvalidIds.map(id => fieldLabels[id])));
      }
      if(!isLoginMode){
        const terms = document.getElementById('terms');
        if(!terms.checked){
          parts.push('accept the Terms');
        }
      }

      const message = 'Please ' + joinWithAnd(parts) + '.';
      showBanner(message, 'error');
      liveRegion.textContent = 'Submission blocked. ' + message;
    }

    return allPassed;
  }

  function showBanner(message, type = 'error'){
    if(type === 'error'){
      banner.textContent = message;
      banner.classList.add('show');
      successBanner.classList.remove('show');
    } else if(type === 'success'){
      successBanner.textContent = message;
      successBanner.classList.add('show');
      banner.classList.remove('show');
    }
  }

  function hideBanners(){
    banner.classList.remove('show');
    banner.textContent = '';
    successBanner.classList.remove('show');
    successBanner.textContent = '';
  }

  function toggleMode(){
    isLoginMode = !isLoginMode;
    hideBanners();
    
    if(isLoginMode){
      // Switch to Login
      formTitle.textContent = 'Welcome back';
      formSubtitle.textContent = 'Log in to your account to continue.';
      submitBtn.textContent = 'Log in';
      footnoteText.textContent = "Don't have an account? ";
      toggleModeBtn.textContent = 'Sign up';
      signupFields.style.display = 'none';
      loginFields.style.display = 'block';
      
      // Clear signup field statuses
      signupFieldIds.forEach(id => setStatus(id, 'neutral', ''));
      
      // Clear login field statuses
      loginFieldIds.forEach(id => setStatus(id, 'neutral', ''));
      
      // Reset login form
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
      document.getElementById('rememberMe').checked = false;
      
      liveRegion.textContent = 'Switched to login mode.';
    } else {
      // Switch to Sign Up
      formTitle.textContent = 'Create your account';
      formSubtitle.textContent = 'Start your free workspace in under a minute.';
      submitBtn.textContent = 'Create account';
      footnoteText.textContent = "Already have an account? ";
      toggleModeBtn.textContent = 'Log in';
      signupFields.style.display = 'block';
      loginFields.style.display = 'none';
      
      // Clear login field statuses
      loginFieldIds.forEach(id => setStatus(id, 'neutral', ''));
      
      // Reset signup form
      document.getElementById('fullName').value = '';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('confirmPassword').value = '';
      document.getElementById('terms').checked = false;
      
      // Reset strength meter
      document.querySelectorAll('.strength-seg').forEach(seg => seg.classList.remove('on'));
      document.getElementById('strengthLabel').textContent = '8+ characters, upper & lower case, a number, and a symbol';
      
      liveRegion.textContent = 'Switched to sign up mode.';
    }
    
    // Focus first field
    const firstField = isLoginMode ? 'loginEmail' : 'fullName';
    document.getElementById(firstField).focus();
  }

  // Setup event listeners for validation
  function setupValidation(){
    // Signup field validation
    signupFieldIds.forEach((id) => {
      const input = document.getElementById(id);
      if(!input) return;
      
      input.addEventListener('blur', function() {
        if(this.value.length === 0 && id !== 'confirmPassword'){
          setStatus(id, 'neutral', '');
          return;
        }
        validateField(id, signupGates, true);
      });

      if(id === 'password'){
        input.addEventListener('input', function() {
          const confirmInput = document.getElementById('confirmPassword');
          if(confirmInput && confirmInput.value.length > 0){
            validateField('confirmPassword', signupGates, false);
          }
        });
      }
    });

    // Login field validation
    loginFieldIds.forEach((id) => {
      const input = document.getElementById(id);
      if(!input) return;
      
      input.addEventListener('blur', function() {
        if(this.value.length === 0){
          setStatus(id, 'neutral', '');
          return;
        }
        validateField(id, loginGates, true);
      });
    });
  }

  // Password strength meter
  document.getElementById('password').addEventListener('input', function(){
    if(isLoginMode) return;
    
    const v = this.value;
    let score = 0;
    if(v.length >= 8) score++;
    if(/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[#?!@$%^&*-]/.test(v)) score++;

    const segs = document.querySelectorAll('.strength-seg');
    const label = document.getElementById('strengthLabel');
    const labels = ['Too weak', 'Weak', 'Getting there', 'Strong', 'Excellent'];
    
    segs.forEach((seg, i) => {
      seg.classList.toggle('on', i < score);
    });
    label.textContent = v.length === 0
      ? '8+ characters, upper & lower case, a number, and a symbol'
      : labels[score];
  });

  // Toggle password visibility
  document.querySelectorAll('.toggle-pw').forEach((btn) => {
    btn.addEventListener('click', function() {
      const target = document.getElementById(this.dataset.target);
      if(!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      this.textContent = isHidden ? 'Hide' : 'Show';
      this.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });

  // Toggle mode button
  toggleModeBtn.addEventListener('click', function(e){
    e.preventDefault();
    toggleMode();
  });

  // Form submission
  form.addEventListener('submit', function(event){
    event.preventDefault();
    hideBanners();

    // Validate all fields
    const allPassed = validateAllFields(true);

    if(!allPassed){
      // Shake animation
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');

      // Focus first invalid field
      const fieldIds = isLoginMode ? loginFieldIds : signupFieldIds;
      const firstInvalid = fieldIds.find(id => document.getElementById(id).getAttribute('aria-invalid') === 'true');
      if(firstInvalid){
        document.getElementById(firstInvalid).focus();
      } else if(!isLoginMode){
        const terms = document.getElementById('terms');
        if(!terms.checked) terms.focus();
      }
      return;
    }

    // Success - build payload
    if(isLoginMode){
      // Login success
      const payload = {
        email: document.getElementById('loginEmail').value.trim(),
        password: '••••••••',
        rememberMe: document.getElementById('rememberMe').checked,
        submittedAt: new Date().toISOString()
      };

      payloadOutput.textContent = JSON.stringify(payload, null, 2);
      document.getElementById('successTitle').textContent = 'Welcome back!';
      document.getElementById('successDescription').textContent = 'You have successfully logged in. Here\'s the payload that would be sent to the server:';
      resetBtn.textContent = 'Log out';
      liveRegion.textContent = 'Login successful.';
      
      form.style.display = 'none';
      successPanel.classList.add('show');
    } else {
      // Signup success
      const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: '••••••••',
        termsAccepted: true,
        submittedAt: new Date().toISOString()
      };

      payloadOutput.textContent = JSON.stringify(payload, null, 2);
      document.getElementById('successTitle').textContent = "You're all set";
      document.getElementById('successDescription').textContent = 'Your account request cleared every check. Here\'s the payload that would be sent to the server:';
      resetBtn.textContent = 'Create another account';
      liveRegion.textContent = 'Account created successfully.';
      
      form.style.display = 'none';
      successPanel.classList.add('show');
    }

    showBanner('Success!', 'success');
  });

  // Reset button
  resetBtn.addEventListener('click', function() {
    form.reset();
    
    // Reset all statuses
    signupFieldIds.forEach((id) => setStatus(id, 'neutral', ''));
    loginFieldIds.forEach((id) => setStatus(id, 'neutral', ''));
    
    // Reset strength meter
    document.querySelectorAll('.strength-seg').forEach((seg) => seg.classList.remove('on'));
    document.getElementById('strengthLabel').textContent = '8+ characters, upper & lower case, a number, and a symbol';
    
    // Reset terms error
    document.getElementById('terms-error').classList.remove('show');
    document.getElementById('terms-error').textContent = '';
    
    // Hide banners
    hideBanners();
    
    // Reset success panel
    successPanel.classList.remove('show');
    form.style.display = '';
    liveRegion.textContent = '';
    
    // Reset button text
    resetBtn.textContent = isLoginMode ? 'Log out' : 'Create another account';
    
    // Reset to signup mode if in login mode
    if(isLoginMode){
      toggleMode();
    }
    
    // Focus first field
    document.getElementById('fullName').focus();
  });

  // Initialize validation
  setupValidation();

  // Initial state - signup mode
  document.getElementById('fullName').focus();

})();
