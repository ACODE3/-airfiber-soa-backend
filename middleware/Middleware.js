const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");

// Token Middleware
const verifyToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "No token, auth denied",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token is not valid",
    });
  }
};

// Autorize Middleware 
const authorizeRoles = (...allowedRoles) => {
    return(req,res,next) =>{
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message: "Access Denied"});
        }
        next();
    };
};

// Rate Limit Middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: "Too many login attempts. Try again later.",
  },
});

const clientLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: {
    message: "Too many requests. Please wait before refreshing.",
  },
});



module.exports = {
  authorizeRoles,
  verifyToken,
  loginLimiter,
  clientLimiter,
};