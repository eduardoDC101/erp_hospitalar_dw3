const express = require("express");
const routerApp = express.Router();

const appPacientes = require("../apps/pacientes/controller/ctlPacientes");
const appConsultas = require("../apps/consultas/controller/ctlConsultas");
const appLogin = require("../apps/login/controller/ctlLogin");

routerApp.use((req, res, next) => {
  next();
});

routerApp.get("/", (req, res) => {
  res.send("API de Gestão Hospitalar");
});

routerApp.get("/getAllPacientes", appLogin.AutenticaJWT, appPacientes.GetAllPacientes);
routerApp.get("/getPacienteByID/:id", appLogin.AutenticaJWT, appPacientes.GetPacienteByID);
routerApp.post("/insertPaciente", appLogin.AutenticaJWT, appPacientes.InsertPaciente);
routerApp.put("/updatePaciente/:id", appLogin.AutenticaJWT, appPacientes.UpdatePaciente);
routerApp.delete("/deletePaciente/:id", appLogin.AutenticaJWT, appPacientes.DeletePaciente);

routerApp.get("/getAllConsultas", appLogin.AutenticaJWT, appConsultas.GetAllConsultas);
routerApp.get("/getConsultaByID/:id", appLogin.AutenticaJWT, appConsultas.GetConsultaByID);
routerApp.post("/insertConsulta", appLogin.AutenticaJWT, appConsultas.InsertConsulta);
routerApp.put("/updateConsulta/:id", appLogin.AutenticaJWT, appConsultas.UpdateConsulta);
routerApp.delete("/deleteConsulta/:id", appLogin.AutenticaJWT, appConsultas.DeleteConsulta);

routerApp.post("/Login", appLogin.Login);
routerApp.post("/Logout", appLogin.Logout);

module.exports = routerApp;
