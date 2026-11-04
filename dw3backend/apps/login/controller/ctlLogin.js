const jwt = require("jsonwebtoken");
const bCrypt = require("bcryptjs");
const mdlLogin = require("../model/mdlLogin");

const Login = async (req, res, next) => {
  try {
    const username = req.body && req.body.username ? String(req.body.username).trim() : "";
    const password = req.body && req.body.password ? String(req.body.password) : "";

    if (!username || !password) {
      return res.status(200).json({ message: "Login inválido!" });
    }

    const credencial = await mdlLogin.GetCredencial(username);
    if (credencial.length == 0) {
      return res.status(200).json({ message: "Usuário não identificado!" });
    }

    if (bCrypt.compareSync(password, credencial[0].password)) {
      const token = jwt.sign({ username }, process.env.SECRET_API, {
        expiresIn: 900, //espira em 15min
      });
      return res.json({ auth: true, token: token, username: username });
    }

    res.status(200).json({ message: "Login inválido!" });
  } catch (error) {
    console.error("[ctlLogin|Login]", error.message);
    res.status(200).json({ message: "Não foi possível entrar." });
  }
};

function AutenticaJWT(req, res, next) {
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) {
    return res
      .status(200)
      .json({ auth: false, message: "Não foi informado o token JWT" });
  }

  const bearer = tokenHeader.split(" ");
  const token = bearer[1];

  if (!token) {
    return res
      .status(200)
      .json({ auth: false, message: "Não foi informado o token JWT" });
  }

  jwt.verify(token, process.env.SECRET_API, function (err, decoded) {
    if (err) {
      return res
        .status(200)
        .json({ auth: false, message: "JWT inválido ou expirado" });
    }

    req.userId = decoded.username;
    next();
  });
}

const Logout = (req, res, next) => {
  res.json({ auth: false, token: null });
};

module.exports = {
  Login,
  Logout,
  AutenticaJWT,
};
