import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'


export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) return res.status(401).json({ message: 'Token not provided' })

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' })
        ;(req as any).user = user
        next()
    })
}


