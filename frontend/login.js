document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message');

    errorMessage.textContent = '';

    if (username === 'Shubham' && password === 'shuchak') {
        localStorage.setItem('user', username);
        window.location.href = 'index.html';
    } else {
        errorMessage.textContent = 'Invalid username or password. Please try again.';
    }
});
