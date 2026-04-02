document.addEventListener('DOMContentLoaded', function () {
    const namas        = document.querySelectorAll('#nama');
    const emails       = document.querySelectorAll('#email');
    const passwords    = document.querySelectorAll('#password');
    const confirmPasss = document.querySelectorAll('#confirmPassword');
    const showPasses   = document.querySelectorAll('#showPassword');
    const btnRegs      = document.querySelectorAll('#btnRegister');
    const namaErrs     = document.querySelectorAll('#namaError');
    const emailErrs    = document.querySelectorAll('#emailError');
    const passErrs     = document.querySelectorAll('#passwordError');
    const confPassErrs = document.querySelectorAll('#confirmPasswordError');
    const formMsgs     = document.querySelectorAll('#formMessage');

    for (let i = 0; i < btnRegs.length; i++) {
        setupForm(
            namas[i], emails[i], passwords[i], confirmPasss[i], showPasses[i],
            btnRegs[i], namaErrs[i], emailErrs[i], passErrs[i], confPassErrs[i],
            formMsgs[i]
        );
    }

    function setupForm(namaInput, emailInput, passwordInput, confirmPassInput, showPassCheck,
                       submitBtn, namaError, emailError, passwordError, confirmPassError,
                       formMessage) {
        if (!submitBtn || !namaInput || !emailInput || !passwordInput) return;

        showPassCheck.addEventListener('change', function () {
            const type = this.checked ? 'text' : 'password';
            passwordInput.type    = type;
            confirmPassInput.type = type;
        });

        function showError(element, message) {
            element.textContent = message;
            element.classList.remove('hidden');
        }

        function clearError(element) {
            element.textContent = '';
            element.classList.add('hidden');
        }

        function showFormMessage(message, type = 'error') {
            formMessage.textContent = message;
            formMessage.className = 'text-sm text-center px-4 py-2 rounded-lg ';
            formMessage.className += type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700';
            formMessage.classList.remove('hidden');
        }

        function clearFormMessage() {
            formMessage.textContent = '';
            formMessage.classList.add('hidden');
        }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function validate() {
            let valid = true;
            clearError(namaError);
            clearError(emailError);
            clearError(passwordError);
            clearError(confirmPassError);
            clearFormMessage();

            const nama        = namaInput.value.trim();
            const email       = emailInput.value.trim();
            const password    = passwordInput.value;
            const confirmPass = confirmPassInput.value;

            if (!nama) {
                showError(namaError, 'Nama lengkap tidak boleh kosong.');
                valid = false;
            } else if (nama.length < 3) {
                showError(namaError, 'Nama minimal 3 karakter.');
                valid = false;
            }

            if (!email) {
                showError(emailError, 'Email tidak boleh kosong.');
                valid = false;
            } else if (!validateEmail(email)) {
                showError(emailError, 'Format email tidak valid.');
                valid = false;
            }

            if (!password) {
                showError(passwordError, 'Password tidak boleh kosong.');
                valid = false;
            } else if (password.length < 6) {
                showError(passwordError, 'Password minimal 6 karakter.');
                valid = false;
            }

            if (!confirmPass) {
                showError(confirmPassError, 'Konfirmasi password tidak boleh kosong.');
                valid = false;
            } else if (password !== confirmPass) {
                showError(confirmPassError, 'Password tidak cocok.');
                valid = false;
            }

            return valid;
        }

        namaInput.addEventListener('input', () => clearError(namaError));
        emailInput.addEventListener('input', () => clearError(emailError));
        passwordInput.addEventListener('input', () => clearError(passwordError));
        confirmPassInput.addEventListener('input', () => clearError(confirmPassError));

        submitBtn.addEventListener('click', async function () {
            if (!validate()) return;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Loading...';

            const formData = new FormData();
            formData.append('nama', namaInput.value.trim());
            formData.append('email', emailInput.value.trim());
            formData.append('password', passwordInput.value);
            formData.append('confirmPassword', confirmPassInput.value);

            try {
                const response = await fetch('../backend/auth/register.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showFormMessage(result.message, 'success');
                    if (result.requires_verification) {
                        setTimeout(() => { window.location.href = `verify.html?email=${encodeURIComponent(emailInput.value.trim())}`; }, 1700);
                    } else {
                        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    }
                } else {
                    showFormMessage(result.message || 'Registrasi gagal.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SIGN UP';
                }
            } catch (error) {
                showFormMessage('Terjadi kesalahan pada server saat registrasi.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'SIGN UP';
            }
        });
    }
});