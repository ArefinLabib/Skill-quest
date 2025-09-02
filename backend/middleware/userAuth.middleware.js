import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed Authorization header' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { 
            id: payload.id || payload.sub, 
            role: payload.role,
            name: payload.name,
            email: payload.email
        };
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;


  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }


  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }


  const passwordRegex = /^(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and contain at least 1 number",
    });
  }


  if (!["student", "mentor"].includes(role)) {
    return res.status(400).json({ message: "Role must be student or mentor" });
  }


  next();
};


export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};