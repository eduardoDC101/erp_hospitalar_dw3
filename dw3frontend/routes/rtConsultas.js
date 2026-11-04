var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('consultas/vwLstConsultas', {
    title: 'Consultas',
    showNavbar: true,
    activeMenu: 'consultas',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

router.get('/form', function(req, res) {
  res.render('consultas/vwFormConsultas', {
    title: 'Formulário de consultas',
    showNavbar: true,
    activeMenu: 'consultas',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

module.exports = router;
