document.addEventListener('DOMContentLoaded', function() {
  dw3ClearIsLoggedCookie();

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('loginError');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    var servidorDw3 = form.dataset.servidorDw3;
    var usuario = document.getElementById('usuario').value;
    var senha = document.getElementById('senha').value;
    var submitButton = form.querySelector('button[type="submit"]');

    if (errorBox) {
      errorBox.classList.add('d-none');
      errorBox.textContent = '';
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Entrando...';
    }

    try {
      var response = await fetch(servidorDw3 + '/Login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          username: usuario,
          password: senha
        })
      });

      var data = await response.json();
      var token = data.token || data.Token || data.accessToken || data.AccessToken;

      if (!token) {
        throw new Error(data.message || 'Usuário ou senha inválidos.');
      }

      localStorage.setItem('token', token);
      document.cookie = 'IsLogged=true; path=/';

      window.location.href = '/home';
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = error.message || 'Não foi possível realizar o login.';
        errorBox.classList.remove('d-none');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
      }
    }
  });
});
