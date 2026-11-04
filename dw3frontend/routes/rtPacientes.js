var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('pacientes/vwLstPacientes', {
    title: 'Pacientes',
    showNavbar: true,
    activeMenu: 'pacientes',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

router.get('/form', function(req, res) {
  res.render('pacientes/vwFormPacientes', {
    title: 'Formulário de pacientes',
    showNavbar: true,
    activeMenu: 'pacientes',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

module.exports = router;
